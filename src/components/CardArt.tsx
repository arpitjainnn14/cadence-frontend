// Drawn credit card / UPI card from CardArt.dc.html ("gradient" variant).
// Sizes use container-query units (cqw) so the card scales with its width,
// exactly like the design. Every card is drawn (bank colour or the colour you
// picked, bank + card name, chip, network); uploaded card art isn't used.
import type { CSSProperties } from "react";
import type { CardLook } from "../lib/cardStyle";

interface Props {
  look: CardLook;
  /** Small pill in the top-right, e.g. "₹1,233/mo". */
  badge?: string;
  selected?: boolean;
}

export function CardArt({ look, badge, selected }: Props) {
  return (
    // text-left: cards often sit inside a <button>, which centres text by default.
    <div className="w-full text-left" style={{ containerType: "inline-size" }}>
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "1.586",
          borderRadius: "5cqw",
          background: look.bg,
          color: look.fg ?? "#fff",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.06), 0 22px 44px -22px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.25)",
          outline: selected ? "2px solid var(--color-fg)" : "2px solid transparent",
          outlineOffset: 3,
          transition: "outline-color .2s",
        }}
      >
        <DrawnFace look={look} upi={look.kind === "upi"} badge={badge} />
      </div>
    </div>
  );
}

/** Spend pill in the top-right corner. */
function Badge({ text }: { text: string }) {
  return (
    <span
      className="font-semibold whitespace-nowrap tabular-nums"
      style={{
        // On small cards cqw gets tiny, so keep at least 11px.
        fontSize: "max(11px, 4.2cqw)",
        padding: "1.2cqw 2.6cqw",
        borderRadius: 99,
        background: "rgba(0,0,0,0.24)",
      }}
    >
      {text}
    </span>
  );
}

/** The design's drawn card: sheen, rings, bank and product name, chip and network mark. */
function DrawnFace({ look, upi, badge }: { look: CardLook; upi: boolean; badge?: string }) {
  return (
    <>
        {/* soft light from the top-left */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(130% 90% at 0% 0%,rgba(255,255,255,0.18),rgba(255,255,255,0) 52%)" }}
        />
        {/* decorative rings */}
        <div className="absolute rounded-full" style={ring(96, -44, -58, 0.1)} />
        <div className="absolute rounded-full" style={ring(64, -26, -40, 0.07)} />

        {/* top row: bank + product, badge */}
        <div
          className="absolute flex items-start justify-between"
          style={{ top: "6.4cqw", left: "7cqw", right: "7cqw", gap: "3cqw" }}
        >
          <div className="flex min-w-0 flex-col" style={{ gap: "1.2cqw" }}>
            <div className="flex items-center" style={{ gap: "2cqw" }}>
              {look.dot && (
                <span className="flex-none" style={{ width: "3.2cqw", height: "3.2cqw", borderRadius: "0.8cqw", background: look.dot }} />
              )}
              <span className="font-semibold whitespace-nowrap" style={{ fontSize: "4.7cqw", letterSpacing: "-0.01em" }}>
                {look.bank}
              </span>
            </div>
            {look.name && (
              <span className="font-medium whitespace-nowrap opacity-70" style={{ fontSize: "3.6cqw" }}>
                {look.name}
              </span>
            )}
          </div>
          {badge && <Badge text={badge} />}
        </div>

        {/* EMV chip */}
        {!upi && (
          <div
            className="absolute"
            style={{
              left: "7cqw",
              top: "41%",
              width: "11.5cqw",
              height: "8.8cqw",
              borderRadius: "1.8cqw",
              background: "linear-gradient(135deg,#efdcab,#b8955a 52%,#e7d199)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18)",
            }}
          />
        )}

        {/* network mark, bottom-right */}
        <div className="absolute flex items-end justify-end" style={{ left: "7cqw", right: "7cqw", bottom: "6.4cqw" }}>
          <NetworkMark look={look} />
        </div>
    </>
  );
}

function ring(size: number, right: number, bottom: number, alpha: number): CSSProperties {
  return {
    width: `${size}cqw`,
    height: `${size}cqw`,
    right: `${right}cqw`,
    bottom: `${bottom}cqw`,
    border: `1px solid rgba(255,255,255,${alpha})`,
  };
}

function NetworkMark({ look }: { look: CardLook }) {
  const italic = "font-extrabold italic leading-none";
  if (look.kind === "upi")
    return (
      <span className={italic} style={{ fontSize: "5.2cqw", letterSpacing: "0.02em" }}>
        UPI
      </span>
    );
  if (look.network === "visa")
    return (
      <span className={italic} style={{ fontSize: "7.4cqw", letterSpacing: "-0.02em" }}>
        VISA
      </span>
    );
  if (look.network === "rupay")
    return (
      <span className={italic} style={{ fontSize: "5.6cqw", letterSpacing: "-0.01em" }}>
        RuPay
      </span>
    );
  if (look.network === "mastercard")
    return (
      <div className="flex">
        <span className="rounded-full" style={{ width: "8.6cqw", height: "8.6cqw", background: "#EB001B" }} />
        <span
          className="rounded-full"
          style={{ width: "8.6cqw", height: "8.6cqw", background: "#F79E1B", marginLeft: "-3.6cqw", opacity: 0.92 }}
        />
      </div>
    );
  return null;
}

/** The tiny 24×15 card used in list rows. */
export function CardThumb({ bg, title, w = 24 }: { bg: string; title?: string; w?: number }) {
  return (
    <div
      title={title}
      className="relative flex-none overflow-hidden rounded-[3px]"
      style={{
        width: w,
        height: Math.round(w / 1.6),
        background: bg,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16), 0 1px 2px rgba(0,0,0,0.3)",
      }}
    />
  );
}
