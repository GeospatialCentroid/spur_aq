// File: src/App/Stack/Graph/graphStateUtils.tsx
/**
 * Encodes and decodes graph state for use in shareable, human-editable URLs.
 *
 * v2 Format (preferred):
 * - Each field is a key.value pair (e.g., `graph.1a`)
 * - Fields are separated by `_`
 * - Multiple measurements are separated by `~`
 * - Each measurement is encoded as `<instrumentId>-<variableName>` (variableName URI-encoded)
 * - Selection domain is represented as `start~end` in seconds
 * - Multiple graph configurations are separated by `__`
 *
 * Example (single graph, v2):
 *   graph.1a_station.1_variables.12-ozone~34-pm25_start.2025-07-01T00:00_end.2025-07-08T00:00_interval.60_domain.1620000000~1620600000
 *
 * Legacy v1 (still decodable):
 *   graph.1a_station.1_instrument.12_variables.ozone~pm25_start...._end...._interval...._domain.s~e
 */

export type EncodedMeasurement = {
  instrumentId: number;
  variableName: string;
  color?: string;
};

/** A compact serializable representation of a graph's UI state (v2 shape) */
export type EncodedGraphState = {
  id: string;
  stationId: number;
  /** v2: variables carry their own instrumentId */
  measurements: EncodedMeasurement[];
  fromDate: string;
  toDate: string;           // '' means "live / open-ended"
  interval: string;
  selection: [number, number]; // [start, end] timestamps in ms
};

// ---------------------------------------------------------------------------
// Research-mode helpers (URL flag)
// Usage: add ?mode=researcher to the page URL to raise the max series cap.
// Import getMaxSeries/isResearcherMode where you enforce the cap.
// ---------------------------------------------------------------------------
export function isResearcherMode(): boolean {
  try {
    // Guard for non-browser environments and bad URLs
    if (typeof window === 'undefined' || !window.location) return false;
    const params = new URLSearchParams(window.location.search);
    return (params.get('mode') || '').toLowerCase() === 'researcher';
  } catch {
    return false;
  }
}

/** Central place to control the limit */
export function getMaxSeries(): number {
  return isResearcherMode() ? Number.POSITIVE_INFINITY : 2;
  // or: return 1_000_000;  // if you prefer a gigantic numeric cap
}


/** ---- helpers ---- */

function encodeSelection([start, end]: [number, number]): string {
  return `${Math.floor(start / 1000)}~${Math.floor(end / 1000)}`;
}

function decodeSelection(secPair: string): [number, number] {
  const [s, e] = secPair.split('~').map(Number);
  return [s * 1000, e * 1000];
}

function clampSelectionToRange(
  raw: [number, number],
  rangeStartMs: number,
  rangeEndMs: number
): [number, number] {
  const clampedStart = Math.max(rangeStartMs, Math.min(rangeEndMs, raw[0]));
  const clampedEnd = Math.max(rangeStartMs, Math.min(rangeEndMs, raw[1]));
  return (clampedEnd - clampedStart < 60_000)
    ? [rangeStartMs, rangeEndMs]
    : [clampedStart, clampedEnd];
}

/** Encode a single measurement token as `<instrumentId>-<variable>` with URI-safe variable */
function encodeMeasurementToken(m: EncodedMeasurement): string {
  const nameEnc = encodeURIComponent(m.variableName);
  const colorEnc = m.color ? encodeURIComponent(m.color) : '';
  const payload = colorEnc ? `${nameEnc}|${colorEnc}` : nameEnc;
  return `${m.instrumentId}-${payload}`;
}

/** Try to parse `<instrumentId>-<variable>`; returns null on failure */
function decodeMeasurementToken(token: string): EncodedMeasurement | null {
  const dash = token.indexOf('-');
  if (dash <= 0) return null;

  const instStr = token.slice(0, dash);
  const payload = token.slice(dash + 1);
  const instrumentId = Number(instStr);
  if (!Number.isFinite(instrumentId)) return null;

  const [nameEnc, colorEnc] = payload.split('|');
  const variableName = decodeURIComponent(nameEnc || '');
  const color = colorEnc ? decodeURIComponent(colorEnc) : undefined;

  return { instrumentId, variableName, color };
}

