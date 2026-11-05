// Full list with status tabs, sort, and filters by category and card.
// We fetch every subscription once and filter/sort in the browser: the list
// is small, it lets us show counts on every tab, and switching is instant.
import { useState } from "react";
import type { Category, Status, Subscription } from "../api/types";
import { Dropdown, type MenuItem } from "../components/Dropdown";
import { EmptyState } from "../components/EmptyState";
import { Segmented } from "../components/Segmented";
import { LoadError, Loading, ScreenHeader } from "../components/ScreenHeader";
import { RowGroup, SubRow } from "../components/SubRow";
import { subscriptionRow } from "../components/rowProps";
import { usePaymentLabels, usePaymentMethods, useSubscriptions } from "../data/queries";
import { thumbBg } from "../lib/cardStyle";
import { CATEGORY_COLOR } from "../lib/categories";
import { toNum } from "../lib/format";
import { dualText, monthlyTotals, scaleDual } from "../lib/money";
import { useUi } from "../ui/UiContext";
import { useIsDesktop } from "../ui/useIsDesktop";
import { CATEGORIES } from "../api/types";

type Tab = Status | "all";
type Sort = "renewal" | "cost" | "name";
const SORTS: { key: Sort; label: string }[] = [
  { key: "renewal", label: "Renewal" },
  { key: "cost", label: "Cost" },
  { key: "name", label: "Name" },
];
const STATUS_ORDER: Record<Status, number> = { active: 0, paused: 1, cancelled: 2 };

const sorters: Record<Sort, (a: Subscription, b: Subscription) => number> = {
  renewal: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.next_renewal.localeCompare(b.next_renewal),
  // Same order as the API's sort=cost: ₹ subscriptions first (highest yearly
  // cost first), then $ ones. ₹ and $ are never compared with each other.
  cost: (a, b) =>
    a.currency !== b.currency ? (a.currency === "INR" ? -1 : 1) : toNum(b.yearly_amount) - toNum(a.yearly_amount),
  name: (a, b) => a.merchant_name.localeCompare(b.merchant_name),
};

export function Subscriptions() {
  const subs = useSubscriptions();
  const pmsQ = usePaymentMethods();
  const labels = usePaymentLabels();
  const { openSubscription } = useUi();
  const desk = useIsDesktop();

  const [tab, setTab] = useState<Tab>("active");
  const [sort, setSort] = useState<Sort>("renewal");
  const [cat, setCat] = useState<Category | null>(null);
  const [pay, setPay] = useState<string | null>(null);
  const [menu, setMenu] = useState<"sort" | "cat" | "pay" | null>(null);

  const all = subs.data ?? [];
  const pms = pmsQ.data ?? [];
  const pmById = new Map(pms.map((p) => [p.id, p]));
  const active = all.filter((s) => s.status === "active");
  const yearly = scaleDual(monthlyTotals(all), 12);

  const header = (
    <ScreenHeader
      eyebrow={subs.data ? `${active.length} active · ${dualText(yearly)} a year` : " "}
      title="Subscriptions"
    />
  );
  if (subs.isError) return <div className="flex flex-col gap-[18px]">{header}<LoadError onRetry={() => subs.refetch()} /></div>;
  if (!subs.data) return <div className="flex flex-col gap-[18px]">{header}<Loading /></div>;
  if (all.length === 0) return <div className="flex flex-col gap-[18px]">{header}<EmptyState /></div>;

  const count = (t: Tab) => (t === "all" ? all.length : all.filter((s) => s.status === t).length);
  const list = all
    .filter((s) => tab === "all" || s.status === tab)
    .filter((s) => !cat || s.category === cat)
    .filter((s) => !pay || s.payment_method_id === pay)
    .sort(sorters[sort]);
  const hasFilters = !!(cat || pay);
  const close = () => setMenu(null);
  const toggle = (m: NonNullable<typeof menu>) => () => setMenu(menu === m ? null : m);

  const sortItems: MenuItem[] = SORTS.map((s) => ({
    key: s.key,
    label: s.label,
    checked: sort === s.key,
    onSelect: () => (setSort(s.key), close()),
  }));
  const catItems: MenuItem[] = [
    { key: "all", label: "All categories", checked: !cat, onSelect: () => (setCat(null), close()) },
    ...CATEGORIES.filter((c) => all.some((s) => s.category === c)).map((c) => ({
      key: c,
      label: c,
      checked: cat === c,
      dot: CATEGORY_COLOR[c],
      onSelect: () => (setCat(c), close()),
    })),
  ];
  const payItems: MenuItem[] = [
    { key: "all", label: "All cards and UPI", checked: !pay, onSelect: () => (setPay(null), close()) },
    ...pms
      .filter((p) => all.some((s) => s.payment_method_id === p.id))
      .map((p) => ({
        key: p.id,
        label: labels.get(p.id) ?? p.display_name,
        checked: pay === p.id,
        thumb: thumbBg(p),
        onSelect: () => (setPay(p.id), close()),
      })),
  ];

  const tabLabel = (label: string, t: Tab) => (
    <>
      {label} <span className="font-normal text-fg3">{count(t)}</span>
    </>
  );

  return (
    <div className="flex animate-screen-in flex-col gap-[18px]">
      {header}
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "active", label: tabLabel("Active", "active") },
          { value: "paused", label: tabLabel("Paused", "paused") },
          { value: "cancelled", label: tabLabel("Cancelled", "cancelled") },
          { value: "all", label: tabLabel("All", "all") },
        ]}
      />

      <div className="relative z-5 flex flex-wrap gap-2">
        <Dropdown
          label={
            <>
              <span className="text-fg2">Sort</span>
              {SORTS.find((s) => s.key === sort)!.label}
            </>
          }
          open={menu === "sort"}
          onToggle={toggle("sort")}
          items={sortItems}
        />
        <Dropdown label={cat ?? "Category"} active={!!cat} open={menu === "cat"} onToggle={toggle("cat")} items={catItems} minWidth={210} />
        <Dropdown
          label={pay ? (labels.get(pay) ?? "Card") : "Card"}
          active={!!pay}
          open={menu === "pay"}
          onToggle={toggle("pay")}
          items={payItems}
          align={desk ? "left" : "right"}
          minWidth={230}
        />
        {hasFilters && (
          <button type="button" onClick={() => (setCat(null), setPay(null), close())} className="h-[34px] border-none bg-transparent px-3 text-[13px] text-fg2">
            Clear
          </button>
        )}
      </div>
      {/* Tap anywhere else to close an open menu. */}
      {menu && <div onClick={close} className="fixed inset-0 z-4" />}

      {list.length > 0 ? (
        <RowGroup>
          {list.map((s, i) => (
            <SubRow
              key={s.id}
              {...subscriptionRow(s, s.payment_method_id ? pmById.get(s.payment_method_id) : undefined, {
                divider: i > 0,
                onClick: () => openSubscription(s),
                label: s.payment_method_id ? labels.get(s.payment_method_id) : undefined,
              })}
            />
          ))}
        </RowGroup>
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
          <span className="text-[15px] text-fg2">{hasFilters ? "Nothing matches these filters." : `No ${tab} subscriptions.`}</span>
          {hasFilters && (
            <button type="button" onClick={() => (setCat(null), setPay(null))} className="h-[34px] rounded-[17px] border-none bg-s2 px-3.5 text-[13px] text-fg">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
