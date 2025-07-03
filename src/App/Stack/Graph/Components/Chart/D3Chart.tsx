// File: src/App/Stack/Graph/Components/Chart/D3Chart.tsx

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './D3Chart.css';

/**
 * Props for the D3Chart component.
 *
 * @property id - Unique ID used to label the chart.
 * @property fromDate - Start date of the data range (ISO string).
 * @property toDate - End date of the data range (ISO string).
 * @property interval - Interval string used for axis resolution (not currently used directly).
 * @property yDomain - Y-axis value range [min, max].
 */
interface D3ChartProps {
  id: number;
  fromDate: string;
  toDate: string;
  interval: string;
  yDomain: [number, number];
}

/**
 * D3Chart renders a responsive time-series chart using D3 inside a React component.
 */
const D3Chart: React.FC<D3ChartProps> = ({
  id,
  fromDate,
  toDate,
  interval,
  yDomain,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove(); // Clear previous chart contents

    // Ensure parent element is available
    const container = ref.current?.parentElement;
    if (!container) return;

    // Get actual pixel dimensions of the container
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Chart margins (space around axes)
    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Parse date range from props
    const start = new Date(fromDate);
    const end = new Date(toDate);

    // X Scale: time-based
    const xScale = d3.scaleTime()
      .domain([start, end])
      .range([0, innerWidth]);

    // Y Scale: linear numeric range, padded 10% above max
    const yScale = d3.scaleLinear()
      .domain([Math.min(0, yDomain[0]), yDomain[1] * 1.1])
      .nice()
      .range([innerHeight, 0]);

    // Main group to apply margin offset
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine total duration in minutes
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Dynamically select appropriate time interval for x-axis ticks
    let tickInterval: d3.TimeInterval;
    if (durationMinutes <= 60) {
      tickInterval = d3.timeMinute.every(1)!;        // Up to 1 hour
    } else if (durationMinutes <= 6 * 60) {
      tickInterval = d3.timeMinute.every(15)!;       // Up to 6 hours
    } else if (durationMinutes <= 24 * 60) {
      tickInterval = d3.timeHour.every(1)!;          // Up to 1 day
    } else if (durationMinutes <= 3 * 24 * 60) {
      tickInterval = d3.timeHour.every(6)!;          // Up to 3 days
    } else if (durationMinutes <= 14 * 24 * 60) {
      tickInterval = d3.timeDay.every(1)!;           // Up to 2 weeks
    } else if (durationMinutes <= 45 * 24 * 60) {
      tickInterval = d3.timeWeek.every(1)!;          // Up to 1.5 months
    } else if (durationMinutes <= 365 * 24 * 60) {
      tickInterval = d3.timeMonth.every(1)!;         // Up to 1 year
    } else {
      tickInterval = d3.timeYear.every(1)!;          // More than a year
    }


    // Create X Axis with formatted ticks
    const xAxis = d3.axisBottom(xScale)
      .ticks(tickInterval)
      .tickFormat((domainValue: Date | d3.NumberValue) => {
        const d = domainValue instanceof Date ? domainValue : new Date(+domainValue);
        return d3.timeFormat('%m/%d %H:%M')(d);
      });

    // Append and position x-axis
    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    // Format x-axis ticks to split date and time into two lines
    xAxisGroup.selectAll('.tick text')
      .each(function (d) {
        const self = d3.select(this);
        const fullLabel = d3.timeFormat('%m/%d %H:%M')(d as Date);
        const [datePart, timePart] = fullLabel.split(' ');
        self.text(null);
        self.append('tspan')
          .attr('x', 0)
          .attr('dy', '0.6em') // push date line down
          .text(datePart);
        self.append('tspan')
          .attr('x', 0)
          .attr('dy', '1.2em') // push time line below
          .text(timePart);
      });

    // Create and append Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(6);
    g.append('g').call(yAxis);

    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .text(`Chart #${id}`);
  }, [id, fromDate, toDate, interval, yDomain]);

  return (
    <svg
      ref={ref}
      className="d3-chart"
      style={{ width: '100%', height: '100%' }} // fully fills parent container
    />
  );
};

export default D3Chart;
