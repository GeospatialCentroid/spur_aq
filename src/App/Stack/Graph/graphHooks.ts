// File: src/App/Stack/Graph/graphHooks.ts

/**
 * Custom React hooks for handling Graph component logic:
 *
 * - useHydrateInitialVariables: Initializes selected variables from encoded URL state
 * - useEmitGraphState: Emits compact graph state to parent for URL serialization
 * - useClampDomainEffect: Clamps the domain and selection to valid date range
 * - useFetchChartData: Fetches and processes measurement data for chart rendering
 */

import { useEffect } from 'react';
import { EncodedGraphState } from './graphStateUtils';
import { groupVariablesByInstrument, buildApiUrl } from './graphApiUtils';
import { SelectedVariable } from './graphTypes';

/**
 * Initializes the variable selection state from the decoded initial graph state.
 * This is used when restoring a graph from a serialized URL.
 */
export function useHydrateInitialVariables(
    initialState: EncodedGraphState | undefined,
    setVariables: (v: SelectedVariable[]) => void
) {
    useEffect(() => {
        if (initialState && initialState.variableNames.length > 0) {
            setVariables(
                initialState.variableNames.map(name => ({
                    name,
                    stationId: initialState.stationId,
                    instrumentId: initialState.instrumentId,
                }))
            );
        }
    }, [initialState, setVariables]);
}

/**
 * Emits the current graph state to the parent when relevant parameters change.
 * This is used to keep the URL in sync with each graph's settings.
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
    variables: SelectedVariable[];
    fromDate: string;
    toDate: string;
    interval: string;
    selection: [number, number];
    onStateChange?: (id: number, state: EncodedGraphState) => void;
    lastEmitted: React.MutableRefObject<string>;
}) {
    useEffect(() => {
        if (!onStateChange) return;

        const state: EncodedGraphState = {
            id: id.toString(36),
            stationId: variables[0]?.stationId || 0,
            instrumentId: variables[0]?.instrumentId || 0,
            variableNames: variables.map(v => v.name),
            fromDate,
            toDate,
            interval,
            selection,
        };

        const key = JSON.stringify(state);
        if (key === lastEmitted.current) return; // Prevent redundant emission
        lastEmitted.current = key;

        onStateChange(id, state);
    }, [id, fromDate, toDate, interval, variables, selection, onStateChange, lastEmitted]);
}

/**
 * Synchronizes the `domain` and `selection` ranges with the current date range.
 * Ensures the selection stays clamped within bounds and is never too small.
 */
export function useClampDomainEffect(
    fromDate: string,
    toDate: string,
    domain: [number, number],
    setDomain: (d: [number, number]) => void,
    setSelection: React.Dispatch<React.SetStateAction<[number, number]>>
) {
    useEffect(() => {
        let start = new Date(fromDate).getTime();
        let end = new Date(toDate).getTime();

        // Ensure start <= end and a minimum domain width of 60 seconds
        if (start > end) [start, end] = [end, start];
        if (end - start < 60 * 1000) end = start + 60 * 1000;

        const newDomain: [number, number] = [start, end];

        // Apply new domain
        setDomain(newDomain);

        // Clamp current selection to new domain
        setSelection(prev => {
            let [selStart, selEnd] = prev;

            selStart = Math.max(start, Math.min(end, selStart));
            selEnd = Math.max(start, Math.min(end, selEnd));

            // Reset selection to full domain if:
            // - it’s smaller than 60 seconds
            // - or matches the old domain exactly
            if (selEnd - selStart < 60 * 1000 || (prev[0] === domain[0] && prev[1] === domain[1])) {
                return [start, end];
            }

            return [selStart, selEnd];
        });
    }, [fromDate, toDate, setDomain, setSelection, domain]);
}

/**
 * Fetches measurement data based on the selected variables, date range, and interval.
 * Updates the chart data and automatically adjusts Y-axis bounds.
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
    variables: SelectedVariable[];
    fromDate: string;
    toDate: string;
    interval: string;
    setChartData: (data: { [key: string]: string }[]) => void;
    setYMin: (v: number) => void;
    setYMax: (v: number) => void;
    lastFetchKey: React.MutableRefObject<string>;
}) {
    useEffect(() => {
        // Skip if no valid variables are selected
        if (
            variables.length === 0 ||
            variables.some(v => !v.name || v.stationId === 0 || v.instrumentId === 0)
        ) {
            setChartData([]);
            return;
        }

        // Avoid redundant fetches
        const fetchKey = JSON.stringify({ variables, fromDate, toDate, interval });
        if (fetchKey === lastFetchKey.current) return;
        lastFetchKey.current = fetchKey;

        console.log(`Graph ${id}: Fetching new data due to state change`);

        // Fetch data grouped by instrument
        const groups = groupVariablesByInstrument(variables);
        groups.forEach(async (group, index) => {
            const url = buildApiUrl(
                group.stationId,
                group.variableNames,
                group.instrumentId,
                fromDate,
                toDate,
                interval
            );
            console.log(`Graph ${id}: URL #${index + 1} = ${url}`);

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
                const data = await response.json();
                console.log(`Graph ${id}: Data received`, data);

                setChartData(data);

                // Extract numeric values for Y axis scaling
                const values: number[] = [];
                data.forEach((row: Record<string, string>) => {
                    Object.entries(row).forEach(([key, val]) => {
                        if (key !== 'datetime') {
                            const num = parseFloat(val);
                            if (!isNaN(num)) values.push(num);
                        }
                    });
                });

                const min = Math.min(...values);
                const max = Math.max(...values);
                setYMin(isFinite(min) ? min : 0);
                setYMax(isFinite(max) ? max : 1);
            } catch (error) {
                console.error(`Graph ${id}: Failed to fetch data`, error);
            }
        });
    }, [variables, fromDate, toDate, interval, id, setChartData, setYMin, setYMax, lastFetchKey]);
}
