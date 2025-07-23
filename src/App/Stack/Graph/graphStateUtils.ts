// File: src/App/Stack/Graph/GraphStateUtils.tsx

/**
 * Encodes and decodes compact graph state strings for use in the URL.
 *
 * These functions serialize each Graph instance into a short, pipe-delimited
 * format such as:
 *   g=1a|s1:i2:vTemp,Humid|f=2025-07-01T00:00|t=2025-07-08T00:00|i=60|z=162:192
 *
 * This enables saving and restoring graph configurations through the URL.
 */

export type EncodedGraphState = {
  id: string; // Short base36 ID for compact representation
  stationId: number;
  instrumentId: number;
  variableNames: string[];
  fromDate: string;         // ISO string
  toDate: string;           // ISO string
  interval: string;
  selection: [number, number]; // [start, end] in ms
};

/**
 * Encode a single graph state to a compact string format.
 */
export function encodeGraphState(g: EncodedGraphState): string {
  const vars = g.variableNames.join(',');
  const sel = `${Math.floor(g.selection[0] / 1000)}:${Math.floor(g.selection[1] / 1000)}`;
  return `g=${g.id}|s${g.stationId}:i${g.instrumentId}:v${vars}|f=${g.fromDate}|t=${g.toDate}|i=${g.interval}|z=${sel}`;
}

/**
 * Decode a single compact graph string back into state.
 */
export function decodeGraphState(encoded: string): EncodedGraphState | null {
  try {
    const parts = encoded.split('|');
    const id = parts[0].split('=')[1];
    const [station, instrument, vars] = parts[1].substring(1).split(':');
    const stationId = parseInt(station);
    const instrumentId = parseInt(instrument.slice(1));
    const variableNames = vars.slice(1).split(',');
    const fromDate = parts[2].split('=')[1];
    const toDate = parts[3].split('=')[1];
    const interval = parts[4].split('=')[1];
    const [start, end] = parts[5].split('=')[1].split(':').map(x => parseInt(x) * 1000);

    return {
      id,
      stationId,
      instrumentId,
      variableNames,
      fromDate,
      toDate,
      interval,
      selection: [start, end]
    };
  } catch {
    console.warn('Failed to decode graph state:', encoded);
    return null;
  }
}

/**
 * Encode a list of graph states to a compact string suitable for use in the URL.
 */
export function encodeGraphList(graphs: EncodedGraphState[]): string {
  return graphs.map(encodeGraphState).join('&');
}

/**
 * Decode a full URL parameter string into an array of graph states.
 */
export function decodeGraphList(param: string): EncodedGraphState[] {
  return param.split('&').map(decodeGraphState).filter(Boolean) as EncodedGraphState[];
}
