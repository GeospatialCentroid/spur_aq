// File: src/App/Stack/Graph/graphStateUtils.tsx

/**
 * Encodes and decodes graph state for use in shareable, human-editable URLs.
 *
 * Format:
 * - Each field is a key.value pair (e.g., `station.1`)
 * - Fields are separated by `_`
 * - Multiple variables are separated by `~`
 * - Selection domain is represented as `start~end` in seconds
 * - Multiple graph configurations are separated by `__`
 *
 * Example (single graph):
 *   graph.1a_station.1_instrument.2_variables.ozone~pm25_start.2025-07-01T00:00_end.2025-07-08T00:00_interval.60_domain.1620000000~1620600000_live.1
 *
 * Example (multiple graphs):
 *   graph.1a_...__graph.2b_...
 */

/** A compact serializable representation of a graph's UI state */
export type EncodedGraphState = {
  id: string;
  stationId: number;
  instrumentId: number;
  variableNames: string[];
  fromDate: string;
  toDate: string;
  interval: string;
  selection: [number, number]; // [start, end] timestamps in ms
  updateLive?: boolean;
};

/**
 * Encodes a selection time range into a "start~end" string (in seconds)
 */
function encodeSelection([start, end]: [number, number]): string {
  return `${Math.floor(start / 1000)}~${Math.floor(end / 1000)}`;
}

/**
 * Encodes a single graph's state to a readable URL-safe string.
 *
 * Keys:
 *   - graph: ID
 *   - station: Station ID
 *   - instrument: Instrument ID
 *   - variables: comma-free variable list (joined by `~`)
 *   - start/end: ISO 8601 strings
 *   - interval: numeric interval
 *   - domain: start~end in seconds
 *   - live: 1 if updateLive is true
 */
export function encodeGraphState(g: EncodedGraphState): string {
  const vars = g.variableNames.join('~');
  const sel = encodeSelection(g.selection);
  const fields = [
    `graph.${g.id}`,
    `station.${g.stationId}`,
    `instrument.${g.instrumentId}`,
    `variables.${vars}`,
    `start.${g.fromDate}`,
    `end.${g.toDate}`,
    `interval.${g.interval}`,
    `domain.${sel}`,
  ];
  if (g.updateLive) fields.push('live.1');
  return fields.join('_');
}

/**
 * Decodes a single encoded graph string into an `EncodedGraphState` object.
 * Returns null if decoding fails.
 */
export function decodeGraphState(encoded: string): EncodedGraphState | null {
  try {
    const parts = encoded.split('_');
    const getValue = (prefix: string) => {
      const found = parts.find(p => p.startsWith(prefix + '.'));
      return found ? found.split('.')[1] : undefined;
    };

    const id = getValue('graph') ?? '';
    const stationId = parseInt(getValue('station') || '0');
    const instrumentId = parseInt(getValue('instrument') || '0');
    const variableNames = (getValue('variables') || '').split('~');
    const fromDate = getValue('start') ?? '';
    const toDate = getValue('end') ?? '';
    const interval = getValue('interval') ?? '60';
    const domain = getValue('domain') ?? '0~0';
    const [selStartSec, selEndSec] = domain.split('~').map(Number);
    const updateLive = getValue('live') === '1';

    const start = new Date(fromDate).getTime();
    const end = new Date(toDate).getTime();
    const rawSelection: [number, number] = [selStartSec * 1000, selEndSec * 1000];
    const clampedStart = Math.max(start, Math.min(end, rawSelection[0]));
    const clampedEnd = Math.max(start, Math.min(end, rawSelection[1]));
    const selection: [number, number] =
      clampedEnd - clampedStart < 60 * 1000 ? [start, end] : [clampedStart, clampedEnd];

    return {
      id,
      stationId,
      instrumentId,
      variableNames,
      fromDate,
      toDate,
      interval,
      selection,
      updateLive,
    };
  } catch (e) {
    console.warn('Failed to decode graph state:', encoded, e);
    return null;
  }
}

/**
 * Encodes a list of graph states into a single URL-safe string.
 * Graphs are separated by `__`.
 */
export function encodeGraphList(graphs: EncodedGraphState[]): string {
  return graphs.map(encodeGraphState).join('__');
}

/**
 * Decodes a list of graph states from a combined string.
 * Invalid entries are filtered out.
 */
export function decodeGraphList(param: string): EncodedGraphState[] {
  return param
    .split('__')
    .map(decodeGraphState)
    .filter(Boolean) as EncodedGraphState[];
}
