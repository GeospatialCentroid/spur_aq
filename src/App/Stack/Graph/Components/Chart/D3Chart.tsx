import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './D3Chart.css';
import { getColorForVariable } from '../../ColorUtils';
import { SelectedMeasurement } from '../../graphTypes';

interface D3ChartProps {
  id: number;
  fromDate: string;
  toDate: string;
  interval: string;
  yDomain: [number, number];
  data?: Record<string, { timestamp: string; value: number }[]>;
  selectedMeasurements: SelectedMeasurement[];
}

const D3Chart: React.FC<D3ChartProps> = ({
  id,
  fromDate,
  toDate,
  interval,
  yDomain,
  data = {},
  selectedMeasurements,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [sizeTick, setSizeTick] = useState(0);

  useEffect(() => {
  if (!ref.current) return;
  const container = ref.current.parentElement;
  if (!container) return;

  const ro = new ResizeObserver(() => setSizeTick(t => t + 1));
  ro.observe(container);

  const onResize = () => setSizeTick(t => t + 1);
  window.addEventListener('resize', onResize);

  return () => {
    ro.disconnect();
    window.removeEventListener('resize', onResize);
  };
}, []);


  useEffect(() => {
  var variables= selectedMeasurements
  //console.log(variables,"variables")
  
  //drop milliseconds
   const normalizedData: typeof data = {};
    for (const [key, values] of Object.entries(data)) {
      normalizedData[key] = values.map(d => ({
        ...d,
        timestamp: new Date(Math.floor(new Date(d.timestamp).getTime() / 1000) * 1000).toISOString()
      }));
    }
    data = normalizedData
    // Setup SVG and clear previous contents
    const svg = d3.select<SVGSVGElement, unknown>(ref.current!);
    svg.selectAll('*').remove();

    const container = ref.current?.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 30, right: 60, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Parse date range
    const start = new Date(fromDate);
    const end = new Date(toDate);

    // Determine primary and secondary variables based on first two selectedMeasurements,
    // enforce first variable uses left axis, second uses right if units differ
    const primaryMeasurement = selectedMeasurements[0];

    const secondaryMeasurement =
      selectedMeasurements[1] &&
      selectedMeasurements[1].units !== primaryMeasurement?.units
        ? selectedMeasurements[1]
        : null;

    // Create X scale (time)
    const xScale = d3.scaleTime().domain([start, end]).range([0, innerWidth]);

    // Primary Y scale domain from props (assumed for first var)
    const primaryYScale = d3
      .scaleLinear()
      .domain(yDomain)
      .nice()
      .range([innerHeight, 0]);

    // Secondary Y scale domain from actual data if second variable exists
    const secondaryYScale =
      secondaryMeasurement && data[secondaryMeasurement.name]
        ? d3
            .scaleLinear()
            .domain([
              d3.min(data[secondaryMeasurement.name].map((d) => d.value)) ?? 0,
              d3.max(data[secondaryMeasurement.name].map((d) => d.value)) ?? 100,
            ])
            .nice()
            .range([innerHeight, 0])
        : null;

    // Main group translated by margins
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate duration in minutes for tick logic
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    // Choose X-axis tick interval based on duration
    let tickInterval: d3.TimeInterval;
    if (durationMinutes <= 60) tickInterval = d3.timeMinute.every(15)!;
    else if (durationMinutes <= 6 * 60) tickInterval = d3.timeMinute.every(15)!;
    else if (durationMinutes <= 24 * 60) tickInterval = d3.timeHour.every(1)!;
    else if (durationMinutes <= 3 * 24 * 60) tickInterval = d3.timeHour.every(6)!;
    else if (durationMinutes <= 14 * 24 * 60) tickInterval = d3.timeDay.every(1)!;
    else if (durationMinutes <= 45 * 24 * 60) tickInterval = d3.timeWeek.every(1)!;
    else if (durationMinutes <= 365 * 24 * 60) tickInterval = d3.timeMonth.every(1)!;
    else tickInterval = d3.timeYear.every(1)!;

    // Optional sub-tick interval
    let subTickInterval: d3.TimeInterval | null = null;
    if (durationMinutes > 365 * 24 * 60) subTickInterval = d3.timeMonth.every(1);
    else if (durationMinutes > 14 * 24 * 60) subTickInterval = d3.timeDay.every(1);
    else if (durationMinutes > 6 * 60) subTickInterval = d3.timeHour.every(1);
    else if (durationMinutes > 60) subTickInterval = d3.timeMinute.every(15);
    else subTickInterval = d3.timeMinute.every(1);

    // Draw bottom X-axis with formatted tick labels
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(tickInterval)
      .tickFormat((d: Date | d3.NumberValue) => {
        const date = d instanceof Date ? d : new Date(+d);
        if (durationMinutes > 365 * 24 * 60) return d3.timeFormat('%Y')(date);
        else if (durationMinutes > 45 * 24 * 60) return d3.timeFormat('%b %Y')(date);
        else return d3.timeFormat('%m/%d %H:%M')(date);
      });

    const xAxisGroup = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(xAxis);

    // Draw sub-ticks below X-axis (small lines)
    if (subTickInterval) {
      const subAxis = d3
        .axisBottom(xScale)
        .ticks(subTickInterval)
        .tickSize(4)
        .tickFormat(() => '');

      g.append('g').attr('transform', `translate(0,${innerHeight})`).attr('class', 'subtick-axis').call(subAxis);
    }

    // Format X-axis tick labels to multiline (date on one line, time on next)
    xAxisGroup.selectAll('.tick text').each(function (d) {
      const self = d3.select(this);
      const fullLabel = d3.timeFormat('%m/%d %H:%M')(d as Date);
      const [datePart, timePart] = fullLabel.split(' ');
      self.text(null);
      self.append('tspan').attr('x', 0).attr('dy', '0.6em').text(datePart);
      self.append('tspan').attr('x', 0).attr('dy', '1.2em').text(timePart);
    });

    // Draw left Y-axis (primary)
    g.append('g').call(d3.axisLeft(primaryYScale).ticks(6));

    // Draw right Y-axis (secondary), if exists
    if (secondaryYScale) {
      g.append('g').attr('transform', `translate(${innerWidth}, 0)`).call(d3.axisRight(secondaryYScale).ticks(6));
    }

    // Left Y-axis label (primary unit)
    if (primaryMeasurement) {
    var left_axis_name = primaryMeasurement.alias
    if (selectedMeasurements.length>1 &&  primaryMeasurement.units == selectedMeasurements[1].units){
        // if the units match. append the secondary measurement name to the left axis
       left_axis_name+=", "+selectedMeasurements[1].alias
    }
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left + 15)
        .attr('x', -innerHeight / 2)
        .attr('dy', '.7em')
        .style('text-anchor', 'middle')
        .style('font-size', '1em')
        .text(`${left_axis_name} (${primaryMeasurement.units})`);
    }

    // Right Y-axis label (secondary unit)
    if (secondaryMeasurement) {
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', innerWidth + margin.right - 25)
        .attr('x', -innerHeight / 2)
        .attr('dy', '.7em')
        .style('text-anchor', 'middle')
        .style('font-size', '1em')
        .text(`${secondaryMeasurement.alias} (${secondaryMeasurement.units})`);
    }

    // Prepare all timestamps (unique sorted)
    const allTimestamps = Array.from(
      new Set(Object.values(data).flatMap((series) => series.map((d) => d.timestamp)))
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Build a map: timestamp -> { variableName: value, ... }
    const dataByTimestamp = new Map<string, Record<string, number>>();
    allTimestamps.forEach((timestamp) => {
      const row: Record<string, number> = {};
      for (const [key, series] of Object.entries(data)) {
        const point = series.find((d) => d.timestamp === timestamp);
        if (point) row[key] = point.value;
      }
      dataByTimestamp.set(timestamp, row);
    });

    // Draw lines for each measurement
    selectedMeasurements.forEach((measurement) => {
      const series = data[measurement.name];
      if (!series || series.length === 0) return;

      // Choose correct yScale
      const yScale = measurement.units === primaryMeasurement?.units ? primaryYScale : secondaryYScale;
      if (!yScale) return;

      // Define line generator
      const line = d3
        .line<{ timestamp: string; value: number }>()
        .defined((d) => d.value != null)
        .x((d) => xScale(new Date(d.timestamp)))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Append line path
      g.append('path')
        .datum(series)
        .attr('fill', 'none')
        .attr('stroke', getColorForVariable(measurement.name))
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Create focus circles for tooltips (one circle per measurement)
    const focusCircles: Record<string, d3.Selection<SVGCircleElement, unknown, any, unknown>> = {};
    selectedMeasurements.forEach((measurement) => {
      focusCircles[measurement.name] = g
        .append('circle')
        .attr('r', 5)
        .attr('fill', getColorForVariable(measurement.name))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .style('opacity', 0);
    });

    // Tooltip div
    let tooltip = d3.select('body').select<HTMLDivElement>('div.tooltip');
    if (tooltip.empty()) {
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('background', '#fff')
        .style('border', '1px solid #ccc')
        .style('padding', '6px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('opacity', 0);
    }

    // Date formatter for tooltip header
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Overlay rectangle to capture mouse events for tooltip
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX);

        // Find closest timestamp index
        const bisect = d3.bisector((d: string) => new Date(d)).center;
        const i = bisect(allTimestamps, x0);
        const timestamp = allTimestamps[i];
        if (!timestamp) return;

        const pointData = dataByTimestamp.get(timestamp);
        if (!pointData) return;

        const datetime = new Date(timestamp);
        if (isNaN(datetime.getTime())) return;

        // Build tooltip HTML with date/time and values
        const tooltipHtml = [`<strong>${formatter.format(datetime)}</strong>`]
          .concat(
            Object.entries(pointData).map(
              ([key, value]) => `
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: ${getColorForVariable(
                key
              )};"></div>
              ${key}: ${value.toFixed(2)}
            </div>`
            )
          )
          .join('');

        tooltip
          .html(tooltipHtml)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 40 + 'px')
          .style('opacity', 1);

        // Position focus circles on hovered points
        selectedMeasurements.forEach((measurement) => {
          const series = data[measurement.name];
          if (!series) return;

          const point = series.find((d) => d.timestamp === timestamp);
          if (!point) {
            focusCircles[measurement.name].style('opacity', 0);
            return;
          }

          const yScale = measurement.units === primaryMeasurement?.units ? primaryYScale : secondaryYScale;
          if (!yScale) {
            focusCircles[measurement.name].style('opacity', 0);
            return;
          }

          const cx = xScale(new Date(point.timestamp));
          const cy = yScale(point.value);

          focusCircles[measurement.name]
            .attr('cx', cx)
            .attr('cy', cy)
            .style('opacity', 1);
        });
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
        Object.values(focusCircles).forEach((circle) => circle.style('opacity', 0));
      });

    // Legend with colored circles and last value of each variable
    const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(${margin.left}, 10)`);

    selectedMeasurements.forEach((variable, i) => {
      const x = i * 120+40;

      // Circle for color
      legend
        .append('circle')
        .attr('cx', x)
        .attr('cy', 0)
        .attr('r', 6)
        .attr('fill', getColorForVariable(variable.name));

      // Last value text
      const series = data[variable.name] || [];
      const lastValue = series.length > 0 ? series[series.length - 1].value : 0;

      legend
        .append('text')
        .attr('x', x + 10)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .text(`${variable.alias}`);
        //.text(`${variable.name}: Last value ${lastValue.toFixed(2)}`);
    });
  }, [id, fromDate, toDate, interval, yDomain, data, selectedMeasurements, sizeTick]);


  return <svg ref={ref} className="d3-chart" style={{ width: '100%', height: '100%' }} />;
};

export default D3Chart;