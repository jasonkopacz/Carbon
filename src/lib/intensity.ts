/**
 * Shared intensity helpers — single source of truth used by ZoneMap,
 * HistoryChart, and the zone detail page.
 */

export function intensityColor(v: number | null): string {
  if (v == null) return "#374151";
  if (v < 100) return "#3ddc97";
  if (v < 200) return "#7bdf5a";
  if (v < 350) return "#f5c842";
  if (v < 500) return "#f58642";
  return "#f54242";
}

export function intensityLabel(v: number | null): string {
  if (v == null) return "No data";
  if (v < 100) return "Very Low";
  if (v < 200) return "Low";
  if (v < 350) return "Moderate";
  if (v < 500) return "High";
  return "Very High";
}

/** Returns text + CSS class key for use in the zone detail badge. */
export function intensityBadge(v: number): { text: string; cls: string } {
  if (v < 100) return { text: "Very Low", cls: "veryLow" };
  if (v < 200) return { text: "Low", cls: "low" };
  if (v < 350) return { text: "Moderate", cls: "moderate" };
  if (v < 500) return { text: "High", cls: "high" };
  return { text: "Very High", cls: "veryHigh" };
}
