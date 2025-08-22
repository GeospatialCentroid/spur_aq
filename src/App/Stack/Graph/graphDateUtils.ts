// File: src/App/Stack/Graph/graphDateUtils.tsx
import { DateTime } from 'luxon';

/** Canonical zone for everything graph-related */
export const MT_ZONE = 'America/Denver';

/** ISO string for midnight one week ago in Mountain Time */
export function getStartOfTodayOneWeekAgoMountain(): string {
  return DateTime.now().setZone(MT_ZONE).minus({ days: 7 }).startOf('day')
    .toISO({ suppressMilliseconds: true })!;
}

/** ISO string for "now" in Mountain Time */
export function getNowMountain(): string {
  return DateTime.now().setZone(MT_ZONE).toISO({ suppressMilliseconds: true })!;
}

/**
 * Normalize any server timestamp to ISO with an explicit Mountain Time offset.
 *
 * Accepted inputs:
 *  - 'YYYY-MM-DD HH:mm:ss' (no offset) → interpret as MT wall clock
 *  - ISO-like WITHOUT offset (e.g., '2025-08-14T12:34:56') → interpret as MT wall clock
 *  - ISO WITH 'Z' or offset → convert the instant into MT (shift the clock)
 *
 * If your backend ever emits a stray 'Z' even though it actually means MT wall clock,
 * flip keepLocalTimeForISOWithOffset to true.
 */
const keepLocalTimeForISOWithOffset = false;

export function normalizeToMtISO(dt: string): string {
  if (!dt) return dt;

  const looksISO = dt.includes('T');

  if (looksISO) {
    const hasOffsetOrZ = /[Zz]|[+\-]\d{2}:?\d{2}$/.test(dt);
    if (hasOffsetOrZ) {
      const parsed = keepLocalTimeForISOWithOffset
        ? DateTime.fromISO(dt).setZone(MT_ZONE, { keepLocalTime: true })
        : DateTime.fromISO(dt).setZone(MT_ZONE);
      return parsed.toISO({ suppressMilliseconds: true })!;
    }
    // ISO without offset: treat as MT wall clock
    return DateTime.fromISO(dt, { zone: MT_ZONE }).toISO({ suppressMilliseconds: true })!;
  }

  // SQL-like: 'YYYY-MM-DD HH:mm:ss' → MT wall clock
  return DateTime.fromSQL(dt, { zone: MT_ZONE }).toISO({ suppressMilliseconds: true })!;
}

/** Convert an MT ISO string → epoch millis (interpreting in MT) */
export function toMillisMT(iso: string): number {
  return DateTime.fromISO(iso, { zone: MT_ZONE }).toMillis();
}

/** Convert epoch millis → MT ISO string (with MT offset) */
export function fromMillisMT(ms: number): string {
  return DateTime.fromMillis(ms, { zone: MT_ZONE }).toISO({ suppressMilliseconds: true })!;
}

/**
 * Format an MT ISO string for API query params as 'YYYY-MM-DD HH:mm:ss' (no offset).
 * Use this when building URLs for the backend.
 */
export function isoMtToApiSQL(isoMt: string): string {
  return DateTime.fromISO(isoMt, { zone: MT_ZONE }).toFormat("yyyy-LL-dd HH:mm:ss");
}

/**
 * Convenience: given start ISO (MT) and optional end ISO (MT), return a clamped [start,end] (ms)
 * with a minimum span, computing "now" in MT if end is missing (live mode).
 */
export function clampDomainMT(
  startIso: string,
  endIso?: string | null,
  minSpanMs = 60_000
): [number, number] {
  const start = DateTime.fromISO(startIso, { zone: MT_ZONE }).toMillis();
  const end = endIso
    ? DateTime.fromISO(endIso, { zone: MT_ZONE }).toMillis()
    : DateTime.now().setZone(MT_ZONE).toMillis();

  const clampedEnd = Math.max(start + minSpanMs, end);
  return [start, clampedEnd];
}
