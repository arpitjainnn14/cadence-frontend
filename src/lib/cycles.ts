import type { BillingCycle } from "../api/types";
import { parseDate, toIso } from "./format";

export const CYCLES: Record<BillingCycle, { label: string; seg: string; short: string; months: number }> = {
  monthly: { label: "Monthly", seg: "Month", short: "/mo", months: 1 },
  quarterly: { label: "Quarterly", seg: "Quarter", short: "/qtr", months: 3 },
  half_yearly: { label: "Half-yearly", seg: "6 mo", short: "/6 mo", months: 6 },
  yearly: { label: "Yearly", seg: "Year", short: "/yr", months: 12 },
};

export const CYCLE_KEYS = Object.keys(CYCLES) as BillingCycle[];

/** Add whole months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(d: Date, months: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
}

/**
 * The first billing date on or after `from`, given any real billing date.
 * The backend owns the real value (`next_renewal`); we only use this to
 * preview it while the user fills in the form.
 */
export function nextRenewal(billingDate: string, cycle: BillingCycle, from: Date): string {
  const start = parseDate(billingDate);
  const step = CYCLES[cycle].months;
  let k = 0;
  // Step forward from the anchor date (not from the previous result) so the
  // day-of-month never drifts after a short month.
  while (addMonths(start, k * step) < from) k++; // anchor in the past: step forward
  while (addMonths(start, (k - 1) * step) >= from) k--; // anchor far ahead: step back
  return toIso(addMonths(start, k * step));
}
