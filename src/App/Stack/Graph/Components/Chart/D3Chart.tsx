import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { isUtcMode } from '../../../../../utils/time'; 
import './D3Chart.css';
import { getColorForVariable } from '../../ColorUtils';
import { SelectedMeasurement } from '../../graphTypes';
import { formatAxisLabel, formatTick } from '../../Utils/LabelFormat';
import { useTranslation } from 'react-i18next';
import { buildDownloadUrl, safeFilename } from '../../../../../utils/download';

// Utility function for download
// Utility function for download
async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob(); // raw file content
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename; // <- THIS now works reliably
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(objectUrl); // cleanup
  } catch (err) {
    console.error('Download failed', err);
  }
}

/** Marker shapes used per series */
type MarkerShape =
  | 'circle'
  | 'square'
  | 'triangleUp'
  | 'triangleDown'
  | 'diamond'
  | 'star'
  | 'plus'
  | 'hexagon'
  | 'heart'
  | 'pentagon';

const MARKER_SHAPES: MarkerShape[] = [
  'circle',
  'square',
  'triangleUp',
  'triangleDown',
  'diamond',
  'star',
  'plus',
  'hexagon',
  'heart', 
  'pentagon',
];

/**
 * Helper: given a series name, return its marker shape
 * based on its index in `selectedMeasurements`.
 */
function getMarkerShapeForName(
  name: string,
  selectedMeasurements: SelectedMeasurement[]
): MarkerShape {
  const idx = selectedMeasurements.findIndex(
    (m) => m.name === name || m.alias === name
  );
  if (idx < 0) return 'circle';
  return MARKER_SHAPES[idx % MARKER_SHAPES.length];
}

/**
 * Draw a marker shape centered at (0,0) inside a group.
 * All shapes use the same radius and color, and get a white outline
 * so they pop on the chart.
 */
function drawMarkerShape(
  group: d3.Selection<SVGGElement, unknown, any, unknown>,
  shape: MarkerShape,
  color: string,
  radius: number
) {
  switch (shape) {
    case 'square':
      group
        .append('rect')
        .attr('x', -radius)
        .attr('y', -radius)
        .attr('width', radius * 2)
        .attr('height', radius * 2)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      break;

    case 'triangleUp':
      group
        .append('polygon')
        .attr(
          'points',
          `0,${-radius} ${-radius},${radius} ${radius},${radius}`
        )
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      break;

    case 'triangleDown':
      group
        .append('polygon')
        .attr(
          'points',
          `${-radius},${-radius} ${radius},${-radius} 0,${radius}`
        )
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      break;

    case 'diamond':
      group
        .append('polygon')
        .attr(
          'points',
          `0,${-radius} ${-radius},0 0,${radius} ${radius},0`
        )
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      break;

    case 'star': {
      // Smaller star so it matches the visual weight of other markers
      const sym = d3
        .symbol()
        .type(d3.symbolStar)
        .size((radius * 1.8) ** 2); // was (radius * 4) ** 2
      group
        .append('path')
        .attr('d', sym()!)
        .attr('fill', color)
        .attr('stroke-width', 1.5);
      break;
    }
    
    case 'plus':
      group
        .append('path')
        .attr(
          'd',
          `
          M ${-radius / 2} ${-radius}
          L ${radius / 2} ${-radius}
          L ${radius / 2} ${-radius / 2}
          L ${radius} ${-radius / 2}
          L ${radius} ${radius / 2}
          L ${radius / 2} ${radius / 2}
          L ${radius / 2} ${radius}
          L ${-radius / 2} ${radius}
          L ${-radius / 2} ${radius / 2}
          L ${-radius} ${radius / 2}
          L ${-radius} ${-radius / 2}
          L ${-radius / 2} ${-radius / 2}
          Z
        `
        )
        .attr('fill', color)
        .attr('stroke-width', 1.5);
      break;

    case 'hexagon': {
      const pts = d3
        .range(6)
        .map((i) => {
          const angle = (Math.PI / 3) * i;
          return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
        })
        .join(' ');
      group
        .append('polygon')
        .attr('points', pts)
        .attr('fill', color)
        .attr('stroke-width', 1.5);
      break;
    }

    case 'heart': {
      // Heart shape centered at (0,0)
      const r = radius;
      const path = `
        M 0 ${-r * 0.3}
        C ${-r} ${-r} ${-r * 1.5} ${r * 0.4} 0 ${r}
        C ${r * 1.5} ${r * 0.4} ${r} ${-r} 0 ${-r * 0.3}
        Z
      `;
      group
        .append('path')
        .attr('d', path)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      break;
    }

    case 'pentagon': {
      const pts = d3
        .range(5)
        .map((i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
        })
        .join(' ');
      group
        .append('polygon')
        .attr('points', pts)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      break;
    }

    default:
      // circle
      group
        .append('circle')
        .attr('r', radius)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      break;
  }
}

