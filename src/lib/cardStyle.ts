// How each payment method's drawn card looks (uploaded card art isn't used).
// Every card uses the pastel style from the Home wallet: a soft pastel face,
// the bank as a bold wordmark in the brand's colour, and a matching shade
// for the smaller text. Seeded cards have hand-picked pastels; anything else
// gets a pastel mixed from its own colour (or a stable colour from its name).
// Seeded cards get the hand-picked gradients from the design; anything else
// gets a gradient derived from a stable hash of its name.
import type { Network, PaymentMethod } from "../api/types";

export interface CardLook {
  kind: "card" | "upi";
  bank: string;
  name: string;
  network: Network;
  /** Pastel face colour of the drawn card. */
  bg: string;
  /** Wordmark (bank) and network colour. */
  ink: string;
  /** Second line, badge and amount colour. */
  sub: string;
  /** Brand quirks of the wordmark, e.g. "scapia" in lowercase, ICICI in italics. */
  lowercase?: boolean;
  italic?: boolean;
  /** Square tile colours for UPI apps. */
  tile?: string;
  tileFg?: string;
  mark?: string;
}

type Preset = Partial<Omit<CardLook, "bg" | "ink" | "sub">>;
type Pastel = Pick<CardLook, "bg" | "ink" | "sub" | "lowercase" | "italic">;

// Pastel faces, keyed like PRESETS (lower-cased display_name, plus network for the twins).
const PASTELS: Record<string, Pastel> = {
  "hdfc bank moneyback+": { bg: "#b3c6f2", ink: "#123f8c", sub: "#3a5a9c" },
  "icici sapphiro|visa": { bg: "#c3cddd", ink: "#7a1f1f", sub: "#4b5a70", italic: true },
  "icici sapphiro|rupay": { bg: "#cfd3dc", ink: "#7a1f1f", sub: "#525b6b", italic: true },
  "amazon pay icici": { bg: "#f6d59a", ink: "#232f3e", sub: "#8a5f17", lowercase: true },
  "icici coral": { bg: "#f4b9a8", ink: "#8f2a1c", sub: "#9a4a38", italic: true },
  "sbi card cashback": { bg: "#c2b9f0", ink: "#2b2a8c", sub: "#544aa3" },
  "axis scapia|mastercard": { bg: "#a6dccd", ink: "#0f5248", sub: "#2c7366", lowercase: true },
  "axis scapia|rupay": { bg: "#bfdcaa", ink: "#2c4f1d", sub: "#4a7236", lowercase: true },
  slice: { bg: "#d1b9f8", ink: "#4a1aa8", sub: "#6a46b8", lowercase: true },
  "idfc first millennia": { bg: "#f2b1b8", ink: "#8a1622", sub: "#9a3a45" },
  "bobcard select": { bg: "#f6c6a5", ink: "#9a3f0c", sub: "#a35a2c" },
  gpay: { bg: "#dfe8fb", ink: "#1a73e8", sub: "#4a6fa8" },
  "google pay": { bg: "#dfe8fb", ink: "#1a73e8", sub: "#4a6fa8" },
  phonepe: { bg: "#d9c6f2", ink: "#5f259f", sub: "#6e4a9c" },
  paytm: { bg: "#bfe9f8", ink: "#0b3d8c", sub: "#2a6a8c", lowercase: true },
  "cred upi": { bg: "#d6d6d3", ink: "#1a1a1a", sub: "#4a4a48" },
  "slice upi": { bg: "#d1b9f8", ink: "#4a1aa8", sub: "#6a46b8", lowercase: true },
};

/** A pastel face mixed from any colour (cards without a preset, or a colour you picked). */
export function pastelOf(color: string): Pastel {
  return {
    bg: `color-mix(in oklab, ${color} 38%, #ffffff)`,
    ink: `color-mix(in oklab, ${color} 80%, #000000)`,
    sub: `color-mix(in oklab, ${color} 70%, #333333)`,
  };
}

