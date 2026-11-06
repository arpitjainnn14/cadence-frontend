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
  // Added with the nine new categories; same muted family, spread across the hue wheel.
  Gaming: "#E0916B",
  Education: "#6E9BD6",
  Productivity: "#6FB89A",
  Telecom: "#B7A6E0",
  Utilities: "#A3A38A",
  Health: "#D97C8E",
  Travel: "#5DB7C9",
  Finance: "#D4B35E",
  Insurance: "#A0897A",
  Other: "#8E8E8B",
};

/** Colours for the "by card" donut, assigned by rank. */
export const RANK_PALETTE = ["#8FA7C4", "#C9A27E", "#9DB89A", "#C79595", "#A99BC7", "#7FB5B0", "#C7B77F", "#8E8E8B"];
