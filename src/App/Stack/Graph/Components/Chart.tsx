// File: src/App/Stack/Graph/Components/Chart.tsx

/**
 * Chart component that displays a graph visualization and a domain slider.
 *
 * - Wraps a D3Chart component for rendering data.
 * - Wraps a DomainSlider component to allow user to adjust the x-axis (time or value) range.
 * - Maintains internal state for the selected range within the full domain.
 */

import React, { useState } from 'react';
import D3Chart from './Chart/D3Chart';
import DomainSlider from './Chart/DomainSlider';
import './Chart.css';

/**
 * Props for the Chart component.
 *
 * @property id - Unique identifier used to fetch and render data for this specific chart.
 * @property className - Optional additional CSS class for layout styling.
 * @property fromDate - Start of the time range (ISO string).
 * @property toDate - End of the time range (ISO string).
 * @property interval - Time interval in minutes.
 * @property yDomain - Y-axis min and max values based on data.
 */
interface ChartProps {
  id: number;
  fromDate: string;
  toDate: string;
  interval: string;
  yDomain: [number, number];
  className?: string;
}

/**
 * Renders a chart and domain slider for the given graph ID.
 */
const Chart: React.FC<ChartProps> = ({
  id,
  fromDate,
  toDate,
  interval,
  yDomain,
  className = '',
}) => {
  // Example domain in "data index" space — this would typically be derived from data
  const fullDomain: [number, number] = [0, 100];

  // Selection state within the domain
  const [selection, setSelection] = useState<[number, number]>([10, 40]);

  return (
    <div className={`graph-chart ${className}`}>
      <div className="chart-body">
        <D3Chart
          id={id}
          fromDate={fromDate}
          toDate={toDate}
          interval={interval}
          yDomain={yDomain}
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
