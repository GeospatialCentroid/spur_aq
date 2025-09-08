// src/utils/calibration.ts
import type { Calibration } from "../Types/calibration";

export function getActiveCalibration(
  calibrations: Calibration[] | null | undefined,
  readingTimeISO: string | Date
): Calibration | null {
  if (!calibrations || calibrations.length === 0) return null;
  const t = new Date(readingTimeISO).getTime();
  const candidates = calibrations
    .map(c => ({ ...c, startMs: new Date(c.start_date).getTime() }))
    .filter(c => Number.isFinite(c.startMs) && c.startMs <= t)
    .sort((a, b) => b.startMs - a.startMs);
  return candidates.length ? { slope: candidates[0].slope, offset: candidates[0].offset, start_date: candidates[0].start_date } : null;
}

export function applyCalibration(raw: number, cal: Calibration | null): number {
  if (!Number.isFinite(raw)) return raw;
  if (!cal) return raw;
  const { slope, offset } = cal;
  if (!Number.isFinite(slope) || !Number.isFinite(offset)) return raw;
  return slope * raw + offset;
}

/** Convenience helper for your ParsedMeasurement objects */
export function calibrateValueForMeasurement(
  measurementLike: { calibrations?: Calibration[] | null },
  raw: number,
  readingTimeISO: string | Date
): number {
  const cal = getActiveCalibration(measurementLike?.calibrations ?? null, readingTimeISO);
  return applyCalibration(raw, cal);
}
