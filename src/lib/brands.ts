// A small built-in list of common merchants. It gives us:
//  - brand-coloured letter tiles (used whenever there's no logo image),
//  - "did you mean" suggestions while typing,
//  - a sensible default category when you pick one.
// Real logos come from the backend (`logo_url`); this is the fallback look.
import type { Category } from "../api/types";

export interface Brand {
  name: string;
  bg: string;
  fg: string;
  mark: string;
  category: Category;
}

const B = (name: string, bg: string, fg: string, mark: string, category: Category): Brand => ({ name, bg, fg, mark, category });

export const BRANDS: Brand[] = [
  B("Netflix", "#E50914", "#fff", "N", "Streaming"),
  B("Spotify", "#1ED760", "#07140C", "S", "Music"),
  B("YouTube Premium", "#FF0033", "#fff", "Y", "Streaming"),
  B("Amazon Prime", "#1A98FF", "#fff", "P", "Shopping"),
  B("Apple iCloud+", "#EEF2F7", "#1F7AF2", "i", "Cloud storage"),
  B("ChatGPT Plus", "#0FA47F", "#fff", "C", "Software/AI"),
  B("Claude Pro", "#D97757", "#fff", "C", "Software/AI"),
  B("cult.fit", "#FF2D55", "#fff", "c", "Fitness"),
  B("Swiggy One", "#FC8019", "#fff", "S", "Food delivery"),
  B("Zomato Gold", "#E23744", "#fff", "Z", "Food delivery"),
  B("Notion", "#F3F2EE", "#111", "N", "Productivity"),
  B("JioHotstar", "#0E1E5B", "#fff", "J", "Streaming"),
  B("LinkedIn Premium", "#0A66C2", "#fff", "in", "Productivity"),
  B("Audible", "#F7991C", "#1A1206", "A", "Music"),
  B("Apple Music", "#FA2D48", "#fff", "M", "Music"),
  B("Apple TV+", "#1C1C1E", "#fff", "tv", "Streaming"),
  B("Google One", "#4285F4", "#fff", "G", "Cloud storage"),
  B("Adobe Creative Cloud", "#DA1F26", "#fff", "A", "Software/AI"),
  B("Figma", "#1E1E1E", "#fff", "F", "Software/AI"),
  B("Canva Pro", "#7D2AE8", "#fff", "C", "Software/AI"),
  B("SonyLIV", "#1A1A1A", "#fff", "S", "Streaming"),
  B("ZEE5", "#8230C6", "#fff", "Z", "Streaming"),
  B("Microsoft 365", "#0078D4", "#fff", "M", "Productivity"),
  B("Duolingo Super", "#58CC02", "#fff", "D", "Education"),
  B("Times Prime", "#1C1C1C", "#E5C07B", "T", "Shopping"),
  B("The Hindu", "#1C1C1C", "#fff", "H", "News"),
  B("Xbox Game Pass", "#107C10", "#fff", "X", "Gaming"),
  B("PlayStation Plus", "#003791", "#fff", "P", "Gaming"),
  B("Coursera Plus", "#0056D2", "#fff", "C", "Education"),
  B("Jio Recharge", "#0F3CC9", "#fff", "J", "Telecom"),
  B("Airtel", "#E40000", "#fff", "A", "Telecom"),
  B("HealthifyMe", "#2EB872", "#fff", "H", "Health"),
  B("MakeMyTrip", "#E7262B", "#fff", "M", "Travel"),
];

export const QUICK_ADD = ["Netflix", "Spotify", "YouTube Premium", "Amazon Prime", "ChatGPT Plus", "Swiggy One"];

const byLower = new Map(BRANDS.map((b) => [b.name.toLowerCase(), b]));

/** Exact (case-insensitive) match, else a prefix match once 2+ letters are typed. */
export function findBrand(name: string): Brand | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  const exact = byLower.get(n);
  if (exact) return exact;
  if (n.length < 2) return null;
  return BRANDS.find((b) => b.name.toLowerCase().startsWith(n)) ?? null;
}

export function exactBrand(name: string): Brand | null {
  return byLower.get(name.trim().toLowerCase()) ?? null;
}

/** Up to 5 suggestions containing the text, prefix matches first. */
export function suggestBrands(q: string): Brand[] {
  const n = q.trim().toLowerCase();
  if (!n || exactBrand(q)) return [];
  return BRANDS.filter((b) => b.name.toLowerCase().includes(n))
    .sort((a, b) => Number(b.name.toLowerCase().startsWith(n)) - Number(a.name.toLowerCase().startsWith(n)))
    .slice(0, 5);
}
