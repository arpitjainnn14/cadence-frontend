// The Home wallet: your three most-used cards (by monthly spend) tucked into a
// leather pouch, with the monthly total on the pocket and an eye button that
// hides every amount.
//
// Structure and motion follow the easyui "wallet-balance" component Arpit
// shared: a pouch made of a back panel and a stitched front pocket, cards that
// fan out and spring back into the pocket with a small stagger, and amounts
// that blur-crossfade to "••••••". The look (dark leather, real card art) is
// from the Claude Design wallet. No animation library: plain CSS transitions.
//
// Everything is drawn on a fixed 340×400 "stage" and scaled to the available
// width, so the proportions stay exact on any screen.
import { useState } from "react";
import type { PaymentMethod } from "../api/types";
import { cardLook } from "../lib/cardStyle";
import { dualText, usdText, type Dual } from "../lib/money";
import { useWidth } from "../ui/useWidth";
import { CardArt } from "./CardArt";
import { RollingNumber } from "./RollingNumber";

export interface WalletCard {
  pm: PaymentMethod;
  /** Monthly spend billed to this card, ₹ and $ kept apart. */
  monthly: Dual;
}

// ₹ and $ are never converted: each total is a Dual shown side by side.
interface Props {
  monthly: Dual;
  halfYearly: Dual;
  yearly: Dual;
  /** Most-used first; we show up to three. */
  cards: WalletCard[];
  onOpenCard: (id: string) => void;
}

// ---- stage geometry (from wallet-balance) ----
const STAGE_W = 340;
const STAGE_H = 400;
const CARD_W = 266;
const CARD_LEFT = (STAGE_W - CARD_W) / 2;
const POCKET_TOP = 179;
const shownTop = (i: number) => 13 + i * 49.5; // fanned out
const hiddenTop = (i: number) => 75 + i * 35; // tucked into the pouch
const HIDE_SCALE = 0.89;
const SPRING = "cubic-bezier(.34,1.36,.5,1)"; // a CSS stand-in for a soft spring
const MASK = "••••••";

/** Swaps between the real value and a mask with a blur-crossfade. While hidden, the real value isn't in the page at all. */
function Swap({ show, children, mask = MASK, className = "" }: { show: boolean; children: React.ReactNode; mask?: string; className?: string }) {
  return (
    <span key={show ? "value" : "mask"} className={`inline-flex ${className}`} style={{ animation: "unblur .22s cubic-bezier(.23,1,.32,1)" }}>
      {show ? children : mask}
    </span>
  );
}

/** Eye with a slash that draws in when amounts are hidden. */
function Eye({ open }: { open: boolean }) {
  const slash = { strokeDasharray: 32, strokeDashoffset: open ? 32 : 0, transition: "stroke-dashoffset .28s cubic-bezier(.23,1,.32,1)" };
  return (
    <svg viewBox="0 0 34 24" className="h-[22px] w-[31px] overflow-visible" aria-hidden>
      <g style={{ color: open ? "#F5F5F4" : "#7C7C79", transition: "color .28s" }}>
        <path d="M1.5 12C5.5 5 10.5 1.5 17 1.5S28.5 5 32.5 12c-4 7-9 10.5-15.5 10.5S5.5 19 1.5 12Z" fill="currentColor" />
        <circle cx="17" cy="12" r="6.6" fill="#18181A" />
        <circle cx="17" cy="12" r="3.6" fill="currentColor" />
      </g>
      {/* dark underlay cuts the eye, light stroke on top */}
      <path d="M5 22.5 29 1.5" stroke="#18181A" strokeWidth={5} strokeLinecap="round" fill="none" style={slash} />
      <path d="M5 22.5 29 1.5" stroke="#9B9B98" strokeWidth={2} strokeLinecap="round" fill="none" style={slash} />
    </svg>
  );
}

