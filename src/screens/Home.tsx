import { useState } from "react";
import { Link } from "react-router";
import { EmptyState } from "../components/EmptyState";
import { BellIcon, ThemeIcon } from "../components/Icons";
import { useTheme } from "../ui/theme";
import { LoadError, Loading, ScreenHeader, SectionTitle } from "../components/ScreenHeader";
import { RowGroup, SubRow } from "../components/SubRow";
import { upcomingRow } from "../components/rowProps";
import { HomeWallet } from "../components/HomeWallet";
import { BudgetMeter } from "../components/BudgetMeter";
import { usePaymentMethodMap, useSubscriptions, useSummary } from "../data/queries";
import { longToday, toNum } from "../lib/format";
import { dualText, usageOf } from "../lib/money";
import { useUi } from "../ui/UiContext";
import { useIsDesktop } from "../ui/useIsDesktop";
import { APP_NAME, AppTile } from "../brand";

export function Home() {
  const summary = useSummary();
  const subs = useSubscriptions();
  const pms = usePaymentMethodMap();
  const { openSubscription } = useUi();
  const desk = useIsDesktop();
  const { dark, toggle: toggleTheme } = useTheme();
  const [amountsVisible, setAmountsVisible] = useState(true); // the wallet's eye button

  // Two round buttons like the design: the bell (with an orange dot when
  // something renews this week) opens Settings, where reminders, the dollar
  // rate and sign-out live; the half-circle switches light/dark.
  const dueSoon = !!summary.data?.upcoming.some((u) => u.days_until <= 7);
  const roundBtn = "relative grid h-[38px] w-[38px] place-items-center rounded-[19px] border-none bg-s2 text-fg";
  const header = (
    <ScreenHeader
      eyebrow={
        // Phones have no sidebar, so Home carries the app's name next to the date.
        desk ? (
          longToday()
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <AppTile size={16} />
            <span className="font-semibold text-fg">{APP_NAME}</span>
            <span aria-hidden>·</span>
            {longToday()}
          </span>
        )
      }
      title="Home"
      right={
        !desk && (
          <div className="flex flex-none gap-2">
            <Link to="/settings" aria-label="Renewal alerts" title="Renewal alerts" className={roundBtn}>
              <BellIcon size={18} />
              {dueSoon && (
                <span className="absolute top-2 right-[9px] h-[7px] w-[7px] rounded-full bg-warn shadow-[0_0_0_2px_var(--color-s2)]" />
              )}
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light appearance" : "Switch to dark appearance"}
              title="Appearance"
              className={roundBtn}
            >
              <ThemeIcon size={18} />
            </button>
          </div>
        )
      }
    />
  );

  if (summary.isError || subs.isError) {
    return (
      <div className="flex flex-col gap-7">
        {header}
        <LoadError onRetry={() => (summary.refetch(), subs.refetch())} />
      </div>
    );
  }
  if (!summary.data || !subs.data) {
    return (
      <div className="flex flex-col gap-7">
        {header}
        <Loading />
      </div>
    );
  }
  if (subs.data.length === 0) {
    return (
      <div className="flex flex-col gap-7">
        {header}
        <EmptyState />
      </div>
    );
  }

  const s = summary.data;
  const subById = new Map(subs.data.map((x) => [x.id, x]));
  const week = s.upcoming.filter((u) => u.days_until <= 7);
  const later = s.upcoming.filter((u) => u.days_until > 7);
  // Due this week, ₹ and $ kept apart (amount_inr is null for $ subscriptions).
  const weekTotal = {
    inr: week.filter((u) => u.currency === "INR").reduce((a, u) => a + toNum(u.amount), 0),
    usd: week.filter((u) => u.currency === "USD").reduce((a, u) => a + toNum(u.amount), 0),
  };
  const usdTotals = s.usd ?? { monthly: "0", half_yearly: "0", yearly: "0" };
  // The wallet's three cards: most ₹ spend first, then most $ spend.
  const walletCards = [...pms.values()]
    .map((pm) => ({ pm, ...usageOf(pm.id, subs.data) }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.monthly.inr - a.monthly.inr || b.monthly.usd - a.monthly.usd)
    .slice(0, 3);

  const rows = (list: typeof s.upcoming) =>
    list.map((u, i) => {
      const sub = subById.get(u.subscription_id);
      return (
        <SubRow
          key={u.subscription_id + u.renewal_date}
          {...upcomingRow(u, sub, u.payment_method ? pms.get(u.payment_method.id) : undefined, {
            divider: i > 0,
            onClick: () => sub && openSubscription(sub),
          })}
        />
      );
    });

  return (
    <div className="flex animate-screen-in flex-col gap-7">
      {header}
      <div className="grid items-start gap-x-10 gap-y-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))" }}>
        {/* Wallet with the totals, and the ₹ budget meter under it */}
        <div className="flex flex-col gap-4">
          <HomeWallet
            visible={amountsVisible}
            onVisibleChange={setAmountsVisible}
            monthly={{ inr: toNum(s.monthly), usd: toNum(usdTotals.monthly) }}
            halfYearly={{ inr: toNum(s.half_yearly), usd: toNum(usdTotals.half_yearly) }}
            yearly={{ inr: toNum(s.yearly), usd: toNum(usdTotals.yearly) }}
            cards={walletCards}
          />
          <BudgetMeter budget={s.budget} hasUsd={!!s.usd} hidden={!amountsVisible} />
        </div>

        {/* Upcoming renewals */}
        <section className="flex flex-col gap-[22px]">
          {week.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <SectionTitle right={<span className="text-sm font-semibold text-warn tabular-nums">{dualText(weekTotal)}</span>}>
                Due this week
              </SectionTitle>
              <RowGroup>{rows(week)}</RowGroup>
            </div>
          )}
          {later.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <SectionTitle right={<SeeAll />}>Later</SectionTitle>
              <RowGroup>{rows(later)}</RowGroup>
            </div>
          )}
          {s.upcoming.length === 0 && (
            <div className="rounded-[18px] border border-dashed border-hair2 px-4 py-9 text-center text-sm text-fg2">
              No active subscriptions renewing.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SeeAll() {
  return (
    <Link to="/subscriptions" className="text-sm text-fg2 no-underline">
      See all
    </Link>
  );
}
