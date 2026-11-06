// In-memory fake database for the mock API. Mirrors the backend's seed data
// (11 cards + 3 UPI apps) and a realistic set of subscriptions whose renewal
// dates are relative to *today*, so the app always looks lived-in.
import type { BillingCycle, Category, Currency, PaymentMethod, Status, Subscription, SubscriptionIn } from "../api/types";
import { CYCLES, addMonths, nextRenewal } from "../lib/cycles";
import { toIso, today } from "../lib/format";

/** Same rule as the backend: "bank name", unless the bank already appears in the name as a whole word. */
export function displayName(bank: string | null, name: string): string {
  if (!bank) return name;
  const esc = bank.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<!\\w)${esc}(?!\\w)`, "i").test(name) ? name : `${bank} ${name}`;
}

let seq = 0;
export const uuid = () => crypto.randomUUID?.() ?? `id-${Date.now()}-${++seq}`;

const pm = (
  type: PaymentMethod["type"],
  bank: string | null,
  name: string,
  network: PaymentMethod["network"],
): PaymentMethod => ({
  id: uuid(),
  type,
  bank,
  name,
  network,
  display_name: displayName(bank, name),
  has_image: false,
  is_active: true,
  color: null,
});

export const db = {
  images: new Map<string, Blob>(),
  paymentMethods: [
    pm("credit_card", "HDFC Bank", "MoneyBack+", "visa"),
    pm("credit_card", "ICICI", "Sapphiro", "rupay"),
    pm("credit_card", "ICICI", "Sapphiro", "visa"),
    pm("credit_card", "ICICI", "Amazon Pay ICICI", "visa"),
    pm("credit_card", "ICICI", "Coral", "rupay"),
    pm("credit_card", "SBI Card", "Cashback", "visa"),
    pm("credit_card", "Axis", "Scapia", "mastercard"),
    pm("credit_card", "Axis", "Scapia", "rupay"),
    pm("credit_card", "slice", "slice", "rupay"),
    pm("credit_card", "IDFC FIRST", "Millennia", "visa"),
    pm("credit_card", "BOBCARD", "Select", "mastercard"),
    pm("upi", null, "GPay", null),
    pm("upi", null, "PhonePe", null),
    pm("upi", null, "Paytm", null),
  ],
  // Stored as the client sent them; computed fields are added by `withComputed`.
  subscriptions: [] as (SubscriptionIn & { id: string; cancelled_at: string | null; created_at: string })[],
};

const pmId = (display: string, network?: string) =>
  db.paymentMethods.find((p) => p.display_name === display && (!network || p.network === network))!.id;

/** A start date that is a few cycles before a renewal `inDays` from now. */
function startFor(inDays: number, cycle: BillingCycle): string {
  const next = new Date(today().getTime() + inDays * 86_400_000);
  return toIso(addMonths(next, -CYCLES[cycle].months * 6));
}

const seed = (
  merchant_name: string,
  amount: string,
  currency: Currency,
  billing_cycle: BillingCycle,
  inDays: number,
  payment: string,
  category: Category,
  status: Status = "active",
  notes = "",
  network?: string,
) => ({
  id: uuid(),
  merchant_name,
  merchant_domain: null,
  amount,
  currency,
  billing_cycle,
  start_date: startFor(inDays, billing_cycle),
  payment_method_id: pmId(payment, network),
  category,
  notes,
  status,
  cancelled_at: status === "cancelled" ? toIso(new Date(today().getTime() - inDays * 86_400_000)) : null,
  created_at: new Date().toISOString(),
});

db.subscriptions = [
  seed("Netflix", "649.00", "INR", "monthly", 2, "ICICI Sapphiro", "Streaming", "active", "Premium plan", "visa"),
  seed("Spotify", "119.00", "INR", "monthly", 5, "GPay", "Music"),
  seed("YouTube Premium", "149.00", "INR", "monthly", 14, "HDFC Bank MoneyBack+", "Streaming"),
  seed("Amazon Prime", "1499.00", "INR", "yearly", 118, "Amazon Pay ICICI", "Shopping"),
  seed("Apple iCloud+", "75.00", "INR", "monthly", 8, "SBI Card Cashback", "Cloud storage", "active", "50 GB"),
  seed("ChatGPT Plus", "20.00", "USD", "monthly", 1, "Axis Scapia", "Software/AI", "active", "", "mastercard"),
  seed("cult.fit", "1299.00", "INR", "monthly", 17, "IDFC FIRST Millennia", "Fitness", "active", "cultpass"),
  seed("Swiggy One", "899.00", "INR", "quarterly", 29, "Axis Scapia", "Food delivery", "active", "", "rupay"),
  seed("Zomato Gold", "299.00", "INR", "quarterly", 71, "PhonePe", "Food delivery"),
  seed("Notion", "10.00", "USD", "monthly", 23, "Axis Scapia", "Software/AI", "active", "Plus plan", "mastercard"),
  seed("Audible", "199.00", "INR", "monthly", 36, "slice", "Music", "paused", "Paused until January"),
  seed("JioHotstar", "299.00", "INR", "monthly", 140, "ICICI Coral", "Streaming", "cancelled"),
];

// ---------- computed fields (the backend does this for real) ----------

// No currency conversion: yearly_amount is in the sub's own currency, and the
// ₹-only fields (amount_inr, yearly_inr) are null for $ subscriptions.
export function withComputed(s: (typeof db.subscriptions)[number]): Subscription {
  const yearly = (Number(s.amount) * 12) / CYCLES[s.billing_cycle].months;
  const isInr = s.currency === "INR";
  return {
    ...s,
    next_renewal: nextRenewal(s.start_date, s.billing_cycle, today()),
    logo_url: null,
    yearly_amount: yearly.toFixed(2),
    amount_inr: isInr ? Number(s.amount).toFixed(2) : null,
    yearly_inr: isInr ? yearly.toFixed(2) : null,
  };
}

export const allSubs = () => db.subscriptions.map(withComputed);