/** ---- v2 encoder ---- */
export function encodeGraphState(g: EncodedGraphState): string {
  const vars = g.measurements.map(encodeMeasurementToken).join('~');
  const sel = encodeSelection(g.selection);
  return [
    `graph.${g.id}`,
    `station.${g.stationId}`,
    // v2 intentionally omits `instrument.` to avoid the single-instrument trap
    `variables.${vars}`,
    `start.${g.fromDate}`,
    `end.${g.toDate}`,
    `interval.${g.interval}`,
    `domain.${sel}`,
  ].join('_');
}

/**
 * Legacy encoder shim (optional):
 * If you still have old call sites that supply { instrumentId, variableNames },
 * you can keep a small adapter around them to build `measurements` and then call encodeGraphState().
 */
// export function encodeGraphStateLegacyShim(args: {
//   id: string;
//   stationId: number;
//   instrumentId: number;
//   variableNames: string[];
//   fromDate: string;
//   toDate: string;
//   interval: string;
//   selection: [number, number];
// }): string {
//   const measurements: EncodedMeasurement[] = args.variableNames.map(v => ({
//     instrumentId: args.instrumentId,
//     variableName: v,
//   }));
//   return encodeGraphState({
//     id: args.id,
//     stationId: args.stationId,
//     measurements,
//     fromDate: args.fromDate,
//     toDate: args.toDate,
//     interval: args.interval,
//     selection: args.selection,
//   });
// }

/** ---- decoder that supports both v2 (preferred) and legacy v1 ---- */
export function decodeGraphState(encoded: string): EncodedGraphState | null {
  try {
    const parts = encoded.split('_');

    // Build a map of key -> value for robustness
    const kv = new Map<string, string>();
    for (const p of parts) {
      const dot = p.indexOf('.');
      if (dot <= 0) continue;
      const k = p.slice(0, dot);
      const v = p.slice(dot + 1);
      kv.set(k, v);
    }

    const id = kv.get('graph') ?? '';
    const stationId = Number(kv.get('station') ?? NaN);
    const fromDate = kv.get('start') ?? '';
    const toDateRaw = kv.get('end') ?? '';
    const interval = kv.get('interval') ?? '';
    const domainRaw = kv.get('domain') ?? '';

    if (!id || !Number.isFinite(stationId) || !fromDate || !interval || !domainRaw) {
      console.warn('decodeGraphState: missing required fields', { id, stationId, fromDate, interval, domainRaw });
      return null;
    }

    // Determine if this is legacy (v1) or new (v2) by presence of "instrument."
    const legacyInstrument = kv.get('instrument'); // if present => v1
    const variablesRaw = kv.get('variables') ?? '';

    let measurements: EncodedMeasurement[] = [];
    if (legacyInstrument) {
      // v1: all variables belong to the single instrument id
      const instId = Number(legacyInstrument);
      if (!Number.isFinite(instId)) return null;
      const vNames = variablesRaw ? variablesRaw.split('~') : [];
      measurements = vNames.map(v => ({
        instrumentId: instId,
        variableName: decodeURIComponent(v),
      }));
    } else {
      // v2: variables encoded as `<instId>-<var>` tokens
      const tokens = variablesRaw ? variablesRaw.split('~') : [];
      measurements = tokens
        .map(decodeMeasurementToken)
        .filter((m): m is EncodedMeasurement => !!m);
    }

    // handle toDate: '', 'null', 'undefined' -> ''
    const toDate = (toDateRaw === 'null' || toDateRaw === 'undefined') ? '' : toDateRaw;

    // clamp selection
    const [selStartMs, selEndMs] = decodeSelection(domainRaw);
    const startMs = new Date(fromDate).getTime();
    const now = Date.now();
    const endMs = toDate ? new Date(toDate).getTime() : now;
    const selection = clampSelectionToRange([selStartMs, selEndMs], startMs, endMs);

    return {
      id,
      stationId,
      measurements,
      fromDate,
      toDate,
      interval,
      selection,
    };
  } catch (e) {
    console.warn('Failed to decode graph state:', encoded, e);
    return null;
  }
}

/** ---- multiple graphs ---- */

export function encodeGraphList(graphs: EncodedGraphState[]): string {
  return graphs.map(encodeGraphState).join('__');
}

export function decodeGraphList(param: string): EncodedGraphState[] {
  return param
    .split('__')
    .map(decodeGraphState)
    .filter(Boolean) as EncodedGraphState[];
}
