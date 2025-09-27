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
import { API_BASE_URL } from '../../../config/api'; // TEAM: central base
import { DateTime } from 'luxon';
import {
  MT_ZONE,
  normalizeToMtISO,
  toMillisMT,
} from './graphDateUtils';


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
      measurements: variables.map(v => ({
        instrumentId: v.instrumentId,
        variableName: v.name,
      })),
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

    const start = toMillisMT(fromDate);
    const end = toDate
      ? toMillisMT(toDate)
      : DateTime.now().setZone(MT_ZONE).toMillis();

    const minSpan = 60_000;

    setDomain(prev => {
      const clamped: [number, number] = [start, Math.max(start + minSpan, end)];
      if (clamped[0] === prev[0] && clamped[1] === prev[1]) return prev;
      return clamped;
    });
    setSelection(prev => {
      const clampedEnd = Math.max(start + minSpan, end);

      let left = Math.max(start, prev[0] || 0);
      let right = Math.min(clampedEnd, prev[1] || 0);

      // If invalid or too small, default to full domain
      if (!Number.isFinite(left) || !Number.isFinite(right) || right - left < minSpan) {
        left = start;
        right = clampedEnd;
      }

      if (left === prev[0] && right === prev[1]) return prev;
      return [left, right];
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

          // Normalize row datetimes to MT ISO immediately
          for (const row of data) {
            row.datetime = normalizeToMtISO(row.datetime);
          }

          allData.push(...data);

          data.forEach((row) => {
            Object.entries(row).forEach(([k, v]) => {
              if (k !== 'datetime') {
                const num = parseFloat(v);
                if (!Number.isNaN(num)) allValues.push(num);
              }
            });
          });
        } catch (err) {
          console.error(`Graph ${id} failed to fetch`, err);
        }
      })
      // replace the .then(() => { ... }) with:
    ).then(() => {
      // Dedupe by datetime and merge rows from different instruments at same ts
      const byTs = new Map<string, { [k: string]: string }>();
      for (const row of allData) {
        const ts = normalizeToMtISO(row.datetime);
        if (!ts) continue;
        const merged = { ...(byTs.get(ts) || {}), ...row, datetime: ts };
        byTs.set(ts, merged);
      }

      const rows = Array.from(byTs.values())
        .sort(
          (a, b) =>
            DateTime.fromISO(a.datetime, { zone: MT_ZONE }).toMillis() -
            DateTime.fromISO(b.datetime, { zone: MT_ZONE }).toMillis()
        );

      setChartData(rows);

      // Y bounds (pad flat series so it's visible)
      let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
      for (const r of rows) {
        for (const [k, v] of Object.entries(r)) {
          if (k === 'datetime') continue;
          const num = parseFloat(v as string);
          if (!Number.isNaN(num)) {
            if (num < min) min = num;
            if (num > max) max = num;
          }
        }
      }
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        setYMin(0); setYMax(1);
      } else if (min === max) {
        const pad = Math.max(1e-6, Math.abs(min) * 0.05 || 0.5);
        setYMin(min - pad); setYMax(max + pad);
      } else {
        setYMin(min); setYMax(max);
      }

      setLoading?.(false);
    });

  }, [id, variables, fromDate, toDate, interval, setChartData, setYMin, setYMax, lastFetchKey, setLoading]);
}


/**
 * Polls `/latest_measurement/<instrument>/<interval>/` if toDate is empty (live mode),
 * appending new data points to chartData.
 */
