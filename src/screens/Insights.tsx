import { useState } from "react";
import type { Period, Subscription } from "../api/types";
import { DonutChart } from "../components/ui/donut-chart";
import { PillNavigation } from "../components/ui/pill-navigation";
import { EmptyState } from "../components/EmptyState";
import { MerchantLogo } from "../components/MerchantLogo";
import { LoadError, Loading, ScreenHeader } from "../components/ScreenHeader";
import { useInsights, usePaymentLabels, usePaymentMethodMap, useSubscriptions } from "../data/queries";
import { CATEGORY_COLOR, RANK_PALETTE } from "../lib/categories";
import { CYCLES } from "../lib/cycles";
import { groupINR, price, toNum } from "../lib/format";
import { useUi } from "../ui/UiContext";
import { usdText } from "../lib/money";

type View = "cat" | "pay" | "top";
const PERIODS = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

/** One slice of a donut, plus the key used to remember which one is selected. */
interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function Insights() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [view, setView] = useState<View>("cat");
  const insights = useInsights(period);
  const subs = useSubscriptions();
  const labels = usePaymentLabels();

  const header = <ScreenHeader eyebrow="Active subscriptions only" title="Insights" />;

  if (insights.isError || subs.isError)
    return <div className="flex max-w-[720px] flex-col gap-[18px]">{header}<LoadError onRetry={() => (insights.refetch(), subs.refetch())} /></div>;
  if (!subs.data) return <div className="flex max-w-[720px] flex-col gap-[18px]">{header}<Loading /></div>;
  if (subs.data.length === 0) return <div className="flex max-w-[720px] flex-col gap-[18px]">{header}<EmptyState /></div>;

  const subById = new Map(subs.data.map((s) => [s.id, s]));
  const d = insights.data;

  return (
    <div className="flex max-w-[720px] animate-screen-in flex-col gap-[18px]">
      {header}
      {/* easyui pill navigation: views on top, Monthly / Yearly as the sub-row of the two charts. */}
      <div className="flex justify-center min-[900px]:justify-start">
        <PillNavigation
          aria-label="Insights view"
          defaultValue={view}
          defaultSubValue={period}
          items={[
            { id: "cat", label: "Category", children: PERIODS },
            { id: "pay", label: "Card", children: PERIODS },
            { id: "top", label: "Top" },
          ]}
          onChange={(id, sub) => {
            setView(id as View);
            if (sub) setPeriod(sub as Period);
          }}
        />
      </div>
      <div className="flex w-full max-w-[720px] flex-col gap-4">
        {!d ? (
          <Loading />
        ) : view === "cat" ? (
          <DonutCard
            key="cat"
            title="By category"
            period={period}
            unit={["category", "categories"]}
            subById={subById}
            groups={d.by_category.map((c) => ({
              slice: { key: c.category, label: c.category, value: toNum(c.amount), color: CATEGORY_COLOR[c.category] },
              ids: c.subscription_ids,
            }))}
          />
        ) : view === "pay" ? (
          <DonutCard
            key="pay"
            title="By card or UPI"
            period={period}
            unit={["method", "methods"]}
            subById={subById}
            groups={d.by_payment_method.map((p, i) => ({
              slice: {
                key: p.payment_method_id ?? "none",
                label: p.payment_method_id ? (labels.get(p.payment_method_id) ?? p.name) : "Unassigned",
                value: toNum(p.amount),
                color: RANK_PALETTE[i % RANK_PALETTE.length],
              },
              ids: p.subscription_ids,
            }))}
          />
        ) : (
          <TopList items={d.most_expensive} subById={subById} />
        )}
        {d && d.usd_subscriptions.length > 0 && (
          <UsdList items={d.usd_subscriptions} subById={subById} perMonth={view !== "top" && period === "monthly"} />
        )}
      </div>
    </div>
  );
}

interface DonutCardProps {
  title: string;
  period: Period;
  /** [singular, plural], e.g. ["category", "categories"]. */
  unit: [string, string];
  groups: { slice: Slice; ids: string[] }[];
  subById: Map<string, Subscription>;
}

