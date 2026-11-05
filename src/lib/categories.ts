import type { Category } from "../api/types";

// Muted chart palette from the design's component sheet, one colour per category.
export const CATEGORY_COLOR: Record<Category, string> = {
  Streaming: "#C9A27E",
  "Software/AI": "#8FA7C4",
  Fitness: "#9DB89A",
  "Food delivery": "#C79595",
  Music: "#A99BC7",
  "Cloud storage": "#7FB5B0",
  Shopping: "#C7B77F",
  News: "#C4A3BF",
  Other: "#8E8E8B",
};

/** Colours for the "by card" donut, assigned by rank. */
export const RANK_PALETTE = ["#8FA7C4", "#C9A27E", "#9DB89A", "#C79595", "#A99BC7", "#7FB5B0", "#C7B77F", "#8E8E8B"];
