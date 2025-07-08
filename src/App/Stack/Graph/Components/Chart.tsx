// File: src/App/Stack/Graph/Components/Chart.tsx

/**
 * Chart component
 *
 * - Wraps D3Chart and DomainSlider components.
 * - Transforms merged row-wise chart data into column-oriented structure.
 * - Accepts `domain`, `selection`, and `onSliderChange` as props.
 * - Renders a zoomable chart and time slider based on passed data.
 */

import React, { useMemo } from 'react';
import D3Chart from './Chart/D3Chart';
import DomainSlider from './Chart/DomainSlider';
import './Chart.css';

/** Props for Chart component */
interface ChartProps {
  id: number;
  fromDate: string;
  toDate: string;
  interval: string;
  yDomain: [number, number];
  chartData: { [key: string]: string }[];
  domain: [number, number]; // Full domain in ms
  selection: [number, number]; // Selected time window
  onSliderChange: (range: [number, number]) => void;
  className?: string;
}

const Chart: React.FC<ChartProps> = ({
  id,
  fromDate,
  toDate,
  interval,
  yDomain,
  chartData,
  domain,
  selection,
  onSliderChange,
  className = '',
}) => {
  /**
   * Transform row-wise chartData into column-wise structure:
   * {
   *   col9: [{ timestamp, value }, ...],
   *   col10: [{ timestamp, value }, ...]
   * }
   */
  const processedData = useMemo(() => {
    const result: Record<string, { timestamp: string; value: number }[]> = {};
    const tsRows: { ts: number; row: { [key: string]: string } }[] = [];

    // Parse timestamps and collect all rows with their timestamps
    chartData.forEach((row) => {
      const timestamp = row.datetime;
      if (!timestamp) return;
      const ts = new Date(timestamp).getTime();
      tsRows.push({ ts, row });
    });

    // Sort to ensure ordering before interpolation
    tsRows.sort((a, b) => a.ts - b.ts);

    // Split data into before, within, and after the selection
    const before = tsRows.filter(({ ts }) => ts < selection[0]);
    const within = tsRows.filter(({ ts }) => ts >= selection[0] && ts <= selection[1]);
    const after = tsRows.filter(({ ts }) => ts > selection[1]);

    const paddedRows: { [key: string]: string }[] = [];

    // Helper to interpolate a row between two points
    const interpolateRow = (
      ts0: number,
      row0: { [key: string]: string },
      ts1: number,
      row1: { [key: string]: string },
      edgeTs: number
    ): { [key: string]: string } => {
      const interpRow: { [key: string]: string } = { datetime: new Date(edgeTs).toISOString() };
      Object.keys(row0).forEach((key) => {
        if (key === 'datetime') return;
        const y0 = parseFloat(row0[key]);
        const y1 = parseFloat(row1[key]);
        if (isNaN(y0) || isNaN(y1)) return;

        const interpolated = y0 + ((y1 - y0) * (edgeTs - ts0)) / (ts1 - ts0);
        interpRow[key] = interpolated.toString();
      });
      return interpRow;
    };

    // Interpolate a point at the left edge if needed
    if (before.length > 0 && within.length > 0) {
      const prev = before[before.length - 1];
      const next = within[0];
      paddedRows.push(interpolateRow(prev.ts, prev.row, next.ts, next.row, selection[0]));
    }

    // Add all "within" rows as-is
    paddedRows.push(...within.map(({ row }) => row));

    // Interpolate a point at the right edge if needed
    if (after.length > 0 && within.length > 0) {
      const next = after[0];
      const prev = within[within.length - 1];
      paddedRows.push(interpolateRow(prev.ts, prev.row, next.ts, next.row, selection[1]));
    }

    // Rebuild column-oriented data
    paddedRows.forEach((row) => {
      const timestamp = row.datetime;
      if (!timestamp) return;
      Object.entries(row).forEach(([key, val]) => {
        if (key === 'datetime') return;
        const value = parseFloat(val);
        if (isNaN(value)) return;
        if (!result[key]) result[key] = [];
        result[key].push({ timestamp, value });
      });
    });

    return result;
  }, [chartData, selection]);




  return (
    <div className={`graph-chart ${className}`}>
      <div className="chart-body">
        <D3Chart
          id={id}
          fromDate={new Date(selection[0]).toISOString()}
          toDate={new Date(selection[1]).toISOString()}
          interval={interval}
          yDomain={yDomain}
          data={processedData}
        />
      </div>

      <div className="chart-footer">
        <DomainSlider
          key={`${domain[0]}-${domain[1]}`}
          domain={domain}
          selection={selection}
          onChange={onSliderChange}
        />
        <div className="slider-label">
          {new Date(selection[0]).toLocaleString()} →{' '}
          {new Date(selection[1]).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default Chart;
