// One small typed function per backend endpoint. Screens never build URLs themselves.
import { apiFetch } from "./client";
import type {
  Insights,
  Me,
  MerchantResolve,
  PaymentMethod,
  Period,
  Subscription,
  SubscriptionIn,
  Summary,
} from "./types";

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<Me>("/api/auth/login", { method: "POST", json: { email, password } }),
  logout: () => apiFetch<void>("/api/auth/logout", { method: "POST" }),
  me: () => apiFetch<Me>("/api/auth/me"),

  // Payment methods
  paymentMethods: (includeInactive = false) =>
    apiFetch<PaymentMethod[]>(`/api/payment-methods?include_inactive=${includeInactive}`),
  addPaymentMethod: (form: FormData) =>
    apiFetch<PaymentMethod>("/api/payment-methods", { method: "POST", form }),
  updatePaymentMethod: (id: string, patch: Partial<Pick<PaymentMethod, "bank" | "name" | "network" | "is_active" | "color">>) =>
    apiFetch<PaymentMethod>(`/api/payment-methods/${id}`, { method: "PATCH", json: patch }),
  setPaymentMethodImage: (id: string, image: File) => {
    const form = new FormData();
    form.append("image", image);
    return apiFetch<PaymentMethod>(`/api/payment-methods/${id}/image`, { method: "PUT", form });
  },
  paymentMethodImageUrl: (id: string) => `/api/payment-methods/${id}/image`,

  // Merchants
  resolveMerchant: (name: string, signal?: AbortSignal) =>
    apiFetch<MerchantResolve>(`/api/merchants/resolve?name=${encodeURIComponent(name)}`, { signal }),

  // Subscriptions
  subscriptions: () => apiFetch<Subscription[]>("/api/subscriptions"),
  createSubscription: (body: SubscriptionIn) =>
    apiFetch<Subscription>("/api/subscriptions", { method: "POST", json: body }),
  updateSubscription: (id: string, body: SubscriptionIn) =>
    apiFetch<Subscription>(`/api/subscriptions/${id}`, { method: "PUT", json: body }),
  deleteSubscription: (id: string) => apiFetch<void>(`/api/subscriptions/${id}`, { method: "DELETE" }),

  // Read models
  summary: () => apiFetch<Summary>("/api/summary"),
  insights: (period: Period) => apiFetch<Insights>(`/api/insights?period=${period}`),

  // Push
  pushPublicKey: () => apiFetch<{ key: string }>("/api/push/public-key"),
  pushSubscribe: (sub: PushSubscriptionJSON) =>
    apiFetch<void>("/api/push/subscribe", { method: "POST", json: sub }),
  pushUnsubscribe: (endpoint: string) =>
    apiFetch<void>("/api/push/unsubscribe", { method: "POST", json: { endpoint } }),
  pushTest: () => apiFetch<void>("/api/push/test", { method: "POST" }),
};
