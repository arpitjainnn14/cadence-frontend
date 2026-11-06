// TypeScript mirror of the backend API contract (FRONTEND_CONTEXT.md §5).
// Money is always a decimal string like "649.00"; dates are "YYYY-MM-DD".
// There is no ₹/$ conversion: ₹ totals cover ₹ subscriptions only, and $ ones
// are totalled separately in $.

export type Currency = "INR" | "USD";
export type BillingCycle = "monthly" | "quarterly" | "half_yearly" | "yearly";
export type Status = "active" | "paused" | "cancelled";
export type PaymentType = "credit_card" | "upi" | "other";
export type Network = "visa" | "mastercard" | "rupay" | null;

/** The backend's fixed list, in its order (change set 7 added nine). */
export const CATEGORIES = [
  "Streaming",
  "Music",
  "Software/AI",
  "Cloud storage",
  "Fitness",
  "Food delivery",
  "Shopping",
  "News",
  "Gaming",
  "Education",
  "Productivity",
  "Telecom",
  "Utilities",
  "Health",
  "Travel",
  "Finance",
  "Insurance",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Me {
  email: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentType;
  bank: string | null;
  name: string;
  network: Network;
  display_name: string;
  /** Unused by the app: every card is drawn, card art is never fetched. */
  has_image: boolean;
  is_active: boolean;
  /** "#RRGGBB" chosen in Add card, or null = the frontend picks a colour. */
  color: string | null;
}

export interface MerchantResolve {
  domain: string | null;
  logo_url: string | null;
}

/** Fields shared by what we send and what we get back. */
interface SubscriptionFields {
  merchant_name: string;
  merchant_domain?: string | null;
  amount: string;
  currency: Currency;
  billing_cycle: BillingCycle;
  payment_method_id?: string | null;
  category: Category;
  notes?: string | null;
  status: Status;
  /** When it started; optional, never in the future. */
  started_on: string | null;
}

/**
 * Body of POST / PUT /api/subscriptions.
 * - POST: `next_billing_date` is required and must be today or later.
 * - PUT (full replace): send `next_billing_date` ONLY if the user changed it
 *   (omitting it keeps the stored billing anchor), and ALWAYS send
 *   `started_on` (omitting it clears it).
 */
export interface SubscriptionIn extends SubscriptionFields {
  next_billing_date?: string | null;
}

export interface Subscription extends SubscriptionFields {
  id: string;
  /** Computed by the backend; always today or later. */
  next_renewal: string;
  logo_url: string | null;
  /** Yearly cost in the subscription's own currency. */
  yearly_amount: string;
  /** Null for $ subscriptions (no conversion). For ₹ ones they equal amount / yearly_amount. */
  amount_inr: string | null;
  yearly_inr: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface UpcomingRenewal {
  subscription_id: string;
  merchant_name: string;
  logo_url: string | null;
  amount: string;
  currency: Currency;
  /** Null for $ subscriptions: show `amount` with `currency`. */
  amount_inr: string | null;
  renewal_date: string;
  days_until: number;
  payment_method: { id: string; name: string; has_image: boolean } | null;
}

export interface Summary {
  monthly: string;
  half_yearly: string;
  yearly: string;
  /** Totals of the $ subscriptions, in $; null when there are none. */
  usd: { monthly: string; half_yearly: string; yearly: string } | null;
  /** ₹ only ($ isn't counted); null when no budget is set. `remaining` can be negative, `percent_used` over 100. */
  budget: Budget | null;
  upcoming: UpcomingRenewal[];
}

export type Period = "monthly" | "yearly";

/** Charts and most_expensive cover ₹ subscriptions only; $ ones are listed in usd_subscriptions. */
export interface Insights {
  by_category: { category: Category; amount: string; subscription_ids: string[] }[];
  by_payment_method: {
    payment_method_id: string | null;
    name: string;
    amount: string;
    subscription_ids: string[];
  }[];
  most_expensive: { subscription_id: string; merchant_name: string; yearly_inr: string }[];
  usd_subscriptions: { subscription_id: string; merchant_name: string; yearly_amount: string }[];
}

export interface Budget {
  monthly: string;
  used: string;
  remaining: string;
  percent_used: number;
  over: boolean;
}

export interface Settings {
  /** Monthly budget in ₹, or null when not set. */
  monthly_budget_inr: string | null;
}
