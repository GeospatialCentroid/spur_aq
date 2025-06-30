// File: src/App/Stack/Graph/Components/Chart/D3Chart.tsx

/**
 * D3Chart component
 *
 * - Uses D3.js to render a simple chart inside an SVG element.
 * - Displays a circle at the midpoint of the selected range and labels it with the graph ID.
 * - Re-renders whenever `selection` or `id` changes.
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './D3Chart.css';

/**
 * Props for the D3Chart component.
 *
 * @property id - Unique identifier for the graph (used in the text label).
 * @property selection - A two-value numeric range [min, max] used to determine circle position.
 */
interface D3ChartProps {
  id: number;
  selection: [number, number];
}

/**
 * Renders a small, dynamic SVG chart using D3.
 */
const D3Chart: React.FC<D3ChartProps> = ({ id, selection }) => {
  const ref = useRef<SVGSVGElement | null>(null); // Ref to the <svg> DOM node

  useEffect(() => {
    const [x0, x1] = selection;
    const width = 150;
    const height = 100;

    const svg = d3.select(ref.current);

    // Clear previous contents
    svg.selectAll('*').remove();

    // Create x-scale mapping selection range to SVG width
    const xScale = d3.scaleLinear().domain([x0, x1]).range([0, width]);
    const mid = (x0 + x1) / 2;

    // Draw a circle at the midpoint of the selection range
    svg
      .append('circle')
      .attr('cx', xScale(mid))
      .attr('cy', height / 2 - 10)
      .attr('r', 20)
      .attr('fill', 'steelblue');

    // Add a text label with the chart ID
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(`Chart #${id}`);
  }, [id, selection]); // Re-run effect when either id or selection changes

  return <svg ref={ref} width={150} height={100} className="d3-chart" />;
};

export default D3Chart;
