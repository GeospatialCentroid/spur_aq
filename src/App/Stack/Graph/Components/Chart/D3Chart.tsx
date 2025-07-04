// File: src/App/Stack/Graph/Components/Chart/D3Chart.tsx

/**
 * D3Chart component
 *
 * - Uses D3.js to render a time series chart inside an SVG element.
 * - Dynamically configures time and value axes based on provided props.
 * - Plots multiple lines for different time series (excluding 'datetime' key).
 * - Adds primary and secondary tick intervals based on duration.
 * - Responsive layout based on container dimensions.
 * 
 * Dependencies:
 * - D3.js for SVG rendering and scale/time formatting
 * - React hooks (useEffect, useRef) for lifecycle and rendering
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './D3Chart.css';
import { getColorForVariable } from '../../ColorUtils';

/**
 * Props for the D3Chart component.
 *
 * @property id - Unique identifier for the chart (used in the title label).
 * @property fromDate - Start time (ISO 8601 string) for the X-axis.
 * @property toDate - End time (ISO 8601 string) for the X-axis.
 * @property interval - Time step resolution (e.g., '15min', 'hourly'), currently unused but reserved for future interval-specific logic.
 * @property yDomain - Fixed Y-axis range as a [min, max] tuple.
 * @property data - Optional object mapping series names to their time series data points.
 */
interface D3ChartProps {
  id: number;
  fromDate: string;
  toDate: string;
  interval: string;
  yDomain: [number, number];
  data?: Record<string, { timestamp: string; value: number }[]>;
}

const D3Chart: React.FC<D3ChartProps> = ({
  id,
  fromDate,
  toDate,
  interval,
  yDomain,
  data = {},
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // Clear previous chart elements
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const container = ref.current?.parentElement;
    if (!container) return;

    // Calculate dimensions based on container and margins
    const width = container.clientWidth;
    const height = container.clientHeight;

    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    /** Setup X (time) and Y (linear) scales */
    const xScale = d3.scaleTime()
      .domain([start, end])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine the total duration of the chart in minutes
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    /** Select primary tick interval for X-axis based on chart duration */
    let tickInterval: d3.TimeInterval;
    if (durationMinutes <= 60) {
      tickInterval = d3.timeMinute.every(1)!;
    } else if (durationMinutes <= 6 * 60) {
      tickInterval = d3.timeMinute.every(15)!;
    } else if (durationMinutes <= 24 * 60) {
      tickInterval = d3.timeHour.every(1)!;
    } else if (durationMinutes <= 3 * 24 * 60) {
      tickInterval = d3.timeHour.every(6)!;
    } else if (durationMinutes <= 14 * 24 * 60) {
      tickInterval = d3.timeDay.every(1)!;
    } else if (durationMinutes <= 45 * 24 * 60) {
      tickInterval = d3.timeWeek.every(1)!;
    } else if (durationMinutes <= 365 * 24 * 60) {
      tickInterval = d3.timeMonth.every(1)!;
    } else {
      tickInterval = d3.timeYear.every(1)!;
    }

    /** Define optional sub-tick interval for finer time indicators */
    let subTickInterval: d3.TimeInterval | null = null;
    if (durationMinutes > 365 * 24 * 60) {
      subTickInterval = d3.timeMonth.every(1);
    } else if (durationMinutes > 14 * 24 * 60) {
      subTickInterval = d3.timeDay.every(1);
    } else if (durationMinutes > 6 * 60) {
      subTickInterval = d3.timeHour.every(1);
    } else if (durationMinutes > 60) {
      subTickInterval = d3.timeMinute.every(15);
    } else {
      subTickInterval = d3.timeMinute.every(1);
    }

    /** Draw X-axis with formatted tick labels */
    const xAxis = d3.axisBottom(xScale)
      .ticks(tickInterval)
      .tickFormat((domainValue: Date | d3.NumberValue) => {
        const d = domainValue instanceof Date ? domainValue : new Date(+domainValue);
        if (durationMinutes > 365 * 24 * 60) {
          return d3.timeFormat('%Y')(d);
        } else if (durationMinutes > 45 * 24 * 60) {
          return d3.timeFormat('%b %Y')(d);
        } else {
          return d3.timeFormat('%m/%d %H:%M')(d);
        }
      });

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    /** Draw sub-ticks with no labels (shorter lines) */
    if (subTickInterval) {
      const subAxis = d3.axisBottom(xScale)
        .ticks(subTickInterval)
        .tickSize(4)
        .tickFormat(() => '');

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .attr('class', 'subtick-axis')
        .call(subAxis);
    }

    /** Format tick labels into two lines: date and time */
    xAxisGroup.selectAll('.tick text')
      .each(function (d) {
        const self = d3.select(this);
        const fullLabel = d3.timeFormat('%m/%d %H:%M')(d as Date);
        const [datePart, timePart] = fullLabel.split(' ');
        self.text(null);
        self.append('tspan').attr('x', 0).attr('dy', '0.6em').text(datePart);
        self.append('tspan').attr('x', 0).attr('dy', '1.2em').text(timePart); // Push time down
      });

    /** Draw Y-axis */
    const yAxis = d3.axisLeft(yScale).ticks(6);
    g.append('g').call(yAxis);

    /** Plot lines for each key in the data object */
    Object.entries(data).forEach(([key, series]) => {
      // Sort data chronologically
      const sortedSeries = [...series].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const line = d3.line<{ timestamp: string; value: number }>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX); // Smooth curve

      g.append('path')
        .datum(sortedSeries)
        .attr('fill', 'none')
        .attr('stroke', getColorForVariable(key))
        .attr('stroke-width', 3)
        .attr('d', line);
    });

    /** Chart title (currently disabled) */
    // svg.append('text')
    //   .attr('x', width / 2)
    //   .attr('y', 20)
    //   .attr('text-anchor', 'middle')
    //   .attr('font-size', '14px')
    //   .text(`Chart #${id}`);
  }, [id, fromDate, toDate, interval, yDomain, data]);

  return (
    <svg
      ref={ref}
      className="d3-chart"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default D3Chart;
