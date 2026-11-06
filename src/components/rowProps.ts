// Turns API objects into SubRow props. Kept separate so each screen just says
// which "mode" it wants instead of repeating formatting logic.
import type { PaymentMethod, Subscription, UpcomingRenewal } from "../api/types";
import { thumbBg } from "../lib/cardStyle";
import { CYCLES } from "../lib/cycles";
import { daysUntil, price, relDays, shortDate } from "../lib/format";
import type { SubRowProps } from "./SubRow";

/** "Subscriptions" and "card detail" rows: card name or status underneath, yearly cost on the right. */
export function subscriptionRow(
  s: Subscription,
  pm: PaymentMethod | undefined,
  opts: { divider: boolean; onClick: () => void; showCard?: boolean; label?: string },
): SubRowProps {
  const active = s.status === "active";
  const cardName = opts.label ?? pm?.display_name ?? "No card";
  const d = daysUntil(s.next_renewal);
  const soon = active && d <= 7;
  let sub: string;
  if (s.status === "paused") sub = `Paused · ${cardName}`;
  else if (s.status === "cancelled") sub = s.cancelled_at ? `Cancelled ${shortDate(s.cancelled_at)}` : "Cancelled";
  // Renewing within a week: say when (that's what the orange means). The card
  // is still shown by the swatch on the right.
  else if (opts.showCard === false || soon) sub = `${relDays(d)} · ${shortDate(s.next_renewal)}`;
  else sub = cardName;

  return {
    name: s.merchant_name,
    logoUrl: s.logo_url,
    sub,
    // Orange second line whenever it renews within a week (the design does this on every list).
    soon,
    price: price(s.amount, s.currency),
    cycle: CYCLES[s.billing_cycle].short,
    // Yearly cost in the subscription's own currency (no ₹/$ conversion).
    right2: `${price(s.yearly_amount, s.currency)}/yr`,
    thumb: thumbBg(pm),
    thumbTitle: cardName,
    statusLabel: active ? undefined : s.status === "paused" ? "Paused" : "Cancelled",
    divider: opts.divider,
    onClick: opts.onClick,
  };
}

/** Home rows: "in 2 days · 6 Nov", highlighted within a week. */
export function upcomingRow(
  u: UpcomingRenewal,
  sub: Subscription | undefined,
  pm: PaymentMethod | undefined,
  opts: { divider: boolean; onClick: () => void; label?: string },
): SubRowProps {
  const soon = u.days_until <= 7;
  return {
    name: u.merchant_name,
    logoUrl: u.logo_url,
    sub: `${relDays(u.days_until)} · ${shortDate(u.renewal_date)}`,
    soon,
    dot: soon,
    price: price(u.amount, u.currency),
    cycle: sub ? CYCLES[sub.billing_cycle].short : "",
    thumb: thumbBg(pm),
    thumbTitle: opts.label ?? u.payment_method?.name,
    divider: opts.divider,
    onClick: opts.onClick,
  };
}
