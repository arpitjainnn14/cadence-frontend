// How each payment method looks when it has no uploaded card art.
// Seeded cards get the hand-picked gradients from the design; anything else
// gets a gradient derived from a stable hash of its name.
import { api } from "../api/endpoints";
import type { Network, PaymentMethod } from "../api/types";

export interface CardLook {
  kind: "card" | "upi";
  bank: string;
  name: string;
  network: Network;
  /** CSS background for the drawn card. */
  bg: string;
  fg?: string;
  /** Small brand-colour square next to the bank name. */
  dot?: string;
  /** URL of uploaded card art, if any. */
  image?: string;
  /** Square tile colours for UPI apps. */
  tile?: string;
  tileFg?: string;
  mark?: string;
}

type Preset = Partial<CardLook>;

// Keyed by lower-cased display_name.
const PRESETS: Record<string, Preset> = {
  "hdfc bank moneyback+": { dot: "#E2231A", bg: "linear-gradient(135deg,#2650b0 0%,#163a85 48%,#0b1f52 100%)" },
  "icici sapphiro|visa": { dot: "#F37021", bg: "linear-gradient(140deg,#4a6287 0%,#22344f 45%,#0d1522 100%)" },
  "icici sapphiro|rupay": { dot: "#F37021", bg: "linear-gradient(140deg,#5d6b80 0%,#2b3646 48%,#121820 100%)" },
  // Co-branded cards: the design puts the brand on top and the issuer underneath.
  "amazon pay icici": { bank: "Amazon Pay", name: "ICICI Bank", dot: "#FF9900", bg: "linear-gradient(135deg,#37475a 0%,#1f2a37 50%,#0f151c 100%)" },
  "icici coral": { dot: "#F37021", bg: "linear-gradient(135deg,#ef8a6f 0%,#c4513f 50%,#7a2626 100%)" },
  "sbi card cashback": { dot: "#29A8E0", bg: "linear-gradient(135deg,#5340a0 0%,#2e2165 50%,#160f36 100%)" },
  "axis scapia|mastercard": { bank: "Scapia", name: "Axis Bank", bg: "linear-gradient(135deg,#1f7a70 0%,#0f4842 52%,#06211f 100%)" },
  "axis scapia|rupay": { bank: "Scapia", name: "Axis Bank", bg: "linear-gradient(135deg,#5b7f45 0%,#2f4a24 52%,#141f10 100%)" },
  slice: { bank: "slice", name: "Super card", bg: "linear-gradient(135deg,#9a5cff 0%,#6024d0 50%,#2c0d6e 100%)" },
  "idfc first millennia": { bg: "linear-gradient(135deg,#b62a35 0%,#7c1420 50%,#3d070e 100%)" },
  "bobcard select": { dot: "#F26522", bg: "linear-gradient(135deg,#4a3021 0%,#241610 55%,#0f0907 100%)" },
  gpay: { mark: "G", tile: "#FFFFFF", tileFg: "#1A73E8", fg: "#1f1f1f", bg: "linear-gradient(135deg,#ffffff 0%,#e9ecf1 100%)" },
  "google pay": { mark: "G", tile: "#FFFFFF", tileFg: "#1A73E8", fg: "#1f1f1f", bg: "linear-gradient(135deg,#ffffff 0%,#e9ecf1 100%)" },
  phonepe: { mark: "Pe", tile: "#5F259F", tileFg: "#fff", bg: "linear-gradient(135deg,#7b3fd1 0%,#4d1a91 100%)" },
  paytm: { mark: "P", tile: "#00B9F1", tileFg: "#fff", bg: "linear-gradient(135deg,#00b9f1 0%,#0b3d8c 100%)" },
  "cred upi": { mark: "C", tile: "#1A1A1A", tileFg: "#fff", bg: "linear-gradient(135deg,#3a3a3a 0%,#0d0d0d 100%)" },
  "slice upi": { mark: "s", tile: "#6024D0", tileFg: "#fff", bg: "linear-gradient(135deg,#9a5cff 0%,#4a1aa8 100%)" },
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

const TONES =["#1E3A8A", "#0F4C46", "#5B21B6", "#7F1D1D", "#3F3F46", "#92400E", "#1F5F7A", "#6B2D5C"];

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function toneGradient(tone: string): string {
  return `linear-gradient(135deg,color-mix(in oklab,${tone} 70%,white) 0%,${tone} 50%,color-mix(in oklab,${tone} 50%,black) 100%)`;
}

export function cardLook(pm: PaymentMethod): CardLook {
  const key = pm.display_name.toLowerCase();
  const preset = PRESETS[`${key}|${pm.network}`] ?? PRESETS[key] ?? {};
  const tone = TONES[hash(key) % TONES.length];
  const upi = pm.type === "upi";
  // A colour you picked (Add card) beats the built-in look; null means "we pick".
  const chosen = pm.color ? { bg: toneGradient(pm.color), tile: pm.color, tileFg: "#fff", fg: "#fff" } : {};
  return {
    kind: upi ? "upi" : "card",
    bank: upi ? pm.name : (BANK_ON_CARD[(pm.bank ?? "").toLowerCase()] ?? pm.bank ?? pm.name),
    name: upi ? "UPI AutoPay" : pm.bank && pm.bank !== pm.name ? pm.name : "",
    network: pm.network,
    bg: toneGradient(tone),
    tile: tone,
    tileFg: "#fff",
    mark: pm.name.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase(),
    ...preset,
    ...chosen,
    image: pm.has_image ? api.paymentMethodImageUrl(pm.id) : undefined,
  };
}

/** Swatches offered in Add card (from the design). */
export const CARD_COLORS = ["#1E3A8A", "#0F4C46", "#5B21B6", "#7F1D1D", "#3F3F46", "#92400E"];

/** Thumbnail background for list rows and menus. */
export function thumbBg(pm: PaymentMethod | undefined | null): string {
  if (!pm) return "var(--color-s3)";
  const look = cardLook(pm);
  // Real art is transparent and may be portrait: show it whole, no backdrop.
  return look.image ? `center / contain no-repeat url("${look.image}")` : look.bg;
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
