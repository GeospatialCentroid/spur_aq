// File: src/App/Stack/Graph/Components/Chart.tsx

/**
 * Chart component wrapping the D3 chart and domain slider.
 * 
 * - Accepts time range, interval, Y-axis domain, and the merged chart data from the Graph.
 * - Converts the raw row-based data into a column-oriented format for the D3 chart.
 * - Displays a domain slider (currently static) and the D3Chart for rendering.
 */

import React, { useState, useMemo } from 'react';
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
  className?: string;
  chartData: { [key: string]: string }[]; // New merged row-wise input format
}

const Chart: React.FC<ChartProps> = ({
  id,
  fromDate,
  toDate,
  interval,
  yDomain,
  className = '',
  chartData,
}) => {
  const fullDomain: [number, number] = [0, 100]; // Placeholder for domain slider
  const [selection, setSelection] = useState<[number, number]>([10, 40]);

  /**
   * Transform the row-wise chartData into column-wise structure:
   * {
   *   col9: [{ timestamp, value }, ...],
   *   col10: [{ timestamp, value }, ...]
   * }
   */
  const processedData = useMemo(() => {
    const result: Record<string, { timestamp: string; value: number }[]> = {};

    chartData.forEach(row => {
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
  }, [chartData]);

  return (
    <div className={`graph-chart ${className}`}>
      <div className="chart-body">
        <D3Chart
          id={id}
          fromDate={fromDate}
          toDate={toDate}
          interval={interval}
          yDomain={yDomain}
          data={processedData} // Transformed data format
        />
      </div>
      <DomainSlider
        domain={fullDomain}
        selection={selection}
        onChange={setSelection}
      />
    </div>
  );
};

export default Chart;
