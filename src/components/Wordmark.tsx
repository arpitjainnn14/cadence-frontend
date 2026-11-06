// The bank or app name as a bold wordmark in its brand colour: the lettering
// used on the Home wallet cards, the drawn cards and the UPI tiles.
import type { CSSProperties } from "react";
import type { CardLook } from "../lib/cardStyle";

interface Props {
  look: Pick<CardLook, "bank" | "ink" | "lowercase" | "italic">;
  /** Any CSS font size, e.g. 21 (px) or "7.9cqw". */
  size: number | string;
  style?: CSSProperties;
}

export function Wordmark({ look, size, style }: Props) {
  return (
    <span
      className={`leading-none font-extrabold whitespace-nowrap ${look.italic ? "italic" : ""}`}
      style={{ fontSize: size, letterSpacing: "-0.045em", color: look.ink, ...style }}
    >
      {look.lowercase ? look.bank.toLowerCase() : look.bank}
    </span>
  );
}
