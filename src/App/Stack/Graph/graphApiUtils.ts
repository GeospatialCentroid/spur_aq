// File: src/App/Stack/Graph/graphApiUtils.

import { SelectedMeasurement, VariableGroup } from './graphTypes';

/** Utility: Build a fully encoded API URL for measurements */
export function buildApiUrl(
    stationId: number,
    variableNames: string[],
    instrumentId: number,
    startDate: string,
    endDate: string,
    interval: string
): string {
    const baseUrl = 'http://129.82.30.40:8001';
    const encodedStart = encodeURIComponent(formatDateForUrl(startDate));
    const encodedEnd = encodeURIComponent(formatDateForUrl(endDate));
    const variablePath = variableNames.join(',');
    return `${baseUrl}/measurement/${instrumentId}/measurements/${variablePath}/${interval}/?start=${encodedStart}&end=${encodedEnd}`;
}

/** Utility: Format a date for the API URL */
function formatDateForUrl(dateString: string): string {
    const d = new Date(dateString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

/** Utility: Group selected variables by station/instrument pair */
export function groupVariablesByInstrument(vars: SelectedMeasurement[]): VariableGroup[] {
    const map = new Map<string, VariableGroup>();
    vars.forEach((v) => {
        const key = `${v.stationId}:${v.instrumentId}`;
        if (!map.has(key)) {
            map.set(key, {
                stationId: v.stationId,
                instrumentId: v.instrumentId,
                variableNames: [],
            });
        }
        map.get(key)!.variableNames.push(v.name);
    });
    return Array.from(map.values());
}