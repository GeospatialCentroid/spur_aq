// src/App/Stack/Graph/utils/labelFormat.ts
/**
 * Format axis labels to avoid overflow.
 * Rules:
 * - If label has "(units)" and is too long, show only the name (drop the units).
 * - Otherwise, ellipsize beyond maxLength.
 */
export function formatAxisLabel(label: string, maxLength = 16): string {
  if (!label) return "";
  const m = label.match(/^(.+?)\s*\((.+)\)\s*$/); // name (units)
  if (m) {
    const name = m[1].trim();
    // If either the whole label or the name is too long, show name only (no units)
    if (label.length > maxLength || name.length > maxLength) return name;
    return label;
  }
  return label.length > maxLength ? label.slice(0, maxLength) + "..." : label;
}

/** Same idea for Y tick text (often narrower than the axis title). */
export function formatTick(label: string, maxLength = 12): string {
  if (!label) return "";
  return label.length > maxLength ? label.slice(0, maxLength) + "..." : label;
}
