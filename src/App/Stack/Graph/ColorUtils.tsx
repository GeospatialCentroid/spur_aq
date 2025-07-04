import * as d3 from 'd3';

const colorScale = d3.scaleOrdinal<string, string>()
  .domain([]) // optional: define known variable keys
  .range(d3.schemeDark2);

export function getColorForVariable(key: string): string {
  return colorScale(key);
}
