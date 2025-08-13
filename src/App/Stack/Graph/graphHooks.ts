// File: src/App/Stack/Graph/graphHooks.ts

/**
 * Custom React hooks for handling Graph component logic:
 *
 * - useEmitGraphState: Emits compact graph state to parent for URL serialization
 * - useClampDomainEffect: Clamps the domain and selection to valid date range
 * - useFetchChartData: Fetches and processes measurement data for chart rendering
 */

import { useEffect, useRef } from 'react';
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
  setDomain: React.Dispatch<React.SetStateAction<[number, number]>>,
  setSelection: React.Dispatch<React.SetStateAction<[number, number]>>
) {
  useEffect(() => {
    if (!fromDate) return;

    const start = new Date(fromDate).getTime();
    const end = toDate ? new Date(toDate).getTime() : Date.now();
    const minSpan = 60_000;

    setDomain(prev => {
      const clamped: [number, number] = [
        start,
        Math.max(start + minSpan, end),
      ];

      if (clamped[0] === prev[0] && clamped[1] === prev[1]) return prev;
      return clamped;
    });

    setSelection(prev => {
      const clampedEnd = Math.max(start + minSpan, end);
      const adjusted: [number, number] = [
        Math.max(start, prev[0]),
        Math.min(clampedEnd, prev[1]),
      ];
      return prev[0] !== adjusted[0] || prev[1] !== adjusted[1] ? adjusted : prev;
    });
  }, [fromDate, toDate, setDomain, setSelection]);
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
  setLoading,
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
  setLoading?: (loading: boolean) => void;
}) {
  useEffect(() => {
    if (variables.length === 0) return;

    const key = JSON.stringify({ variables, fromDate, toDate, interval });
    if (key === lastFetchKey.current) return;
    lastFetchKey.current = key;

    setLoading?.(true);

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
      setLoading?.(false);
    });
  }, [id, variables, fromDate, toDate, interval, setChartData, setYMin, setYMax, lastFetchKey]);
}


/**
 * Polls `/latest_measurement/<instrument>/<interval>/` if toDate is empty (live mode),
 * appending new data points to chartData.
 */
export function useLiveChartUpdates({
  variables,
  interval,
  chartData,
  setChartData,
  isLive,
  setDomain,
  setSelection,
}: {
  variables: SelectedMeasurement[];
  interval: string;
  chartData: { [key: string]: string }[];
  setChartData: (d: { [key: string]: string }[]) => void;
  isLive: boolean;
  setDomain: React.Dispatch<React.SetStateAction<[number, number]>>;
  setSelection: React.Dispatch<React.SetStateAction<[number, number]>>;
}) {

  const seenTimestamps = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isLive || variables.length === 0) return;

    const seen = seenTimestamps.current;
    chartData.forEach((d) => seen.add(d.datetime));

    const intervalMs = parseInt(interval) * 60 * 1000;

    const poll = async () => {
      let newRows: { [key: string]: string }[] = [];

      for (const v of variables) {
        const url = `http://10.1.77.22:8001/latest_measurement/${v.instrumentId}/${interval}/`;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const latest: { instrument_id: number; datetime: string; data: string }[] = await res.json();

          for (const entry of latest) {
            const dataObj = JSON.parse(entry.data);
            const dt = entry.datetime;
            if (seen.has(dt)) continue;

            const row: { [key: string]: string } = { datetime: dt };

            variables.forEach((v) => {
              const val = dataObj[v.name];
              if (val !== undefined) {
                row[v.name] = val.toString();
              }
            });

            // Only add if we got at least one variable
            if (Object.keys(row).length > 1) {
              seen.add(dt);
              newRows.push(row);
            }
          }

        } catch (err) {
          console.error('Live data fetch failed', err);
        }
      }

      if (newRows.length > 0) {
        const latestTimestamp = new Date(newRows[newRows.length - 1].datetime).getTime();
        setChartData([...chartData, ...newRows]);

        // Expand domain upper bound
        const newEnd = latestTimestamp + 60_000;

        setDomain((prev) => {
          if (newEnd <= prev[1]) return prev;

          const newDomain: [number, number] = [prev[0], newEnd];
          setSelection([prev[0], newEnd]); // same window size
          return newDomain;
        });
      }
    };

    const handle = setInterval(poll, intervalMs);
    poll(); // initial

    return () => clearInterval(handle);
  }, [variables, interval, chartData, isLive, setChartData, setDomain, setSelection]);
}
