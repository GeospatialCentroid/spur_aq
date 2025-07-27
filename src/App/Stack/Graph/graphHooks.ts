// File: src/App/Stack/Graph/graphHooks.ts

/**
 * Custom React hooks for handling Graph component logic:
 *
 * - useEmitGraphState: Emits compact graph state to parent for URL serialization
 * - useClampDomainEffect: Clamps the domain and selection to valid date range
 * - useFetchChartData: Fetches and processes measurement data for chart rendering
 */

import { useEffect } from 'react';
import { EncodedGraphState, encodeGraphState } from './graphStateUtils';
import { groupVariablesByInstrument, buildApiUrl } from './graphApiUtils';
import { SelectedMeasurement } from './graphTypes';

/**
 * Emits the current graph state to the parent when relevant parameters change.
 * Uses JSON string key comparison to avoid redundant updates.
 */
export function useEmitGraphState({
  id,
  variables,
  fromDate,
  toDate,
  interval,
  selection,
  onStateChange,
  lastEmitted,
}: {
  id: number;
  variables: SelectedMeasurement[];
  fromDate: string;
  toDate: string;
  interval: string;
  selection: [number, number];
  onStateChange?: (id: number, state: EncodedGraphState) => void;
  lastEmitted: React.MutableRefObject<string>;
}) {
  useEffect(() => {
    if (!onStateChange || variables.length === 0) return;

    const state: EncodedGraphState = {
      id: id.toString(36),
      stationId: variables[0].stationId,
      instrumentId: variables[0].instrumentId,
      variableNames: variables.map(v => v.name),
      fromDate,
      toDate,
      interval,
      selection,
    };

    const key = encodeGraphState(state);
    if (key === lastEmitted.current) return;
    lastEmitted.current = key;

    onStateChange(id, state);
  }, [id, variables, fromDate, toDate, interval, selection, onStateChange, lastEmitted]);
}

/**
 * Synchronizes the domain and selection with from/to dates without causing render loops.
 */
export function useClampDomainEffect(
  fromDate: string,
  toDate: string,
  domain: [number, number],
  setDomain: (d: [number, number]) => void,
  setSelection: React.Dispatch<React.SetStateAction<[number, number]>>
) {
  useEffect(() => {
    const start = new Date(fromDate).getTime();
    const end = new Date(toDate).getTime();
    if (start === domain[0] && end === domain[1]) return;

    const clamped: [number, number] = [
      Math.min(start, end),
      Math.max(start, end) + (Math.abs(end - start) < 60000 ? 60000 : 0),
    ];

    setDomain(clamped);
    setSelection(sel => {
      const [s0, s1] = sel;
      if (s0 < clamped[0] || s1 > clamped[1] || s1 - s0 < 60000) {
        return [...clamped];
      }
      return sel;
    });
  }, [fromDate, toDate, domain, setDomain, setSelection]);
}

/**
 * Fetches data if variables and range are valid and not already fetched.
 */
export function useFetchChartData({
  id,
  variables,
  fromDate,
  toDate,
  interval,
  setChartData,
  setYMin,
  setYMax,
  lastFetchKey,
}: {
  id: number;
  variables: SelectedMeasurement[];
  fromDate: string;
  toDate: string;
  interval: string;
  setChartData: (data: { [key: string]: string }[]) => void;
  setYMin: (v: number) => void;
  setYMax: (v: number) => void;
  lastFetchKey: React.MutableRefObject<string>;
}) {
  useEffect(() => {
    if (variables.length === 0) return;

    const key = JSON.stringify({ variables, fromDate, toDate, interval });
    if (key === lastFetchKey.current) return;
    lastFetchKey.current = key;

    const groups = groupVariablesByInstrument(variables);
    const allData: { [key: string]: string }[] = [];
    const allValues: number[] = [];

    Promise.all(
      groups.map(async (group) => {
        const url = buildApiUrl(
          group.stationId,
          group.variableNames,
          group.instrumentId,
          fromDate,
          toDate,
          interval
        );

        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: { [key: string]: string }[] = await res.json();
          allData.push(...data);

          data.forEach((row: { [key: string]: string }) => {
            Object.entries(row).forEach(([k, v]) => {
              if (k !== 'datetime') {
                const num = parseFloat(v);
                if (!isNaN(num)) allValues.push(num);
              }
            });
          });
        } catch (err) {
          console.error(`Graph ${id} failed to fetch`, err);
        }
      })
    ).then(() => {
      setChartData(allData);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      setYMin(isFinite(min) ? min : 0);
      setYMax(isFinite(max) ? max : 1);
    });
  }, [id, variables, fromDate, toDate, interval, setChartData, setYMin, setYMax, lastFetchKey]);
}
