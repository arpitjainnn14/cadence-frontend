// Rupees and dollars are never converted into each other (decided 2026-11-05).
// ₹ subscriptions total in ₹, $ subscriptions total in $, and the UI shows the
// two side by side: "₹2,815/mo + $30/mo". Everything that adds money up goes
// through here so that rule lives in one place.
import type { Subscription } from "../api/types";
import { inr, toNum } from "./format";

/** An amount split by currency. */
export interface Dual {
  inr: number;
  usd: number;
}

/** A subscription's monthly cost, in its own currency. */
export const monthlyOf = (s: Pick<Subscription, "yearly_amount">) => toNum(s.yearly_amount) / 12;

/** Monthly totals of the *active* subscriptions, per currency. */
export function monthlyTotals(subs: Subscription[]): Dual {
  const t: Dual = { inr: 0, usd: 0 };
  for (const s of subs) {
    if (s.status !== "active") continue;
    if (s.currency === "USD") t.usd += monthlyOf(s);
    else t.inr += monthlyOf(s);
  }
  return t;
}

export const scaleDual = (d: Dual, k: number): Dual => ({ inr: d.inr * k, usd: d.usd * k });

/** Dollars to the cent: 30 -> "$30", 2.5 -> "$2.50". */
export function usdText(n: number): string {
  const cents = Math.round(n * 100) / 100;
  return "$" + (cents % 1 ? cents.toFixed(2) : String(cents));
}

/** "₹2,815/mo + $30/mo", or just the currency that's non-zero. Zero for both reads "₹0". */
export function dualText(d: Dual, suffix = ""): string {
  const parts: string[] = [];
  if (d.inr > 0 || d.usd <= 0) parts.push(inr(d.inr) + suffix);
  if (d.usd > 0) parts.push(usdText(d.usd) + suffix);
  return parts.join(" + ");
}

/** Monthly spend (per currency) and number of active subscriptions billed to one payment method. */
export function usageOf(pmId: string, subs: Subscription[]): { count: number; monthly: Dual } {
  const on = subs.filter((s) => s.status === "active" && s.payment_method_id === pmId);
  return { count: on.length, monthly: monthlyTotals(on) };
}
