// src/utils/time.ts

// Detect whether UTC mode is active
export const isUtcMode = (): boolean =>
  new URLSearchParams(window.location.search).get('tz') === 'UTC';

/** Formats timestamp based on current mode:
 * - UTC when ?tz=UTC
 * - America/Denver otherwise
 */
export function formatSmart(iso: string, opts?: Intl.DateTimeFormatOptions) {
  const timeZone = isUtcMode() ? 'UTC' : 'America/Denver';
  return new Date(iso).toLocaleString(undefined, { timeZone, ...opts });
}

// Optional shorthand for charts and cards
export function formatSmartShort(iso: string) {
  return formatSmart(iso, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
// Treat a wall-clock time as if it were in `timeZone` and return ISO UTC.
export function isoFromZonedWallTime(dateLocal: Date, timeZone: string): string {
  // Take the local wall time parts
  const y = dateLocal.getFullYear();
  const m = dateLocal.getMonth();
  const d = dateLocal.getDate();
  const hh = dateLocal.getHours();
  const mm = dateLocal.getMinutes();
  const ss = dateLocal.getSeconds();

  // Create a UTC date from those parts
  const asUTC = new Date(Date.UTC(y, m, d, hh, mm, ss));

  // What instant would those same wall-time parts represent in the target zone?
  // Convert the UTC "asUTC" into the target zone, then compare to get the zone offset.
  const zoned = new Date(asUTC.toLocaleString('en-US', { timeZone }));
  const offsetMs = asUTC.getTime() - zoned.getTime();

  // Apply the zone offset to get the true UTC instant for that wall time in `timeZone`
  const utcMs = Date.UTC(y, m, d, hh, mm, ss) - offsetMs;
  return new Date(utcMs).toISOString();
}
