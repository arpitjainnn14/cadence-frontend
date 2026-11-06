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
      const look = cardLook(pm); // the shared pastel style (lib/cardStyle.ts)
      return {
        id: pm.id,
        name: pm.display_name,
        balance: Math.round(m.inr),
        logo: <Wordmark text={look.bank} ink={look.ink} lowercase={look.lowercase} italic={look.italic} />,
        background: look.bg,
        amountColor: look.sub,
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

/** The bank as a bold wordmark in its brand colour (same as on the drawn cards). */
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
