import * as d3 from 'd3';

// Central colorblind-friendly palette (Dark2)
export const SERIES_COLORS: string[] = d3.schemeDark2 as string[];

const colorScale = d3
  .scaleOrdinal<string, string>()
  .domain([])
  .range(SERIES_COLORS);

export function getColorForVariable(key: string): string {
  return colorScale(key);
}
