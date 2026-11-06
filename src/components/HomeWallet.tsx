// Home's wallet: the easyui WalletBalance component, exactly as published,
// filled with Cadence data, plus a small totals line under it.
//
// - The three cards are the ones with the most ₹ spend; each shows its
//   monthly ₹ amount. (The wallet shows one currency, so $ spend is listed
//   in the line below instead of being converted.)
// - The pocket shows the whole monthly ₹ spend (`total`), not just the sum of
//   the three cards. The eye button hides every amount, as in the original.
import { useState } from "react";
import type { PaymentMethod } from "../api/types";
import { cardLook } from "../lib/cardStyle";
import { groupINR } from "../lib/format";
import { dualText, usdText, type Dual } from "../lib/money";
import { WalletBalance, type WalletAccount } from "./ui/wallet-balance";

interface Props {
  /** Amounts shown (false after tapping the eye). Owned by Home so the budget meter can hide too. */
  visible: boolean;
  onVisibleChange: (v: boolean) => void;
  monthly: Dual;
  halfYearly: Dual;
  yearly: Dual;
  /** Cards with their monthly spend, most-used first. */
  cards: { pm: PaymentMethod; monthly: Dual }[];
}

export function HomeWallet({ visible, onVisibleChange, monthly, halfYearly, yearly, cards }: Props) {
  const [showHalf, setShowHalf] = useState(false);

  const accounts: WalletAccount[] = cards
    .filter((c) => c.monthly.inr > 0)
    .slice(0, 3)
    .map(({ pm, monthly: m }) => {
      const look = cardLook(pm);
      const style = pastelFor(pm, look.tile ?? "#8E8E8B");
      return {
        id: pm.id,
        name: pm.display_name,
        balance: Math.round(m.inr),
        logo: <Wordmark text={look.bank} ink={style.ink} lowercase={style.lowercase} italic={style.italic} />,
        background: style.bg,
        amountColor: style.amount,
      };
    });

  const hide = (text: string) => (visible ? text : "••••");

  return (
    <div className="flex flex-col items-center gap-3">
      <WalletBalance
        accounts={accounts}
        total={Math.round(monthly.inr)}
        totalLabel="Monthly spend"
        currency="INR"
        locale="en-IN"
        visible={visible}
        onVisibleChange={onVisibleChange}
      />

      {/* Yearly (and half-yearly), plus anything billed in $, which the wallet can't show. */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-fg2">
        {monthly.usd > 0 && (
          <span>
            <span className="font-semibold text-fg tabular-nums">+ {hide(usdText(monthly.usd))}</span>/mo in $ ·
          </span>
        )}
        <span>
          <span className="font-semibold text-fg tabular-nums">{hide(dualText(yearly))}</span> a year
        </span>
        <button
          type="button"
          onClick={() => setShowHalf(!showHalf)}
          aria-pressed={showHalf}
          className={`h-[22px] rounded-[11px] border-none px-2 text-[11px] font-medium transition-colors duration-200 ${
            showHalf ? "bg-inv text-invfg" : "bg-s2 text-fg"
          }`}
        >
          6 mo
        </button>
      </div>
      {showHalf && (
        <span className="animate-fade-in text-[13px] text-fg2">
          <span className="font-semibold text-fg tabular-nums">{hide(dualText(halfYearly))}</span> every 6 months
        </span>
      )}
      <span className="sr-only">{visible ? `Monthly spend ₹${groupINR(monthly.inr)}` : ""}</span>
    </div>
  );
}

// --- Pastel card faces, like the easyui demo (soft colour + a brand-coloured wordmark) ---

type Pastel = { bg: string; ink: string; amount: string; lowercase?: boolean; italic?: boolean };

// Keyed by lower-cased display name (and network for the twin cards).
const PASTELS: Record<string, Pastel> = {
  "hdfc bank moneyback+": { bg: "#b3c6f2", ink: "#123f8c", amount: "#3a5a9c" },
  "icici sapphiro|visa": { bg: "#c3cddd", ink: "#7a1f1f", amount: "#4b5a70", italic: true },
  "icici sapphiro|rupay": { bg: "#cfd3dc", ink: "#7a1f1f", amount: "#525b6b", italic: true },
  "amazon pay icici": { bg: "#f6d59a", ink: "#232f3e", amount: "#8a5f17", lowercase: true },
  "icici coral": { bg: "#f4b9a8", ink: "#8f2a1c", amount: "#9a4a38", italic: true },
  "sbi card cashback": { bg: "#c2b9f0", ink: "#2b2a8c", amount: "#544aa3" },
  "axis scapia|mastercard": { bg: "#a6dccd", ink: "#0f5248", amount: "#2c7366", lowercase: true },
  "axis scapia|rupay": { bg: "#bfdcaa", ink: "#2c4f1d", amount: "#4a7236", lowercase: true },
  slice: { bg: "#d1b9f8", ink: "#4a1aa8", amount: "#6a46b8", lowercase: true },
  "idfc first millennia": { bg: "#f2b1b8", ink: "#8a1622", amount: "#9a3a45" },
  "bobcard select": { bg: "#f6c6a5", ink: "#9a3f0c", amount: "#a35a2c" },
};

function pastelFor(pm: PaymentMethod, tone: string): Pastel {
  const key = pm.display_name.toLowerCase();
  const preset = PASTELS[`${key}|${pm.network}`] ?? PASTELS[key];
  if (preset && !pm.color) return preset;
  // Anything else: a pastel mixed from the card's own colour.
  const base = pm.color ?? tone;
  return {
    bg: `color-mix(in oklab, ${base} 38%, #ffffff)`,
    ink: `color-mix(in oklab, ${base} 80%, #000000)`,
    amount: `color-mix(in oklab, ${base} 70%, #333333)`,
  };
}

function Wordmark({ text, ink, lowercase, italic }: { text: string; ink: string; lowercase?: boolean; italic?: boolean }) {
  return (
    <span
      className={`text-[21px] leading-none font-extrabold tracking-[-0.045em] ${italic ? "italic" : ""}`}
      style={{ color: ink }}
    >
      {lowercase ? text.toLowerCase() : text}
    </span>
  );
}