/** Small HTML snippet for tooltip markers */
function markerHtml(shape: MarkerShape, color: string): string {
  const base =
    'display:inline-block;margin-right:6px;width:10px;height:10px;';

  switch (shape) {
    case 'square':
      return `<span style="${base}background:${color};"></span>`;

    case 'triangleUp':
      return `<span style="${base}background:${color};clip-path:polygon(50% 0%,0% 100%,100% 100%);"></span>`;

    case 'triangleDown':
      return `<span style="${base}background:${color};clip-path:polygon(0% 0%,100% 0%,50% 100%);"></span>`;

    case 'diamond':
      return `<span style="${base}background:${color};transform:rotate(45deg);"></span>`;

    case 'star':
      return `<span style="${base}background:${color};clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);"></span>`;

    case 'plus':
      return `<span style="${base}position:relative;">
        <span style="position:absolute;top:4px;left:0;width:10px;height:2px;background:${color};"></span>
        <span style="position:absolute;top:0;left:4px;width:2px;height:10px;background:${color};"></span>
      </span>`;

    case 'hexagon':
      return `<span style="${base}background:${color};clip-path:polygon(
        25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%
      );"></span>`;

    case 'heart':
      return `<span style="${base}background:${color};clip-path:polygon(
        50% 15%,
        61% 0%,
        75% 0%,
        100% 25%,
        100% 50%,
        50% 100%,
        0% 50%,
        0% 25%,
        25% 0%,
        39% 0%
      );"></span>`;

    case 'pentagon':
      return `<span style="${base}background:${color};clip-path:polygon(
        50% 0%,100% 38%,81% 100%,19% 100%,0% 38%
      );"></span>`;

    default:
      // circle
      return `<span style="${base}background:${color};border-radius:50%;"></span>`;
  }
}

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
  const { t } = useTranslation('graph');

  const useUtc = isUtcMode();

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
  //console.log(selectedMeasurements)
  var _interval=Number(interval)

  //drop milliseconds
   const normalizedData: typeof data = {};
    for (const [key, values] of Object.entries(data)) {
      normalizedData[key] = values.map(d => ({
        ...d,
        timestamp: new Date(Math.floor(new Date(d.timestamp).getTime() / 1000) * 1000).toISOString()
      }));
    }
    data = normalizedData

 // Resolve a consistent color for a series using alias if available
