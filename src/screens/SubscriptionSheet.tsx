// Add / edit a subscription. Opens as a bottom sheet (phone) or dialog (laptop).
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";
import { api } from "../api/endpoints";
import {
  CATEGORIES,
  type BillingCycle,
  type Category,
  type Currency,
  type MerchantResolve,
  type Status,
  type Subscription,
  type SubscriptionIn,
} from "../api/types";
import { CardArt } from "../components/CardArt";
import { ChevronRight } from "../components/Icons";
import { MerchantLogo } from "../components/MerchantLogo";
import { Segmented } from "../components/Segmented";
import { FieldLabel, PrimaryButton, Sheet } from "../components/Sheet";
import { useDeleteSubscription, usePaymentLabels, usePaymentMethods, useSaveSubscription } from "../data/queries";
import { exactBrand, findBrand, suggestBrands } from "../lib/brands";
import { NETWORK_LABEL, cardLook } from "../lib/cardStyle";
import { CATEGORY_COLOR } from "../lib/categories";
import { CYCLES, CYCLE_KEYS, nextRenewal } from "../lib/cycles";
import { groupINR, toIso, today, toNum } from "../lib/format";
import { usdText } from "../lib/money";
import { useUi } from "../ui/UiContext";

interface Props {
  editing?: Subscription;
  preset?: Partial<SubscriptionIn>;
}

interface FormState {
  name: string;
  domain: string | null;
  amount: string;
  currency: Currency;
  cycle: BillingCycle;
  /** "Started": the date renewals are anchored on (start_date). */
  start: string;
  /** Set only when the user edits "Next renewal" directly; otherwise it's derived from `start`. */
  nextOverride: string | null;
  /** `undefined` = not chosen yet on a new subscription → default to the first card (as in the design). */
  paymentId: string | null | undefined;
  category: Category;
  categoryTouched: boolean;
  status: Status;
  notes: string;
}

function initialForm(editing?: Subscription, preset?: Partial<SubscriptionIn>): FormState {
  const src = editing ?? preset ?? {};
  return {
    name: src.merchant_name ?? "",
    domain: src.merchant_domain ?? null,
    amount: src.amount ? String(toNum(src.amount)) : "",
    currency: src.currency ?? "INR",
    cycle: src.billing_cycle ?? "monthly",
    // Always start from the saved start_date, never next_renewal: renewals are
    // anchored on start_date's day of the month. If a sub started on Jan 31,
    // next_renewal can be Feb 28, and saving that back would move every later
    // renewal to the 28th. Untouched, we send the original start_date back.
    start: src.start_date ?? toIso(today()),
    nextOverride: null,
    paymentId: editing ? (editing.payment_method_id ?? null) : preset?.payment_method_id,
    category: src.category ?? "Streaming",
    categoryTouched: !!editing || !!preset?.category,
    status: src.status ?? "active",
    notes: src.notes ?? "",
  };
}

