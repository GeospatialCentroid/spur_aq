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
import {SelectedMeasurement} from '../../graphTypes';

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
  selectedMeasurements:SelectedMeasurement[]
}

const D3Chart: React.FC<D3ChartProps> = ({
  id,
  fromDate,
  toDate,
  interval,
  yDomain,
  data = {},
  selectedMeasurements
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
  console.log(variables,"variables")

    // Clear previous chart elements
    const svg = d3.select<SVGSVGElement, unknown>(ref.current!);
    svg.selectAll('*').remove();

    const container = ref.current?.parentElement;
    if (!container) return;

    // Calculate dimensions based on container and margins
    const width = container.clientWidth;
    const height = container.clientHeight;

    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
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
      tickInterval = d3.timeMinute.every(15)!;
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

const mountainFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Denver',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

   // Tooltip setup
const tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> = d3.select('body')
  .append('div')
  .attr('id', 'chart-tooltip')
  .style('position', 'absolute')
  .style('background', '#fff')
  .style('border', '1px solid #ccc')
  .style('padding', '6px')
  .style('border-radius', '4px')
  .style('font-size', '12px')
  .style('pointer-events', 'none')
  .style('opacity', 0);

// Flatten all timestamps (assumes all series are aligned)
const allTimestamps = Array.from(
  new Set(Object.values(data).flat().map(d => d.timestamp))
).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

// Create a lookup for quick access
const dataByTimestamp = new Map<string, Record<string, number>>();
allTimestamps.forEach(timestamp => {
  const row: Record<string, number> = {};
  for (const [key, series] of Object.entries(data)) {
    const point = series.find(d => d.timestamp === timestamp);
    if (point) row[key] = point.value;
  }
  dataByTimestamp.set(timestamp, row);
});

// Draw lines
Object.entries(data).forEach(([key, series]) => {
  const sortedSeries = [...series].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const line = d3.line<{ timestamp: string; value: number }>()
    .x(d => xScale(new Date(d.timestamp)))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(sortedSeries)
    .attr('fill', 'none')
    .attr('stroke', getColorForVariable(key))
    .attr('stroke-width', 1.5)
    .attr('d', line);
});

// Create hidden focus circles (one per series)
const focusCircles: Record<string, d3.Selection<SVGCircleElement, unknown, any, unknown>> = {};

Object.entries(data).forEach(([key, series]) => {
  focusCircles[key] = g.append<SVGCircleElement>('circle')
  .attr('r', 5)
  .attr('fill', getColorForVariable(key))
  .attr('stroke', '#fff')
  .attr('stroke-width', 1.5)
  .style('opacity', 0);
});

// Add invisible overlay to capture mouse
g.append('rect')
  .attr('width', width)
  .attr('height', height)
  .style('fill', 'none')
  .style('pointer-events', 'all')
  .on('mousemove', function (event) {
    const [mouseX] = d3.pointer(event);
    const x0 = xScale.invert(mouseX);

    // Find closest timestamp
    const bisect = d3.bisector((d: string) => new Date(d)).center;
    const i = bisect(allTimestamps, x0);
    const timestamp = allTimestamps[i];

    const pointData = dataByTimestamp.get(timestamp);
    if (!pointData) return;

    // Update tooltip HTML

    const tooltipHtml = [`<strong>MT ${mountainFormatter.format(new Date(timestamp+ 'Z'))}</strong>`]
      .concat(
        Object.entries(pointData).map(
          ([key, value]) => `${key}: ${value.toFixed(2)}`
        )
      ).join("<br>");

    tooltip.html(tooltipHtml)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 40) + 'px')
      .style('opacity', 1);

    // Show and move focus circles
    Object.entries(data).forEach(([key, series]) => {
      const point = series.find(d => d.timestamp === timestamp);
      if (point) {
        focusCircles[key]
          .attr('cx', xScale(new Date(point.timestamp)))
          .attr('cy', yScale(point.value))
          .style('opacity', 1);
      } else {
        focusCircles[key].style('opacity', 0);
      }
    });
  })
  .on('mouseout', () => {
    tooltip.style('opacity', 0);
    Object.values(focusCircles).forEach(c => c.style('opacity', 0));
  });

    // adding a left axis
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 15) // adjust based on your margin
      .attr("x", -height / 2)       // center vertically
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(variables[0]?.name);

      // adding a right axis
      if(variables.length>1){
           svg.append("text")
              .attr("transform", `rotate(-90)`)
              .attr("y", width - 22)  // move it to the far right (adjust as needed)
              .attr("x", -height / 2) // center vertically
              .attr("dy", "1em")
              .attr("text-anchor", "middle")
              .text(variables[1]?.name);
      }
    // legend
    const legendMarginTop = 10;
    const legendCircleRadius = 6;
    const legendSpacingX = 120;

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left}, ${legendMarginTop})`);

    variables.forEach((variable, i) => {
      const x = i * legendSpacingX;

      // Colored circle
      legend.append('circle')
        .attr('cx', x)
        .attr('cy', 0)
        .attr('r', legendCircleRadius)
        .attr('fill', getColorForVariable(variable.name));

      // Text label with variable name and initial value
      // Assume initial value is last value of series, or 0 if none
      const series = data[variable.name] || [];
      const lastValue = series.length > 0 ? series[series.length - 1].value : 0;

      legend.append('text')
        .attr('x', x + legendCircleRadius + 5)
        .attr('y', 0)
        .attr('dy', '0.35em') // vertically center text with circle
        .style('font-size', '12px')
        .text(`${variable.name}: Last value ${lastValue.toFixed(2)}`);
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
