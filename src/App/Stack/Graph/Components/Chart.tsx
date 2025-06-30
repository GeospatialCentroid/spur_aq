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
 */
interface ChartProps {
  id: number;
  className?: string;
}

/**
 * Renders a chart and domain slider for the given graph ID.
 */
const Chart: React.FC<ChartProps> = ({ id, className = '' }) => {
  // Placeholder full domain range (e.g., timestamp or data index)
  const fullDomain: [number, number] = [0, 10];

  // Selected subdomain range controlled by the user
  const [selection, setSelection] = useState<[number, number]>([1, 3]);

  return (
    <div className={`graph-chart ${className}`}>
      {/* Visualization of data based on selected domain */}
      <D3Chart id={id} selection={selection} />

      {/* Slider to control which part of the domain is selected */}
      <DomainSlider
        domain={fullDomain}
        selection={selection}
        onChange={setSelection}
      />
    </div>
  );
};

export default Chart;