const colorFor = (seriesName: string) => {
  const m = selectedMeasurements.find(
    mm => mm.name === seriesName || mm.alias === seriesName
  );
  if (m?.color) return m.color; // ← prefer the color stored on the measurement
  return getColorForVariable(m?.alias || m?.name || seriesName);
};


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

    const secondaryMeasurement = selectedMeasurements[1] ?? null;


    // Create X scale (time)
    const xScale = (useUtc ? d3.scaleUtc() : d3.scaleTime())
      .domain([start, end])
      .range([0, innerWidth]);

    // Primary Y scale domain from props (assumed for first var)
    const primaryYScale = d3
      .scaleLinear()
      .domain(yDomain)
      .nice()
      .range([innerHeight, 0]);

    // Secondary Y scale domain from actual data if second variable exists
    const secondaryYScale = secondaryMeasurement
      ? (secondaryMeasurement.units === primaryMeasurement?.units
          ? primaryYScale // share the same scale if units match
          : (data[secondaryMeasurement.name]
              ? d3.scaleLinear()
                  .domain([
                    d3.min(data[secondaryMeasurement.name].map((d) => d.value)) ?? 0,
                    d3.max(data[secondaryMeasurement.name].map((d) => d.value)) ?? 100,
                  ])
                  .nice()
                  .range([innerHeight, 0])
              : null))
      : null;


    // Main group translated by margins
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate duration in minutes for tick logic
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    const minute = useUtc ? d3.utcMinute : d3.timeMinute;
    const hour   = useUtc ? d3.utcHour   : d3.timeHour;
    const day    = useUtc ? d3.utcDay    : d3.timeDay;
    const week   = useUtc ? d3.utcWeek   : d3.timeWeek;
    const month  = useUtc ? d3.utcMonth  : d3.timeMonth;
    const year   = useUtc ? d3.utcYear   : d3.timeYear;


    // Choose X-axis tick interval based on duration
    let tickInterval: d3.TimeInterval;
    if (durationMinutes <= 60) tickInterval = minute.every(15)!;
    else if (durationMinutes <= 6 * 60) tickInterval = minute.every(15)!;
    else if (durationMinutes <= 24 * 60) tickInterval = hour.every(1)!;
    else if (durationMinutes <= 3 * 24 * 60) tickInterval = hour.every(6)!;
    else if (durationMinutes <= 14 * 24 * 60) tickInterval = day.every(1)!;
    else if (durationMinutes <= 45 * 24 * 60) tickInterval = week.every(1)!;
    else if (durationMinutes <= 365 * 24 * 60) tickInterval = month.every(1)!;
    else tickInterval = year.every(1)!;


    // Optional sub-tick interval
    let subTickInterval: d3.TimeInterval | null = null;
    if (durationMinutes > 365 * 24 * 60) subTickInterval = month.every(1);
    else if (durationMinutes > 14 * 24 * 60) subTickInterval = day.every(1);
    else if (durationMinutes > 6 * 60) subTickInterval = hour.every(1);
    else if (durationMinutes > 60) subTickInterval = minute.every(15);
    else subTickInterval = minute.every(1);

    const fmtYear      = useUtc ? d3.utcFormat('%Y')         : d3.timeFormat('%Y');
    const fmtMonthYear = useUtc ? d3.utcFormat('%b %Y')      : d3.timeFormat('%b %Y');
    const fmtShort     = useUtc ? d3.utcFormat('%m/%d %H:%M'): d3.timeFormat('%m/%d %H:%M');

    // Draw bottom X-axis with formatted tick labels
   const xAxis = d3
    .axisBottom(xScale)
    .ticks(tickInterval)
    .tickFormat((d: Date | d3.NumberValue) => {
      const date = d instanceof Date ? d : new Date(+d);
      if (durationMinutes > 365 * 24 * 60) return fmtYear(date);
      else if (durationMinutes > 45 * 24 * 60) return fmtMonthYear(date);
      else return fmtShort(date);
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
      const fullLabel = (useUtc ? d3.utcFormat('%m/%d %H:%M') : d3.timeFormat('%m/%d %H:%M'))(d as Date);
      const [datePart, timePart] = fullLabel.split(' ');
      self.text(null);
      self.append('tspan').attr('x', 0).attr('dy', '0.6em').text(datePart);
      self.append('tspan').attr('x', 0).attr('dy', '1.2em').text(timePart);
    });

    // Draw left Y-axis (primary)
    g.append('g')
      .attr('class', 'y-axis-left')
      .call(d3.axisLeft(primaryYScale).ticks(6));
    
      // Ellipsis shortens the left Y
    g.selectAll('.y-axis-left .tick text')
      .text((d: any) => formatTick(String(d)));

    // Draw right Y-axis (secondary), if exists
    if (secondaryYScale) {
      g.append('g')
        .attr('class', 'y-axis-right')
        .attr('transform', `translate(${innerWidth}, 0)`)
        .call(d3.axisRight(secondaryYScale).ticks(6));

      g.selectAll('.y-axis-right .tick text')
        .text((d: any) => formatTick(String(d)));
    }

  // Left Y-axis label (primary unit)
  if (primaryMeasurement) {
    const left_axis_name = primaryMeasurement.alias ?? primaryMeasurement.name ?? '';
    const fullLeftLabel =
      `${left_axis_name}${primaryMeasurement?.units || primaryMeasurement?.formula ?  ` (${[primaryMeasurement?.formula, primaryMeasurement?.units].filter(Boolean).join(', ')})`  : ''}`;
    const formattedLeft = formatAxisLabel(fullLeftLabel);

    const leftTitle = g.append('text')
      .attr('transform', `translate(${-margin.left + 15}, ${innerHeight / 2}) rotate(-90)`)
      .style('text-anchor', 'middle')
      .style('font-size', '1em')
      // keep arrow cursor, prevent text selection (always)
      .style('cursor', 'default')
      .style('user-select', 'none')
      .attr('aria-label', fullLeftLabel)
      .text(formattedLeft);

    // Only show tooltip + bold-on-hover if we actually truncated
    if (formattedLeft !== fullLeftLabel) {
      leftTitle.append('title').text(fullLeftLabel);

      leftTitle
        .on('mouseover', function () {
          d3.select(this).style('font-weight', 'bold');
        })
        .on('mouseout', function () {
          d3.select(this).style('font-weight', 'normal');
        });
    }
  }


  // Right Y-axis label (secondary unit)
  if (secondaryMeasurement) {
    const rightLabel = secondaryMeasurement.alias ?? secondaryMeasurement.name ?? '';
    const fullRightLabel =
      `${rightLabel}${secondaryMeasurement?.units || secondaryMeasurement?.formula ?  ` (${[secondaryMeasurement?.formula, secondaryMeasurement?.units].filter(Boolean).join(', ')})`  : ''}`;
    const formattedRight = formatAxisLabel(fullRightLabel);

    const rightTitle = g.append('text')
      .attr('transform', `translate(${innerWidth + margin.right - 15}, ${innerHeight / 2}) rotate(-90)`)
      .style('text-anchor', 'middle')
      .style('font-size', '1em')
      // keep arrow cursor, prevent text selection (always)
      .style('cursor', 'default')
      .style('user-select', 'none')
      .attr('aria-label', fullRightLabel)
      .text(formattedRight);

    // Only show tooltip + bold-on-hover if truncated
    if (formattedRight !== fullRightLabel) {
      rightTitle.append('title').text(fullRightLabel);

      rightTitle
        .on('mouseover', function () {
          d3.select(this).style('font-weight', 'bold');
        })
        .on('mouseout', function () {
          d3.select(this).style('font-weight', 'normal');
        });
    }
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
       .defined((d, i, dataArray) => {
          if (d.value == null) return false;
          if (i === 0) return true;
          const prev = dataArray[i - 1];
          const gapMinutes = (new Date(d.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60);
          return gapMinutes <= _interval; // only connect if gap close to the interval
        })
        .x((d) => xScale(new Date(d.timestamp)))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Append line path
      g.append('path')
        .datum(series)
        .attr('fill', 'none')
        .attr('stroke', colorFor(measurement.name))
        .attr('stroke-width', 2)
        .attr('d', line);

    });

    // Create focus circles for tooltips (one circle per measurement)

    const focusMarkers: Record<string, d3.Selection<SVGGElement, unknown, any, unknown>> = {};
    selectedMeasurements.forEach((measurement) => {
      const shape = getMarkerShapeForName(measurement.name, selectedMeasurements);

      const group = g
        .append('g')
        .attr('class', 'focus-marker')
        .style('opacity', 0);

      drawMarkerShape(group, shape, colorFor(measurement.name), 5);

      focusMarkers[measurement.name] = group;
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
      timeZone: useUtc ? 'UTC' : 'America/Denver',
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
       const tooltipHtml = [
          `<strong>${formatter.format(datetime)}</strong>`
        ]
          .concat(
            Object.entries(pointData).map(([key, value]) => {
              const m = selectedMeasurements.find(
                (mm) => mm.name === key || mm.alias === key
              );

              const formulaText = m?.formula ? ` ${m.formula}` : `${key}`;
              const shape = getMarkerShapeForName(key, selectedMeasurements);
              const color = colorFor(key);

              return `
                <div style="display: flex; align-items: center; gap: 6px;">
                  ${markerHtml(shape, color)}
                  <span>${formulaText}: ${value.toFixed(2)}</span>
                </div>
              `;
            })
          )
          .join(''); // removed

        tooltip
          .html(tooltipHtml)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 40 + 'px')
          .style('opacity', 1);

        // Position focus circles on hovered points
        // Position focus markers on hovered points
        selectedMeasurements.forEach((measurement) => {
          const series = data[measurement.name];
          if (!series) return;

          const marker = focusMarkers[measurement.name];
          if (!marker) return;

          const point = series.find((d) => d.timestamp === timestamp);
          if (!point) {
            marker.style('opacity', 0);
            return;
          }

          const yScale =
            measurement.units === primaryMeasurement?.units ? primaryYScale : secondaryYScale;
          if (!yScale) {
            marker.style('opacity', 0);
            return;
          }

          const cx = xScale(new Date(point.timestamp));
          const cy = yScale(point.value);

          marker
            .attr('transform', `translate(${cx},${cy})`)
            .style('opacity', 1);
        });

      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
        Object.values(focusMarkers).forEach((marker) => marker.style('opacity', 0));
      });


    // Legend with colored circles and last value of each variable
    // Legend with colored circles and last value of each variable
    // Legend with shaped markers and last value of each variable
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left}, 10)`);

    selectedMeasurements.forEach((variable, i) => {
      const x = i * 120 + 40;

      // Create a group for each legend item
      const legendItem = legend
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', `translate(${x}, 0)`);

      const shape = getMarkerShapeForName(variable.name, selectedMeasurements);
      const color = colorFor(variable.name);

      // Group for the clickable marker symbol
      const markerGroup = legendItem.append('g').attr('transform', 'translate(0,0)');

      drawMarkerShape(
        markerGroup as d3.Selection<SVGGElement, unknown, any, unknown>,
        shape,
        color,
        6
      );

      markerGroup
        .style('cursor', 'pointer')
        .on('click', () => {
          if (variable.download_url) {
            const fname = safeFilename(variable.alias || variable.name || 'data') + '.csv';
            downloadFile(buildDownloadUrl(variable.download_url), fname);
          }
        });

      // "↓" text centered on top of the marker
      markerGroup
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('pointer-events', 'none')
        .style('font-size', '10px')
        .text('↓');

      // Variable label
      legendItem
        .append('text')
        .attr('x', 12) // offset right from the marker
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('fill', 'black')
        .style('font-size', '12px')
        .style('cursor', 'default')
        .text(variable.alias || variable.name);

      legendItem.append('title').text(t('LEGEND.DOWNLOAD'));
    });
//       // Last value text
//       const series = data[variable.name] || [];
//       const lastValue = series.length > 0 ? series[series.length - 1].value : 0;



  }, [id, fromDate, toDate, interval, yDomain, data, selectedMeasurements, sizeTick]);


  return <svg ref={ref} className="d3-chart" style={{ width: '100%', height: '100%' }} />;
};

export default D3Chart;