// File: src/App/Stack/Graph/graphApiUtils.

import { SelectedMeasurement, VariableGroup } from './graphTypes';
import { API_BASE_URL } from '../../../config/api'; 

/** Utility: Build a fully encoded API URL for measurements */
export function buildApiUrl(
    stationId: number,
    variableNames: string[],
    instrumentId: number,
    startDate: string,
    endDate: string,
    interval: string
): string {
    const baseUrl = API_BASE_URL;
    const encodedStart = encodeURIComponent(formatDateForUrl(startDate));
    const variablePath = variableNames.join(',');

    let url = `${baseUrl}/measurement/${instrumentId}/measurements/${variablePath}/${interval}/?start=${encodedStart}`;
    
    if (endDate) {
        const encodedEnd = encodeURIComponent(formatDateForUrl(endDate));
        url += `&end=${encodedEnd}`;
    }

    return url;
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
//Modified to allow inclusion of download url
export function groupVariablesByInstrument(variables: any[]) {
  const groups = [];
  const byInstrument = new Map();

  for (const v of variables) {
    const key = `${v.instrumentId}_${v.stationId}`;
    if (!byInstrument.has(key)) byInstrument.set(key, []);
    byInstrument.get(key).push(v);
  }

  for (const [key, vars] of byInstrument.entries()) {
    const { instrumentId, stationId } = vars[0];
    const variableNames = vars.map((v: any) => v.name);
    groups.push({ instrumentId, stationId, variableNames, variables: vars }); // <-- include the array
  }

  return groups;
}