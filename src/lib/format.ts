// Money and date formatting. Everything user-visible goes through here so the
// rules (Indian digit grouping, "$20" for dollars, "in 2 days") live in one place.
import type { Currency } from "../api/types";

/** "649.00" -> 649. The API sends money as decimal strings. */
export const toNum = (s: string | number | null | undefined): number => Number(s ?? 0) || 0;

const groupIN = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** 124500 -> "1,24,500" (no symbol; used where the ₹ is styled separately). */
export const groupINR = (n: number) => groupIN.format(Math.round(n));

/** 124500 -> "₹1,24,500" */
export const inr = (n: number) => rupees.format(Math.round(n));

/** 20 -> "$20", 9.99 -> "$9.99" */
export const usd = (n: number) => "$" + (n % 1 ? n.toFixed(2) : String(n));

/** Show an amount in its own currency. */
export const price = (amount: string | number, currency: Currency) =>
  currency === "USD" ? usd(toNum(amount)) : inr(toNum(amount));

// ---------- dates ----------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "2026-11-06" -> local Date at midnight (avoids the UTC off-by-one of `new Date(iso)`). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Whole days from `from` (default today) to `iso`. */
export function daysUntil(iso: string, from: Date = today()): number {
  return Math.round((parseDate(iso).getTime() - from.getTime()) / 86_400_000);
}

/** "2026-11-06" -> "6 Nov" (adds the year when it isn't this year). */
export function shortDate(iso: string, now: Date = today()): string {
  const d = parseDate(iso);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** 2 -> "in 2 days", 1 -> "tomorrow", 0 -> "today". */
export function relDays(days: number): string {
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/** "Wednesday, 4 Nov" */
export function longToday(now: Date = today()): string {
  return `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

/** 1 -> "1 card", 3 -> "3 cards". */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