// Names and UPI tiles that differ from the defaults, keyed by lower-cased display_name.
const PRESETS: Record<string, Preset> = {
  // Co-branded cards: the design puts the brand on top and the issuer underneath.
  "amazon pay icici": { bank: "Amazon Pay", name: "ICICI Bank" },
  "axis scapia|mastercard": { bank: "Scapia", name: "Axis Bank" },
  "axis scapia|rupay": { bank: "Scapia", name: "Axis Bank" },
  slice: { bank: "slice", name: "Super card" },
  gpay: { mark: "G", tile: "#FFFFFF", tileFg: "#1A73E8" },
  "google pay": { mark: "G", tile: "#FFFFFF", tileFg: "#1A73E8" },
  phonepe: { mark: "Pe", tile: "#5F259F", tileFg: "#fff" },
  paytm: { mark: "P", tile: "#00B9F1", tileFg: "#fff" },
  "cred upi": { mark: "C", tile: "#1A1A1A", tileFg: "#fff" },
  "slice upi": { mark: "s", tile: "#6024D0", tileFg: "#fff" },
};

// The backend stores short bank names ("HDFC"); the card art shows the full
// name the way it's printed on the card, as in the design.
const BANK_ON_CARD: Record<string, string> = {
  hdfc: "HDFC Bank",
  icici: "ICICI Bank",
  sbi: "SBI Card",
  "idfc first": "IDFC FIRST",
  bob: "Bank of Baroda",
};

// Fallback colours for cards without a preset or picked colour (mid tones, like the swatches).
const TONES = ["#2F5BD3", "#138A72", "#7A3FE0", "#D0453C", "#D98A1C", "#4F5D75", "#1F8FB8", "#B8457F"];

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/**
 * The second line on a drawn card. The bank is already on the first line, so
 * don't repeat it: "HDFC" + "HDFC Regalia" shows "Regalia", and a name that is
 * just the bank ("slice" / "slice") shows nothing.
 */
export function cardName(bank: string | null, name: string): string {
  if (!bank) return "";
  const b = bank.trim().toLowerCase();
  const n = name.trim();
  if (n.toLowerCase() === b) return "";
  if (n.toLowerCase().startsWith(b + " ")) return n.slice(b.length).trim();
  return n;
}

export function cardLook(pm: PaymentMethod): CardLook {
  const key = pm.display_name.toLowerCase();
  const preset = PRESETS[`${key}|${pm.network}`] ?? PRESETS[key] ?? {};
  const tone = TONES[hash(key) % TONES.length];
  const upi = pm.type === "upi";
  // A colour you picked (Add card) beats the built-in look; null means "we pick".
  const pastel = pm.color ? pastelOf(pm.color) : (PASTELS[`${key}|${pm.network}`] ?? PASTELS[key] ?? pastelOf(preset.tile ?? tone));
  const chosen = pm.color ? { tile: pm.color, tileFg: "#fff" } : {};
  return {
    kind: upi ? "upi" : "card",
    bank: upi ? pm.name : (BANK_ON_CARD[(pm.bank ?? "").toLowerCase()] ?? pm.bank ?? pm.name),
    name: upi ? "UPI AutoPay" : cardName(pm.bank, pm.name),
    network: pm.network,
    tile: tone,
    tileFg: "#fff",
    mark: pm.name.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase(),
    ...preset,
    ...chosen,
    ...pastel,
  };
}

/** Swatches offered in Add card. Mid-tone colours, so the pastels mixed from them stay lively. */
export const CARD_COLORS = ["#2F5BD3", "#138A72", "#7A3FE0", "#D0453C", "#D98A1C", "#4F5D75"];

/** Thumbnail background for list rows and menus. */
export function thumbBg(pm: PaymentMethod | undefined | null): string {
  if (!pm) return "var(--color-s3)";
  return cardLook(pm).bg;
}

export const NETWORK_LABEL: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", rupay: "RuPay" };

/**
 * Names to show in pickers, filters, legends and rows. Two cards can share a
 * display_name (Scapia on Mastercard and on RuPay), so when that happens we
 * add the network: "Scapia · Mastercard" / "Scapia · RuPay".
 */
export function paymentLabels(pms: PaymentMethod[]): Map<string, string> {
  const count = new Map<string, number>();
  for (const p of pms) count.set(p.display_name, (count.get(p.display_name) ?? 0) + 1);
  return new Map(
    pms.map((p) => {
      const dup = (count.get(p.display_name) ?? 0) > 1 && p.network;
      return [p.id, dup ? `${p.display_name} · ${NETWORK_LABEL[p.network!]}` : p.display_name];
    }),
  );
}