export function WalletHero({ monthly, halfYearly, yearly, cards, onOpenCard }: Props) {
  const [shown, setShown] = useState(true);
  const [showHalf, setShowHalf] = useState(false);
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const scale = width / STAGE_W;
  const list = cards.slice(0, 3);
  const n = list.length;

  return (
    <section
      ref={wrapRef}
      aria-label="Monthly spend"
      className="relative mx-auto w-full max-w-[400px] select-none"
      style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale || 1})`, opacity: width ? 1 : 0 }}
      >
        {/* Back of the pouch */}
        <svg
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          width={STAGE_W}
          height={STAGE_H}
          className="absolute inset-0"
          style={{ filter: "drop-shadow(0 22px 26px rgba(0,0,0,0.35))" }}
          aria-hidden
        >
          <defs>
            <linearGradient id="wallet-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a2a2d" />
              <stop offset="100%" stopColor="#1c1c1f" />
            </linearGradient>
          </defs>
          <path
            d="M20 112C20 102 28 96 38 96H302C312 96 320 102 320 112V316A66 66 0 0 1 254 382H86A66 66 0 0 1 20 316Z"
            fill="url(#wallet-back)"
          />
        </svg>

        {/* Cards: front card = most used. Staggered spring in/out. */}
        {list.map((c, i) => {
          const delay = (shown ? i : n - 1 - i) * 30;
          return (
            <button
              key={c.pm.id}
              type="button"
              onClick={() => onOpenCard(c.pm.id)}
              aria-label={c.pm.display_name}
              className="absolute border-none bg-transparent p-0"
              style={{
                left: CARD_LEFT,
                top: 0,
                width: CARD_W,
                zIndex: i + 1,
                transformOrigin: "50% 0%",
                transform: `translateY(${shown ? shownTop(i) : hiddenTop(i)}px) scale(${shown ? 1 : HIDE_SCALE})`,
                transition: `transform .5s ${SPRING} ${delay}ms`,
              }}
            >
              {/* Tucked cards only show their top strip, so drop the second line instead of letting it peek out half-cut. */}
              <CardArt look={{ ...cardLook(c.pm), ...(shown ? {} : { name: "" }) }} badge={shown ? `${dualText(c.monthly)}/mo` : MASK} />
            </button>
          );
        })}

        {/* Front pocket with stitching */}
        <svg
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          width={STAGE_W}
          height={STAGE_H}
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 10 }}
          aria-hidden
        >
          <defs>
            <linearGradient id="wallet-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#252527" />
              <stop offset="55%" stopColor="#18181A" />
              <stop offset="100%" stopColor="#121213" />
            </linearGradient>
          </defs>
          <path
            d={`M30 198C30 188 41 ${POCKET_TOP} 54 ${POCKET_TOP}L286 ${POCKET_TOP}C299 ${POCKET_TOP + 1} 310 188 310 198V322A56 56 0 0 1 254 378H86A56 56 0 0 1 30 322Z`}
            fill="url(#wallet-front)"
            stroke="rgba(255,255,255,0.08)"
          />
          <path
            d="M38 199C38 192 46 187 56 187L284 187C294 187 302 192 302 199V322A48 48 0 0 1 254 370H86A48 48 0 0 1 38 322Z"
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1}
            strokeDasharray="4 3.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Total on the pocket */}
        <div className="absolute inset-x-0 text-center text-[#F5F5F4]" style={{ top: 197, zIndex: 11 }}>
          <div className="flex h-9 items-center justify-center">
            <Swap show={shown} className="items-start text-[30px] leading-none font-semibold tracking-[-0.04em]">
              <span className="mt-[3px] mr-0.5 text-[16px] tracking-normal text-[#7C7C79]">₹</span>
              <RollingNumber value={monthly.inr} />
              {/* $ subscriptions, totalled in $ beside the ₹ figure */}
              {monthly.usd > 0 && (
                <span className="mt-[9px] ml-2 text-[18px] tracking-[-0.02em] text-[#9B9B98]">+ {usdText(monthly.usd)}</span>
              )}
            </Swap>
          </div>
          <p className="m-0 mt-1 text-[13px] text-[#9B9B98]">Monthly spend</p>

          {/* Yearly, plus half-yearly on its own line when "6 mo" is on */}
          <div className="mt-2.5 flex items-center justify-center gap-2 text-[12.5px] text-[#9B9B98]">
            <span>
              <Swap show={shown} mask="••••" className="font-semibold text-[#F5F5F4] tabular-nums">
                {dualText(yearly)}
              </Swap>{" "}
              a year
            </span>
            <button
              type="button"
              onClick={() => setShowHalf(!showHalf)}
              aria-pressed={showHalf}
              title="Show half-yearly"
              className="h-[22px] rounded-[11px] border-none px-2 text-[11px] font-medium transition-colors duration-200"
              style={{ background: showHalf ? "#F5F5F4" : "rgba(255,255,255,0.08)", color: showHalf ? "#0A0A0A" : "#F5F5F4" }}
            >
              6 mo
            </button>
          </div>
          {showHalf && (
            <div className="mt-1.5 animate-fade-in text-[12.5px] text-[#9B9B98]">
              <Swap show={shown} mask="••••" className="font-semibold text-[#F5F5F4] tabular-nums">
                {dualText(halfYearly)}
              </Swap>{" "}
              every 6 months
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-pressed={!shown}
          aria-label={shown ? "Hide amounts" : "Show amounts"}
          className="absolute grid h-14 w-14 place-items-center rounded-full border-none bg-transparent transition-transform duration-150 active:scale-[0.92]"
          style={{ left: STAGE_W / 2 - 28, top: 310, zIndex: 12 }}
        >
          <Eye open={shown} />
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        {shown ? `Monthly spend ${dualText(monthly)}` : "Amounts hidden"}
      </span>
    </section>
  );
}
