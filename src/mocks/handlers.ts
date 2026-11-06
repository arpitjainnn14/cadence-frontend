// Mock API handlers (MSW). They follow the contract in FRONTEND_CONTEXT.md,
// including the auth rules, so the real client code paths get exercised:
//  - "logged in" = a csrf_token cookie exists (like the real backend's cookies)
//  - the access token "expires" after 15 minutes or on page reload, so the
//    first request returns 401 and the client has to refresh
//  - mutations without a matching X-CSRF-Token header get 403
import { delay, http, HttpResponse } from "msw";
import { CATEGORIES, type Category, type Insights, type Subscription, type SubscriptionIn, type Summary } from "../api/types";
import { readCookie } from "../api/client";
import { daysUntil } from "../lib/format";
import { allSubs, db, displayName, uuid, withComputed } from "./db";
import { BRANDS } from "../lib/brands";

const ACCESS_MS = 15 * 60 * 1000;
let accessValidUntil = 0;
let sessionEmail = "you@example.com";

const err = (status: number, detail: unknown) => HttpResponse.json({ detail }, { status });

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=strict`;
}

/** Returns an error response if the request isn't allowed, otherwise null. */
function guard(request: Request): Response | null {
  if (!readCookie("csrf_token") || Date.now() > accessValidUntil) return err(401, "Not authenticated");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    if (request.headers.get("X-CSRF-Token") !== readCookie("csrf_token")) return err(403, "CSRF token missing or invalid");
  }
  return null;
}

function validate(body: Partial<SubscriptionIn>): Response | null {
  const errors: { loc: string[]; msg: string }[] = [];
  const name = (body.merchant_name ?? "").trim();
  if (name.length < 1 || name.length > 80) errors.push({ loc: ["body", "merchant_name"], msg: "must be 1–80 characters" });
  if (!(Number(body.amount) > 0)) errors.push({ loc: ["body", "amount"], msg: "must be greater than 0" });
  if (!CATEGORIES.includes(body.category as Category)) errors.push({ loc: ["body", "category"], msg: "is not a valid category" });
  if ((body.notes ?? "").length > 500) errors.push({ loc: ["body", "notes"], msg: "must be at most 500 characters" });
  return errors.length ? err(422, errors) : null;
}

const DOMAINS: Record<string, string> = {
  netflix: "netflix.com",
  spotify: "spotify.com",
  "youtube premium": "youtube.com",
  "amazon prime": "primevideo.com",
  "chatgpt plus": "openai.com",
  "claude pro": "claude.ai",
  notion: "notion.so",
  "swiggy one": "swiggy.com",
  "zomato gold": "zomato.com",
  "cult.fit": "cult.fit",
  "google one": "one.google.com",
  "apple icloud+": "icloud.com",
};

function decorate(s: Subscription): Subscription {
  const domain = s.merchant_domain || DOMAINS[s.merchant_name.toLowerCase()];
  return { ...s, logo_url: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null };
}

const subsOut = () => allSubs().map(decorate);
const pmById = (id: string | null | undefined) => db.paymentMethods.find((p) => p.id === id) ?? null;

export const handlers = [
  // Every mock request takes a moment, like a real network.
  http.all("/api/*", async () => {
    await delay(120);
  }),

  // ---------- auth ----------
  http.post("/api/auth/login", async ({ request }) => {
    const { email, password } = (await request.json()) as { email?: string; password?: string };
    // Test passwords: "wrong" -> 401, "limit" -> 429 (rate limited, as after 5 failures).
    if (password === "limit") return err(429, "Too many attempts. Try again later.");
    if (!email || !password || password === "wrong") return err(401, "Invalid email or password");
    setCookie("csrf_token", uuid(), 30 * 86400);
    accessValidUntil = Date.now() + ACCESS_MS;
    sessionEmail = email;
    return HttpResponse.json({ email });
  }),
  http.post("/api/auth/refresh", () => {
    // (The real backend may also answer 409 when another tab just refreshed; the client retries on that.)
    if (!readCookie("csrf_token")) return err(401, "No session");
    accessValidUntil = Date.now() + ACCESS_MS;
    return new HttpResponse(null, { status: 200 });
  }),
  http.post("/api/auth/logout", () => {
    setCookie("csrf_token", "", 0);
    accessValidUntil = 0;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("/api/auth/me", ({ request }) => guard(request) ?? HttpResponse.json({ email: sessionEmail })),

  // ---------- payment methods ----------
  http.get("/api/payment-methods", ({ request }) => {
    const g = guard(request);
    if (g) return g;
    const inactive = new URL(request.url).searchParams.get("include_inactive") === "true";
    const list = db.paymentMethods.filter((p) => inactive || p.is_active);
    return HttpResponse.json([...list.filter((p) => p.type === "credit_card"), ...list.filter((p) => p.type !== "credit_card")]);
  }),
  http.post("/api/payment-methods", async ({ request }) => {
    const g = guard(request);
    if (g) return g;
    const form = await request.formData();
    const bank = (form.get("bank") as string) || null;
    const name = String(form.get("name") ?? "").trim();
    if (!name) return err(422, [{ loc: ["body", "name"], msg: "Field required" }]);
    const color = (form.get("color") as string) || null;
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) return err(422, [{ loc: ["body", "color"], msg: "must be a #RRGGBB colour" }]);
    const image = form.get("image");
    const item = {
      id: uuid(),
      type: (form.get("type") as "credit_card") ?? "credit_card",
      bank,
      name,
      network: ((form.get("network") as string) || null) as "visa" | null,
      display_name: displayName(bank, name),
      has_image: image instanceof File && image.size > 0,
      is_active: true,
      color,
    };
    if (item.has_image) db.images.set(item.id, image as File);
    db.paymentMethods.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.patch("/api/payment-methods/:id", async ({ request, params }) => {
    const g = guard(request);
    if (g) return g;
    const item = pmById(params.id as string);
    if (!item) return err(404, "Not found");
    Object.assign(item, await request.json());
    item.display_name = displayName(item.bank, item.name);
    return HttpResponse.json(item);
  }),
  http.put("/api/payment-methods/:id/image", async ({ request, params }) => {
    const g = guard(request);
    if (g) return g;
    const item = pmById(params.id as string);
    if (!item) return err(404, "Not found");
    const image = (await request.formData()).get("image");
    if (!(image instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(image.type) || image.size > 2 * 1024 * 1024) {
      return err(422, "Image must be PNG, JPEG or WebP, up to 2 MB");
    }
    db.images.set(item.id, image);
    item.has_image = true;
    return HttpResponse.json(item);
  }),
  http.get("/api/payment-methods/:id/image", ({ params }) => {
    const blob = db.images.get(params.id as string);
    if (!blob) return err(404, "No image");
    return new HttpResponse(blob, { headers: { "Content-Type": blob.type } });
  }),

  // ---------- merchants ----------
  http.get("/api/merchants/resolve", ({ request }) => {
    const g = guard(request);
    if (g) return g;
    const name = (new URL(request.url).searchParams.get("name") ?? "").trim().toLowerCase();
    const domain = DOMAINS[name] ?? DOMAINS[BRANDS.find((b) => b.name.toLowerCase().startsWith(name))?.name.toLowerCase() ?? ""] ?? null;
    return HttpResponse.json({
      domain: name.length >= 2 ? domain : null,
      logo_url: name.length >= 2 && domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
    });
  }),

  // ---------- subscriptions ----------
  http.get("/api/subscriptions", ({ request }) => {
    const g = guard(request);
    if (g) return g;
    const q = new URL(request.url).searchParams;
    let list = subsOut();
    if (q.get("status")) list = list.filter((s) => s.status === q.get("status"));
    if (q.get("payment_method_id")) list = list.filter((s) => s.payment_method_id === q.get("payment_method_id"));
    if (q.get("category")) list = list.filter((s) => s.category === q.get("category"));
    const sort = q.get("sort");
    if (sort === "cost")
      list.sort((a, b) =>
        a.currency !== b.currency ? (a.currency === "INR" ? -1 : 1) : Number(b.yearly_amount) - Number(a.yearly_amount),
      );
    if (sort === "renewal") list.sort((a, b) => a.next_renewal.localeCompare(b.next_renewal));
    if (sort === "name") list.sort((a, b) => a.merchant_name.localeCompare(b.merchant_name));
    return HttpResponse.json(list);
  }),
  http.post("/api/subscriptions", async ({ request }) => {
    const g = guard(request);
    if (g) return g;
    const body = (await request.json()) as SubscriptionIn;
    const v = validate(body);
    if (v) return v;
    const row = {
      ...body,
      id: uuid(),
      cancelled_at: body.status === "cancelled" ? new Date().toISOString().slice(0, 10) : null,
      created_at: new Date().toISOString(),
    };
    db.subscriptions.push(row);
    return HttpResponse.json(decorate(withComputed(row)), { status: 201 });
  }),
  http.get("/api/subscriptions/:id", ({ request, params }) => {
    const g = guard(request);
    if (g) return g;
    const s = subsOut().find((x) => x.id === params.id);
    return s ? HttpResponse.json(s) : err(404, "Not found");
  }),
  http.put("/api/subscriptions/:id", async ({ request, params }) => {
    const g = guard(request);
    if (g) return g;
    const i = db.subscriptions.findIndex((x) => x.id === params.id);
    if (i < 0) return err(404, "Not found");
    const body = (await request.json()) as SubscriptionIn;
    const v = validate(body);
    if (v) return v;
    const prev = db.subscriptions[i];
    const cancelled_at =
      body.status === "cancelled" ? (prev.cancelled_at ?? new Date().toISOString().slice(0, 10)) : null;
    db.subscriptions[i] = { ...body, id: prev.id, cancelled_at, created_at: prev.created_at };
    return HttpResponse.json(decorate(withComputed(db.subscriptions[i])));
  }),
  http.delete("/api/subscriptions/:id", ({ request, params }) => {
    const g = guard(request);
    if (g) return g;
    db.subscriptions = db.subscriptions.filter((x) => x.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- read models ----------
  http.get("/api/summary", ({ request }) => {
    const g = guard(request);
    if (g) return g;
    const active = subsOut().filter((s) => s.status === "active");
    // No conversion: ₹ totals cover ₹ subs only; $ subs are totalled in $.
    const yearlyIn = (cur: string) =>
      active.filter((s) => s.currency === cur).reduce((a, s) => a + Number(s.yearly_amount), 0);
    const inrYear = yearlyIn("INR");
    const usdYear = yearlyIn("USD");
    const hasUsd = active.some((s) => s.currency === "USD");
    const body: Summary = {
      monthly: (inrYear / 12).toFixed(2),
      half_yearly: (inrYear / 2).toFixed(2),
      yearly: inrYear.toFixed(2),
      usd: hasUsd
        ? { monthly: (usdYear / 12).toFixed(2), half_yearly: (usdYear / 2).toFixed(2), yearly: usdYear.toFixed(2) }
        : null,
      upcoming: active
        .slice()
        .sort((a, b) => a.next_renewal.localeCompare(b.next_renewal))
        .slice(0, 20)
        .map((s) => {
          const p = pmById(s.payment_method_id);
          return {
            subscription_id: s.id,
            merchant_name: s.merchant_name,
            logo_url: s.logo_url,
            amount: s.amount,
            currency: s.currency,
            amount_inr: s.amount_inr,
            renewal_date: s.next_renewal,
            days_until: daysUntil(s.next_renewal),
            payment_method: p ? { id: p.id, name: p.display_name, has_image: p.has_image } : null,
          };
        }),
    };
    return HttpResponse.json(body);
  }),
  http.get("/api/insights", ({ request }) => {
    const g = guard(request);
    if (g) return g;
    const yearlyView = new URL(request.url).searchParams.get("period") === "yearly";
    const all = subsOut().filter((s) => s.status === "active");
    const active = all.filter((s) => s.currency === "INR"); // charts and top list are ₹ only
    const amt = (s: Subscription) => Number(s.yearly_inr) / (yearlyView ? 1 : 12);
    const group = <K extends string | null>(key: (s: Subscription) => K) => {
      const m = new Map<K, Subscription[]>();
      active.forEach((s) => m.set(key(s), [...(m.get(key(s)) ?? []), s]));
      return [...m.entries()]
        .map(([k, list]) => ({ k, amount: list.reduce((a, s) => a + amt(s), 0), ids: list.map((s) => s.id) }))
        .sort((a, b) => b.amount - a.amount);
    };
    const body: Insights = {
      by_category: group((s) => s.category).map((x) => ({ category: x.k, amount: x.amount.toFixed(2), subscription_ids: x.ids })),
      by_payment_method: group((s) => s.payment_method_id ?? null).map((x) => ({
        payment_method_id: x.k,
        name: pmById(x.k)?.display_name ?? "Unassigned",
        amount: x.amount.toFixed(2),
        subscription_ids: x.ids,
      })),
      most_expensive: active
        .slice()
        .sort((a, b) => Number(b.yearly_inr) - Number(a.yearly_inr))
        .slice(0, 10)
        .map((s) => ({ subscription_id: s.id, merchant_name: s.merchant_name, yearly_inr: s.yearly_inr! })),
      usd_subscriptions: all
        .filter((s) => s.currency === "USD")
        .sort((a, b) => Number(b.yearly_amount) - Number(a.yearly_amount))
        .map((s) => ({ subscription_id: s.id, merchant_name: s.merchant_name, yearly_amount: s.yearly_amount })),
    };
    return HttpResponse.json(body);
  }),

  // ---------- push ----------
  http.get("/api/push/public-key", ({ request }) =>
    guard(request) ??
    HttpResponse.json({ key: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U" }),
  ),
  http.post("/api/push/subscribe", ({ request }) => guard(request) ?? new HttpResponse(null, { status: 201 })),
  http.post("/api/push/unsubscribe", ({ request }) => guard(request) ?? new HttpResponse(null, { status: 204 })),
  http.post("/api/push/test", ({ request }) => guard(request) ?? new HttpResponse(null, { status: 202 })),
];