type Row = { [key: string]: string };

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
  chartData: Row[];
  setChartData: React.Dispatch<React.SetStateAction<Row[]>>;
  isLive: boolean;
  setDomain: React.Dispatch<React.SetStateAction<[number, number]>>;
  setSelection: React.Dispatch<React.SetStateAction<[number, number]>>;
}) {
  const seenTimestamps = useRef<Set<string>>(new Set());
  const consecutiveErrors = useRef(0);

  useEffect(() => {
    if (!isLive || variables.length === 0) return;
    // Reset seen on dependency changes to avoid unbounded growth/stale entries
    const seen = (seenTimestamps.current = new Set<string>());
    for (const d of chartData) {
      const ts = normalizeToMtISO(d.datetime);
      if (ts) seen.add(ts);
    }

    const pollMinutes = Number.isFinite(parseInt(interval, 10)) ? parseInt(interval, 10) : 1;
    const baseIntervalMs = Math.max(15_000, pollMinutes * 60_000);

    let timer: number | undefined;
    let aborter: AbortController | null = null;
    let stopped = false;

    const scheduleNext = (delay: number) => {
      if (stopped) return;
      timer = window.setTimeout(tick, delay);
    };

    const tick = async () => {
      if (document.hidden) {
        scheduleNext(baseIntervalMs);
        return;
      }

      // Group by instrument to avoid duplicate requests
      const byInstrument = new Map<number, SelectedMeasurement[]>();
      for (const sel of variables) {
        const arr = byInstrument.get(sel.instrumentId) || [];
        arr.push(sel);
        byInstrument.set(sel.instrumentId, arr);
      }

      const staged: Row[] = [];
      aborter = new AbortController();


      try {
        await Promise.all(
          Array.from(byInstrument.entries()).map(async ([instrumentId, sels]) => {
            const url = `${API_BASE_URL}/latest_measurement/${instrumentId}/${interval}/`;
            const res = await fetch(url, { signal: aborter!.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const latest: { instrument_id: number; datetime: string; data: string }[] = await res.json();

            for (const entry of latest) {
              const tsIso = normalizeToMtISO(entry.datetime);
              if (!tsIso || seen.has(tsIso)) continue;

              let dataObj: Record<string, unknown>;
              try {
                dataObj = JSON.parse(entry.data);
              } catch {
                continue; // skip bad payloads
              }

              const row: Row = { datetime: tsIso };
              let hasAny = false;

              // only pick selected variables for this instrument
              for (const sel of sels) {
                const val = (dataObj as any)[sel.name];
                if (val !== undefined && val !== null) {
                  row[sel.name] = String(val);
                  hasAny = true;
                }
              }
              if (hasAny) {
                staged.push(row);
                seen.add(tsIso);
              }
            }
          })
        );

        // success → reset backoff
        consecutiveErrors.current = 0;
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error('Live data fetch failed', err);
          consecutiveErrors.current += 1;
        }
      } finally {
        aborter = null;
      }

      if (staged.length > 0) {

        // Merge rows by timestamp (functional update to avoid stale closures)
        setChartData(prev => {
          const byTs = new Map<string, Row>();
          for (const r of prev) byTs.set(r.datetime, r);
          for (const r of staged) {
            const existing = byTs.get(r.datetime) || {};
            byTs.set(r.datetime, { ...existing, ...r, datetime: r.datetime });
          }
          return Array.from(byTs.values()).sort(
            (a, b) =>
              DateTime.fromISO(a.datetime, { zone: MT_ZONE }).toMillis() -
              DateTime.fromISO(b.datetime, { zone: MT_ZONE }).toMillis()
          );
        });

        // Expand domain to newest +60s, preserving window width
        const latestMs = DateTime.fromISO(staged[staged.length - 1].datetime, { zone: MT_ZONE }).toMillis();
        const newEnd = latestMs + 60_000;

        setDomain(prev => {
          const [prevStart, prevEnd] = prev;
          if (newEnd <= prevEnd) return prev;
          const width = Math.max(60_000, prevEnd - prevStart);
          const widened: [number, number] = [newEnd - width, newEnd];
          setSelection(widened);
          return widened;
        });
      }


      // backoff on errors to avoid hammering the server
      const backoffFactor = Math.min(4, consecutiveErrors.current); // 0..4
      const delay = baseIntervalMs * (1 + backoffFactor);
      scheduleNext(delay);
    };

    // kick off
    scheduleNext(0);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (aborter) aborter.abort();
    };


  }, [isLive, variables, interval, setChartData, setDomain, setSelection, chartData]);
}
