// Drawn credit card / UPI card from CardArt.dc.html ("gradient" variant).
// Sizes use container-query units (cqw) so the card scales with its width,
// exactly like the design.
//
// If the card has uploaded art, we show ONLY that art (plus the spend badge):
// real card art already has its own bank name, chip and network logo, so
// drawing ours on top would print everything twice. The art is transparent
// and can be portrait or landscape, so it's shown whole (object-fit: contain),
// upright and centred, never cropped. If the image fails to load, we fall back
// to the drawn card, which includes the card's name.
import { useEffect, useState, type CSSProperties } from "react";
import type { CardLook } from "../lib/cardStyle";

interface Props {
  look: CardLook;
  /** Small pill in the top-right, e.g. "₹1,233/mo". */
  badge?: string;
  selected?: boolean;
  /** Width/height of the slot the art sits in. Defaults to a card's 1.586. */
  slot?: number;
}

export function CardArt({ look, badge, selected, slot = 1.586 }: Props) {
  const upi = look.kind === "upi";
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [look.image]);
  const showImage = !!look.image && !broken;
  const ring = selected ? "2px solid var(--color-fg)" : "2px solid transparent";

  return (
    // text-left: cards often sit inside a <button>, which centres text by default.
    <div className="w-full text-left" style={{ containerType: "inline-size" }}>
      {showImage ? (
        // The slot keeps the usual card shape so grids and stacks line up; the
        // art sits inside it at its own shape, with no background behind it.
        <div className="relative flex w-full items-center justify-center" style={{ aspectRatio: String(slot) }}>
          {/* Wrapper hugs the image, so the badge and selection ring sit on the card itself. */}
          <div
            className="relative inline-flex"
            style={{ borderRadius: "4cqw", outline: ring, outlineOffset: 3, transition: "outline-color .2s" }}
          >
            {/* Scale the art to fit the slot whatever its shape: the slot is
                100cqw wide and 100/slot cqw tall (cqw = 1% of the slot width). */}
            <img
              src={look.image}
              alt=""
              draggable={false}
              onError={() => setBroken(true)}
              className="block h-auto w-auto select-none"
              style={{
                maxWidth: "100cqw",
                maxHeight: `${100 / slot}cqw`,
                filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.32)) drop-shadow(0 2px 4px rgba(0,0,0,0.18))",
              }}
            />
            {badge && <Badge text={badge} onImage />}
          </div>
        </div>
      ) : (
        <SlotFrame slot={slot}>
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "1.586",
            borderRadius: "5cqw",
            background: look.bg,
            color: look.fg ?? "#fff",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.06), 0 22px 44px -22px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.25)",
            outline: ring,
            outlineOffset: 3,
            transition: "outline-color .2s",
          }}
        >
          <DrawnFace look={look} upi={upi} badge={badge} />
        </div>
        </SlotFrame>
      )}
    </div>
  );
}

/** Centres a card-shaped drawing in a differently shaped slot (e.g. the square slots of the phone grid). */
function SlotFrame({ slot, children }: { slot: number; children: React.ReactNode }) {
  if (slot === 1.586) return <>{children}</>;
  return (
    <div className="flex w-full items-center" style={{ aspectRatio: String(slot) }}>
      {children}
    </div>
  );
}

/** Spend pill in the top-right corner. On photos it gets a stronger backdrop so it stays readable. */
function Badge({ text, onImage = false }: { text: string; onImage?: boolean }) {
  return (
    <span
      className="font-semibold whitespace-nowrap tabular-nums"
      style={{
        ...(onImage ? { position: "absolute", top: "4cqw", right: "4cqw", color: "#fff" } : {}),
        // On small art (e.g. the phone grid) cqw gets tiny, so keep at least 11px.
        fontSize: "max(11px, 4.2cqw)",
        padding: "1.2cqw 2.6cqw",
        borderRadius: 99,
        background: onImage ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.24)",
        backdropFilter: onImage ? "blur(6px)" : undefined,
        WebkitBackdropFilter: onImage ? "blur(6px)" : undefined,
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
        // Drawn thumbnails get a hairline edge; real (transparent) art doesn't need one.
        boxShadow: bg.includes("url(") ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.16), 0 1px 2px rgba(0,0,0,0.3)",
      }}
    />
  );
}
