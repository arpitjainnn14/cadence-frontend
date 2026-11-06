// Home's "used vs budget" line, under the wallet. ₹ only: the backend counts
// ₹ subscriptions against the budget and leaves $ ones out. Values come
// straight from summary.budget; percent_used can go past 100.
import { Link } from "react-router";
import type { Budget } from "../api/types";
import { groupINR, toNum } from "../lib/format";

export function BudgetMeter({ budget, hasUsd }: { budget: Budget | null; hasUsd: boolean }) {
  if (!budget) {
    return (
      <Link to="/settings" className="self-center text-[13px] text-fg2 no-underline hover:text-fg">
        Set a monthly budget →
      </Link>
    );
  }

  const used = toNum(budget.used);
  const total = toNum(budget.monthly);
  const remaining = toNum(budget.remaining);
  const fill = Math.min(100, Math.max(0, budget.percent_used));

  return (
    <section
      aria-label="Monthly budget"
      className="flex w-full max-w-[400px] flex-col gap-2.5 self-center rounded-[18px] bg-s1 px-4 py-3.5 shadow-lift"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-fg2">Monthly budget</span>
        <span className={`text-[13px] font-semibold tabular-nums ${budget.over ? "text-warn" : "text-fg"}`}>
          {budget.percent_used}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
        aria-label={`₹${groupINR(used)} of ₹${groupINR(total)} used`}
        className="h-2 overflow-hidden rounded-full bg-s2"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${fill}%`,
            background: budget.over ? "var(--color-warn)" : "var(--color-fg)",
            transition: "width .8s cubic-bezier(.2,.9,.3,1)",
          }}
        />
      </div>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-fg2 tabular-nums">
          ₹{groupINR(used)} of ₹{groupINR(total)}
        </span>
        <span className={`tabular-nums ${budget.over ? "font-semibold text-warn" : "text-fg2"}`}>
          {budget.over ? `₹${groupINR(-remaining)} over budget` : `₹${groupINR(remaining)} left`}
        </span>
      </div>
      {hasUsd && <span className="text-[12px] text-fg3">$ subscriptions aren't counted.</span>}
    </section>
  );
}