function DonutCard({ title, period, unit, groups, subById }: DonutCardProps) {
  const { openSubscription } = useUi();
  const [selected, setSelected] = useState<string | null>(null);
  const slices = groups.map((g) => g.slice);
  const sel = groups.find((g) => g.slice.key === selected);
  const perPeriod = (s: Subscription) => toNum(s.yearly_amount) / (period === "yearly" ? 1 : 12); // chart slices only hold ₹ subs
  const selSubs = (sel?.ids ?? [])
    .map((id) => subById.get(id))
    .filter((s): s is Subscription => !!s)
    .sort((a, b) => perPeriod(b) - perPeriod(a));
  const toggle = (key: string) => setSelected(selected === key ? null : key);

  return (
    <section className="flex flex-col gap-[18px] rounded-[20px] bg-s1 p-5 shadow-lift">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold tracking-[-0.01em]">{title}</h2>
        <span className="text-[12.5px] text-fg3">Tap a slice</span>
      </div>
      {/* easyui donut chart: hover or tap a slice to read it; tapping also lists its subscriptions below. */}
      <DonutChart
        data={slices.map((x) => ({ label: x.label, value: x.value, color: x.color }))}
        centerLabel={`${period === "yearly" ? "Per year" : "Per month"} · ${slices.length} ${unit[slices.length === 1 ? 0 : 1]}`}
        formatValue={(n) => `₹${groupINR(n)}`}
        ariaLabel={`${title}, ${period === "yearly" ? "per year" : "per month"}`}
        onSliceClick={(i) => toggle(slices[i].key)}
      />
      {sel && (
        <div className="flex animate-fade-in flex-col border-t border-hair pt-3">
          <div className="flex items-center justify-between px-0.5 pb-1.5">
            <span className="flex items-center gap-2 text-[13px] font-semibold">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: sel.slice.color }} />
              {sel.slice.label}
              <span className="font-normal text-fg3">
                {selSubs.length === 1 ? "1 subscription" : `${selSubs.length} subscriptions`}
              </span>
            </span>
            <button type="button" onClick={() => setSelected(null)} className="border-none bg-transparent p-0 text-[13px] text-fg2">
              Done
            </button>
          </div>
          {selSubs.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openSubscription(s)}
              className="flex h-12 items-center gap-3 border-none bg-transparent px-0.5 text-left text-inherit"
            >
              <MerchantLogo name={s.merchant_name} logoUrl={s.logo_url} size={32} radius={9} />
              <span className="min-w-0 flex-1 text-sm">{s.merchant_name}</span>
              <span className="text-sm font-medium tabular-nums">₹{groupINR(perPeriod(s))}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function TopList({ items, subById }: { items: { subscription_id: string; merchant_name: string; yearly_inr: string }[]; subById: Map<string, Subscription> }) {
  const { openSubscription } = useUi();
  const pms = usePaymentMethodMap();
  const labels = usePaymentLabels();
  const max = items.length ? toNum(items[0].yearly_inr) : 1;

  return (
    <section className="flex animate-screen-in flex-col gap-1.5 rounded-[20px] bg-s1 p-5 shadow-lift">
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 className="m-0 text-base font-semibold tracking-[-0.01em]">Most expensive</h2>
        <span className="text-[12.5px] text-fg3">Yearly cost</span>
      </div>
      {items.map((t) => {
        const s = subById.get(t.subscription_id);
        const pm = s?.payment_method_id ? pms.get(s.payment_method_id) : undefined;
        const meta = s ? `${price(s.amount, s.currency)}${CYCLES[s.billing_cycle].short}${pm ? " · " + (labels.get(pm.id) ?? pm.display_name) : ""}` : "";
        return (
          <button
            key={t.subscription_id}
            type="button"
            onClick={() => s && openSubscription(s)}
            className="flex flex-col gap-2 border-none bg-transparent py-2 text-left text-inherit"
          >
            <div className="flex items-center gap-3">
              <MerchantLogo name={t.merchant_name} logoUrl={s?.logo_url} size={32} radius={9} />
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-sm font-medium">{t.merchant_name}</span>
                <span className="text-xs text-fg3">{meta}</span>
              </div>
              <span className="text-[15px] font-semibold tabular-nums">₹{groupINR(toNum(t.yearly_inr))}</span>
            </div>
            <div className="ml-11 h-1 overflow-hidden rounded-sm bg-s2">
              <div
                className="h-full rounded-sm bg-fg"
                style={{ width: `${((toNum(t.yearly_inr) / max) * 100).toFixed(1)}%`, transition: "width .8s cubic-bezier(.2,.9,.3,1)" }}
              />
            </div>
          </button>
        );
      })}
    </section>
  );
}

/**
 * $ subscriptions aren't converted to ₹, so they can't sit in the ₹ charts.
 * They get their own small list, totalled in $.
 */
function UsdList({
  items,
  subById,
  perMonth,
}: {
  items: { subscription_id: string; merchant_name: string; yearly_amount: string }[];
  subById: Map<string, Subscription>;
  perMonth: boolean;
}) {
  const { openSubscription } = useUi();
  const k = perMonth ? 1 / 12 : 1;
  const total = items.reduce((a, t) => a + toNum(t.yearly_amount) * k, 0);
  return (
    <section className="flex animate-fade-in flex-col gap-1 rounded-[20px] bg-s1 p-5 shadow-lift">
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 className="m-0 text-base font-semibold tracking-[-0.01em]">Paid in USD</h2>
        <span className="text-[13px] font-medium tabular-nums">
          {usdText(total)}
          <span className="font-normal text-fg3">{perMonth ? "/mo" : "/yr"}</span>
        </span>
      </div>
      {items.map((t) => {
        const s = subById.get(t.subscription_id);
        return (
          <button
            key={t.subscription_id}
            type="button"
            onClick={() => s && openSubscription(s)}
            className="flex h-12 items-center gap-3 border-none bg-transparent px-0.5 text-left text-inherit"
          >
            <MerchantLogo name={t.merchant_name} logoUrl={s?.logo_url} size={32} radius={9} />
            <span className="min-w-0 flex-1 text-sm">{t.merchant_name}</span>
            <span className="text-sm font-medium tabular-nums">{usdText(toNum(t.yearly_amount) * k)}</span>
          </button>
        );
      })}
    </section>
  );
}