/** Ask the backend for the merchant's logo while typing (debounced, cancels stale requests). */
function useMerchantLogo(name: string) {
  const [result, setResult] = useState<MerchantResolve | null>(null);
  useEffect(() => {
    const q = name.trim();
    if (q.length < 2) {
      setResult(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api
        .resolveMerchant(q, ctrl.signal)
        .then(setResult)
        .catch(() => undefined); // logo is a nicety; fall back to the letter tile
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [name]);
  return result;
}

export function SubscriptionSheet({ editing, preset }: Props) {
  const { closeSheet, toast } = useUi();
  const [f, setF] = useState<FormState>(() => initialForm(editing, preset));
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const pms = (usePaymentMethods().data ?? []).filter((p) => p.is_active || p.id === f.paymentId);
  const save = useSaveSubscription();
  const del = useDeleteSubscription();
  const resolved = useMerchantLogo(f.name);
  const labels = usePaymentLabels();
  const queryClient = useQueryClient();

  const set = (patch: Partial<FormState>) => {
    setServerError("");
    setF((prev) => ({ ...prev, ...patch }));
  };

  // Picking a known merchant also picks its usual category (unless you chose one).
  function setName(name: string) {
    const brand = findBrand(name);
    set({ name, domain: null, ...(brand && !f.categoryTouched ? { category: brand.category } : {}) });
  }

  const amount = toNum(f.amount);
  // Cost preview in the subscription's own currency (₹ and $ are never converted).
  const monthlyCost = amount > 0 ? amount / CYCLES[f.cycle].months : 0;
  const fmt = (n: number) => (f.currency === "USD" ? usdText(n) : `₹${groupINR(n)}`);
  const nameOk = f.name.trim().length > 0 && f.name.trim().length <= 80;
  const amountOk = amount > 0;
  const notesOk = f.notes.length <= 500;
  // The two date fields: "Next renewal" shows what the backend will compute
  // from "Started", unless you typed a next renewal yourself. Either one is a
  // real billing date, so whichever you edited last is what we save.
  const next = f.nextOverride ?? (f.start ? nextRenewal(f.start, f.cycle, today()) : "");
  const anchor = f.nextOverride ?? f.start;
  const paymentId = f.paymentId === undefined ? (pms.find((p) => p.type === "credit_card")?.id ?? null) : f.paymentId;
  const pm = pms.find((p) => p.id === paymentId);
  const suggestions = suggestBrands(f.name);
  const logoUrl = resolved?.logo_url ?? (editing && f.name === editing.merchant_name ? editing.logo_url : null);

  function body(): SubscriptionIn {
    return {
      merchant_name: exactBrand(f.name)?.name ?? f.name.trim(),
      merchant_domain: resolved?.domain ?? f.domain ?? null,
      amount: amount.toFixed(2),
      currency: f.currency,
      billing_cycle: f.cycle,
      start_date: anchor,
      payment_method_id: paymentId,
      category: f.category,
      notes: f.notes.trim() || null,
      status: f.status,
    };
  }

  function onSave() {
    if (!nameOk || !amountOk || !notesOk || !anchor) return setShowErrors(true);
    save.mutate(
      { id: editing?.id, body: body() },
      {
        onSuccess: () => closeSheet(),
        onError: (err) => setServerError(err instanceof ApiError ? err.message : "Couldn't save. Try again."),
      },
    );
  }

  function onDelete() {
    if (!editing) return;
    del.mutate(editing, {
      onSuccess: () => {
        closeSheet();
        // Undo re-creates it with the same details (it gets a new id).
        // This runs after the sheet has closed, so it calls the API directly
        // instead of using this component's mutation hook.
        const { id: _id, next_renewal: _n, logo_url: _l, yearly_amount: _ya, amount_inr: _a, yearly_inr: _y, cancelled_at: _c, created_at: _cr, ...again } = editing;
        toast(`${editing.merchant_name} deleted`, () => {
          api
            .createSubscription(again)
            .then(() => queryClient.invalidateQueries())
            .catch(() => toast(`Couldn't restore ${editing.merchant_name}`));
        });
      },
      onError: (err) => setServerError(err.message),
    });
  }

  const border = (ok: boolean) => (showErrors && !ok ? "var(--color-warn)" : "var(--color-hair2)");

  return (
    <Sheet
      title={editing ? "Edit subscription" : "New subscription"}
      footer={
        <PrimaryButton type="button" onClick={onSave} disabled={save.isPending}>
          {save.isPending ? "Saving…" : editing ? "Save changes" : "Add subscription"}
        </PrimaryButton>
      }
    >
      {/* Merchant with live logo */}
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <MerchantLogo
            name={f.name}
            logoUrl={logoUrl}
            size={44}
            className="pointer-events-none absolute top-2.5 left-2.5"
            style={{
              transform: findBrand(f.name) || logoUrl ? "scale(1)" : "scale(0.86)",
              transition: "transform .45s cubic-bezier(.3,1.5,.4,1), background .25s, color .25s",
            }}
          />
          <input
            value={f.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Merchant"
            autoComplete="off"
            maxLength={80}
            aria-label="Merchant"
            className="field h-16! w-full rounded-2xl! pl-[66px]! text-[19px]! font-semibold tracking-[-0.02em]"
            style={{ borderColor: border(nameOk) }}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
            {suggestions.map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => set({ name: b.name, category: f.categoryTouched ? f.category : b.category })}
                className="flex h-9 flex-none animate-fade-in items-center gap-2 rounded-[18px] border-none bg-s2 pr-3 pl-1.5 text-[13px] font-medium text-fg"
              >
                <span className="grid h-6 w-6 place-items-center rounded-[7px] text-[11px] font-bold" style={{ background: b.bg, color: b.fg }}>
                  {b.mark}
                </span>
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Amount + currency */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Amount</FieldLabel>
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[26px] font-semibold text-fg3">
              {f.currency === "USD" ? "$" : "₹"}
            </span>
            <input
              inputMode="decimal"
              value={f.amount}
              onChange={(e) => set({ amount: e.target.value.replace(/[^0-9.]/g, "") })}
              placeholder="0"
              aria-label="Amount"
              className="field h-16! w-full rounded-2xl! pl-[42px]! text-[30px]! font-semibold tracking-[-0.04em] tabular-nums"
              style={{ borderColor: border(amountOk) }}
            />
          </div>
          <CurrencySwitch value={f.currency} onChange={(currency) => set({ currency })} />
        </div>
        <span className="min-h-4 text-[13px] text-fg3">
          {amount > 0 &&
            `${fmt(monthlyCost * 12)} a year · ${fmt(monthlyCost)} a month`}
        </span>
      </div>

      {/* Billing cycle */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Billing cycle</FieldLabel>
        <Segmented<BillingCycle>
          tone="inset"
          height={36}
          value={f.cycle}
          onChange={(cycle) => set({ cycle })}
          options={CYCLE_KEYS.map((k) => ({ value: k, label: CYCLES[k].seg }))}
        />
      </div>

      {/* Dates, side by side as in the design */}
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex min-w-0 flex-col gap-2">
          <FieldLabel>Next renewal</FieldLabel>
          <input
            type="date"
            value={next}
            onChange={(e) => set({ nextOverride: e.target.value || null })}
            className="field h-12! w-full min-w-0 px-3! text-[15px]!"
            style={{ borderColor: border(!!next) }}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2">
          <FieldLabel>Started</FieldLabel>
          <input
            type="date"
            value={f.start}
            onChange={(e) => set({ start: e.target.value, nextOverride: null })}
            className="field h-12! w-full min-w-0 px-3! text-[15px]!"
            style={{ borderColor: border(!!f.start) }}
          />
        </label>
      </div>

      {/* Payment method */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <FieldLabel>Paid with</FieldLabel>
          <button
            type="button"
            onClick={() => setPayOpen(!payOpen)}
            className="h-[30px] rounded-[15px] border-none bg-s2 px-3 text-[13px] font-medium text-fg"
          >
            {payOpen ? "Done" : pm ? "Change" : "Choose"}
          </button>
        </div>
        {!payOpen ? (
          <button
            type="button"
            onClick={() => setPayOpen(true)}
            className="flex animate-fade-in items-center gap-3.5 rounded-2xl border-none bg-bg py-2.5 pr-3.5 pl-2.5 text-left text-inherit shadow-[inset_0_0_0_1px_var(--color-hair2)] transition-transform duration-300 active:scale-[0.98]"
          >
            <div className="w-[84px] flex-none">
              {pm ? <CardArt look={cardLook(pm)} /> : <div className="aspect-[1.586] rounded-[5px] border border-dashed border-hair2" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[15px] font-semibold">{pm ? (labels.get(pm.id) ?? pm.display_name) : "Not set"}</span>
              <span className="truncate text-[13px] text-fg2">
                {pm
                  ? pm.type === "upi"
                    ? "UPI AutoPay"
                    : `${NETWORK_LABEL[pm.network ?? ""] ?? "Card"}${pm.bank ? " · " + pm.bank : ""}`
                  : "Pick the card or UPI app it's billed to"}
              </span>
            </div>
            <ChevronRight size={16} className="flex-none text-fg3" />
          </button>
        ) : (
          <div className="-mx-5 flex animate-fade-in snap-x snap-proximity gap-3 overflow-x-auto px-5 py-1.5">
            {pms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => (set({ paymentId: p.id }), setPayOpen(false))}
                aria-label={labels.get(p.id) ?? p.display_name}
                aria-pressed={paymentId === p.id}
                className="w-[150px] flex-none snap-start border-none bg-transparent p-0 transition-opacity duration-200"
                style={{ opacity: paymentId === p.id ? 1 : 0.6 }}
              >
                <CardArt look={cardLook(p)} selected={paymentId === p.id} />
              </button>
            ))}
            {paymentId && (
              <button
                type="button"
                onClick={() => (set({ paymentId: null }), setPayOpen(false))}
                className="grid w-[110px] flex-none place-items-center rounded-[7px] border border-dashed border-hair2 bg-transparent text-[13px] text-fg2"
              >
                None
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2.5">
        <FieldLabel>Category</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={f.category === c}
              onClick={() => set({ category: c, categoryTouched: true })}
              className={`flex h-[34px] items-center gap-[7px] rounded-[17px] border-none px-[13px] text-[13px] font-medium transition-colors duration-200 ${
                f.category === c ? "bg-inv text-invfg" : "bg-s2 text-fg"
              }`}
            >
              <span className="h-[7px] w-[7px] rounded-[2px]" style={{ background: CATEGORY_COLOR[c] }} />
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Status</FieldLabel>
        <Segmented<Status>
          tone="inset"
          height={36}
          value={f.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </div>

      {/* Notes */}
      <label className="flex flex-col gap-2">
        <FieldLabel>Notes</FieldLabel>
        <textarea
          value={f.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Plan, login email, anything"
          rows={3}
          maxLength={500}
          className="resize-none rounded-xl border border-hair2 bg-bg px-3.5 py-3 text-[15px] leading-[1.4] outline-none focus:border-fg"
        />
      </label>

      {(serverError || (showErrors && (!nameOk || !amountOk))) && (
        <span role="alert" className="text-[13px] text-warn">
          {serverError || (!nameOk ? "Add the merchant's name." : "Enter an amount above zero.")}
        </span>
      )}

      {editing && (
        <button
          type="button"
          onClick={onDelete}
          disabled={del.isPending}
          className="h-[46px] flex-none rounded-xl border-none bg-warnbg text-[15px] font-medium text-warn disabled:opacity-60"
        >
          Delete subscription
        </button>
      )}
    </Sheet>
  );
}

function CurrencySwitch({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="relative grid flex-none grid-cols-[48px_48px] rounded-[14px] bg-s2 p-1" role="radiogroup" aria-label="Currency">
      <div
        aria-hidden
        className="absolute top-1 bottom-1 w-12 rounded-[10px] bg-inv"
        style={{ left: value === "USD" ? 52 : 4, transition: "left .4s cubic-bezier(.3,1.3,.4,1)" }}
      />
      {(["INR", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={`relative h-12 border-none bg-transparent text-lg font-semibold transition-colors duration-200 ${
            value === c ? "text-invfg" : "text-fg2"
          }`}
        >
          {c === "INR" ? "₹" : "$"}
        </button>
      ))}
    </div>
  );
}
