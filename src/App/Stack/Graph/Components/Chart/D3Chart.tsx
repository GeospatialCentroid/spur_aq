import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { isUtcMode } from '../../../../../utils/time'; 
import './D3Chart.css';
import { getColorForVariable } from '../../ColorUtils';
import { SelectedMeasurement } from '../../graphTypes';
import { formatAxisLabel, formatTick } from '../../Utils/LabelFormat';
import { useTranslation } from 'react-i18next';
import { buildDownloadUrl, safeFilename } from '../../../../../utils/download';
import { formatTooltipDate } from '../../Utils/DateFormatter';


/**
 * Utility: Triggers browser download for CSV data
 */
async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error('Download failed', err);
  }
}

type MarkerShape = 'circle' | 'square' | 'triangleUp' | 'triangleDown' | 'diamond' | 'star' | 'plus' | 'hexagon' | 'heart' | 'pentagon';

const MARKER_SHAPES: MarkerShape[] = ['circle', 'square', 'triangleUp', 'triangleDown', 'diamond', 'star', 'plus', 'hexagon', 'heart', 'pentagon'];

function getMarkerShapeForName(name: string, selectedMeasurements: SelectedMeasurement[]): MarkerShape {
  const idx = selectedMeasurements.findIndex((m) => m.name === name || m.alias === name);
  return idx < 0 ? 'circle' : MARKER_SHAPES[idx % MARKER_SHAPES.length];
}

/**
 * Draw a marker shape centered at (0,0). 
 * Chained .attr() calls are used to avoid TypeScript string assignment errors.
 */
const SHAPE_MAP = {
  square: [[0,0], [100,0], [100,100], [0,100]],
  triangleUp: [[50,0], [0,100], [100,100]],
  triangleDown: [[0,0], [100,0], [50,100]],
  diamond: [[50,0], [100,50], [50,100], [0,50]],
  pentagon: [[50,0], [100,38], [82,100], [18,100], [0,38]],
  hexagon: [[25,0], [75,0], [100,50], [75,100], [25,100], [0,50]],
  plus: [[33,0], [66,0], [66,33], [100,33], [100,66], [66,66], [66,100], [33,100], [33,66], [0,66], [0,33], [33,33]]
};

/**
 * Consolidated Marker Drawing Logic
 */
function drawMarkerShape(
  group: d3.Selection<SVGGElement, any, any, any>, 
  shape: MarkerShape, 
  color: string, 
  radius: number,
  isDownloadable: boolean = false
) {
  group.selectAll('*').remove();
  
  // 1. Draw the Base Shape
  if (shape === 'circle') {
    group.append('circle')
      .attr('r', radius)
      .attr('fill', color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
  } else {
    const points = SHAPE_MAP[shape as keyof typeof SHAPE_MAP];
    if (points) {
      const svgPoints = points.map(([x, y]) => 
        `${(x - 50) * (radius / 50)},${(y - 50) * (radius / 50)}`
      ).join(' ');

      group.append('polygon')
        .attr('points', svgPoints)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    }
  }

  // 2. Inject the Down Arrow Character
  if (isDownloadable) {
    group.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', -0.5) // Slight manual nudge to center the character visually
      .style('fill', 'white')
      .style('font-size', `${radius * 1.4}px`) // Scale arrow relative to icon size
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text('↓');
  }
}
function markerHtml(shape: MarkerShape, color: string): string {
  const base = `display:inline-block;margin-right:6px;width:10px;height:10px;background:${color};`;
  
  if (shape === 'circle') {
    return `<span style="${base}border-radius:50%;"></span>`;
  }

  const points = SHAPE_MAP[shape as keyof typeof SHAPE_MAP];
  if (points) {
    const poly = points.map(([x, y]) => `${x}% ${y}%`).join(', ');
    return `<span style="${base}clip-path:polygon(${poly});"></span>`;
  }

  return `<span style="${base}"></span>`; // Fallback to square
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

const D3Chart: React.FC<D3ChartProps> = ({ id, fromDate, toDate, interval, yDomain, data = {}, selectedMeasurements }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [sizeTick, setSizeTick] = useState(0);
  const { t } = useTranslation('graph');
  const useUtc = isUtcMode();
  const searchParams = new URLSearchParams(window.location.search);
  const hideChart = searchParams.get('hide_chart');

  useEffect(() => {
    if (!ref.current?.parentElement) return;
    const ro = new ResizeObserver(() => setSizeTick(t => t + 1));
    ro.observe(ref.current.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const _interval = Math.max(Number(interval), 1);
    const svg = d3.select<SVGSVGElement, unknown>(ref.current!);
    svg.selectAll('*').remove();
    const container = ref.current?.parentElement;
    if (!container || selectedMeasurements.length === 0) return;

    // 1. DYNAMIC LAYOUT
    const axisWidth = 55;
    const extraRightAxes = Math.max(0, selectedMeasurements.length - 1);
    const margin = { 
      top: 40, 
      right: 40 + (extraRightAxes * axisWidth), 
      bottom: 60, 
      left: 70 
    };

    const width = container.clientWidth;
    const height = container.clientHeight;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    // 2. SCALES MAP
    const xScale = (useUtc ? d3.scaleUtc() : d3.scaleTime()).domain([start, end]).range([0, innerWidth]);
    const yScales: Record<string, d3.ScaleLinear<number, number>> = {};

    selectedMeasurements.forEach((m, i) => {
      const series = data[m.name] || [];
      const values = series.map(d => d.value).filter(v => v != null && !isNaN(v));
      
      // Calculate actual data bounds
      const dataMin = d3.min(values) ?? 0;
      const dataMax = d3.max(values) ?? 100;
      const range = dataMax - dataMin;

      if (i === 0) {
        // Check if the data is "too small" for the passed yDomain
        // If range is less than 5% of the yDomain range, auto-scale instead
        const domainRange = yDomain[1] - yDomain[0];
        const useDynamic = range > 0 && (range < domainRange * 0.05);

        yScales[m.name] = d3.scaleLinear()
          .domain(useDynamic ? [dataMin - (range * 0.1), dataMax + (range * 0.1)] : yDomain)
          .nice()
          .range([innerHeight, 0]);
      } else {
        // For extra axes, we already use dynamic scaling. 
        // Ensure padding is proportional to the range.
        const pad = range * 0.1 || 1;
        yScales[m.name] = d3.scaleLinear()
          .domain([dataMin - pad, dataMax + pad])
          .nice()
          .range([innerHeight, 0]);
      }
    });

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 3. X-AXIS
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d => {
      const fmt = useUtc ? d3.utcFormat('%m/%d %H:%M') : d3.timeFormat('%m/%d %H:%M');
      return fmt(d as Date);
    });
    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(xAxis);

    // 4. MULTIPLE Y-AXES
    selectedMeasurements.forEach((m, i) => {
      const scale = yScales[m.name];
      const color = "#000000";//m.color || getColorForVariable(m.alias || m.name);
      const isPrimary = i === 0;
      const xPos = isPrimary ? 0 : innerWidth + ((i - 1) * axisWidth);

      const axisGen = isPrimary ? d3.axisLeft(scale) : d3.axisRight(scale);
      const axisGroup = g.append('g')
        .attr('transform', `translate(${xPos}, 0)`)
        .call(axisGen.ticks(6));

      axisGroup.selectAll('path, line').style('stroke', color);
      axisGroup.selectAll('text').style('fill', color).text((d: any) => formatTick(String(d)));
      console.log(m.alias , m.name,m.formula, m.units)
     const labelParts = [m.formula, m.units].filter(Boolean).join(', ');
     const labelStr = `${m.alias || m.name}${labelParts ? ` (${labelParts})` : ''}`;

      
      g.append('text')
        .attr('transform', `translate(${isPrimary ? -margin.left + 25 : xPos + axisWidth - 10}, ${innerHeight / 2}) rotate(-90)`)
        .style('text-anchor', 'middle')
        .style('fill', color)
        .style('font-size', '12px')
        .style('user-select', 'none')
        .text(labelStr)//formatAxisLabel(labelStr));
    });

    // 5. LINES & INTERACTIVITY
    if (hideChart !== 't') {
      const allTimestamps = Array.from(new Set(Object.values(data).flatMap(s => s.map(d => d.timestamp)))).sort();
      
      selectedMeasurements.forEach((m) => {
        const series = data[m.name];
        if (!series) return;
        const line = d3.line<{ timestamp: string; value: number }>()
          .defined(d => d.value != null)
          .x(d => xScale(new Date(d.timestamp)))
          .y(d => yScales[m.name](d.value))
          .curve(d3.curveLinear);

        g.append('path')
          .datum(series)
          .attr('fill', 'none')
          .attr('stroke', m.color || getColorForVariable(m.alias || m.name))
          .attr('stroke-width', 2)
          .attr('d', line);
      });

      // Tooltip & Focus Circles
      const focusMarkers: Record<string, d3.Selection<SVGGElement, unknown, any, unknown>> = {};
      selectedMeasurements.forEach((m) => {
        const group = g.append('g').attr('class', 'focus-marker').style('opacity', 0);
        drawMarkerShape(group, getMarkerShapeForName(m.name, selectedMeasurements), m.color || getColorForVariable(m.alias || m.name), 5);
        focusMarkers[m.name] = group;
      });

      let tooltip = d3.select('body').select<HTMLDivElement>('div.tooltip');
      if (tooltip.empty()) {
        tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('position', 'absolute').style('opacity', 0).style('background', '#fff').style('border', '1px solid #ccc').style('padding', '8px');
      }

      g.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mousemove', (event) => {
          const [mouseX] = d3.pointer(event);
          const xDate = xScale.invert(mouseX);
          const bisect = d3.bisector((d: string) => new Date(d)).center;
          const idx = bisect(allTimestamps, xDate);
          const ts = allTimestamps[idx];
          if (!ts) return;
          const datetime = new Date(ts);
          const dateHeader = formatTooltipDate(datetime, useUtc);
          let html = `<strong>${dateHeader}</strong>`;

          selectedMeasurements.forEach(m => {
            const point = data[m.name]?.find(d => d.timestamp === ts);
            if (point) {
              const color = m.color || getColorForVariable(m.alias || m.name);
              // GET THE SHAPE: This identifies if it's a circle, square, triangle, etc.
              const shape = getMarkerShapeForName(m.name, selectedMeasurements);
              
              // GENERATE THE ICON: uses existing CSS-based markerHtml function
              const icon = markerHtml(shape, color);

              html += `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; white-space: nowrap;">
                  ${icon}
                  <span style="color: #555; font-size: 12px;">${m.alias || m.name}:</span>
                  <strong style="font-size: 12px; margin-left: auto;">${point.value.toFixed(2)}</strong>
                </div>
              `;

              // 4. Update the visual focus marker on the chart path
              const targetScale = yScales[m.name];
              if (targetScale && focusMarkers[m.name]) {
                focusMarkers[m.name]
                  .attr('transform', `translate(${xScale(datetime)}, ${targetScale(point.value)})`)
                  .style('opacity', 1);
              }
            }
          });

          tooltip.html(html).style('left', `${event.pageX + 15}px`).style('top', `${event.pageY - 20}px`).style('opacity', 1);
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0);
          Object.values(focusMarkers).forEach(f => f.style('opacity', 0));
        });
    }

    // 6. LEGEND
    const legend = svg.append('g').attr('transform', `translate(${margin.left}, 15)`);

selectedMeasurements.forEach((m, i) => {
  const color = m.color || getColorForVariable(m.alias || m.name);
  const isDownloadable = !!m.download_url;
  
  // Wrap everything in a group for a single click target
  const legItem = legend.append('g')
    .attr('transform', `translate(${i * 140}, 0)`)
    .style('cursor', isDownloadable ? 'pointer' : 'default')
    .on('click', () => {
      if (isDownloadable && m.download_url) {
        const fname = safeFilename(m.alias || m.name) + '.csv';
        downloadFile(buildDownloadUrl(m.download_url), fname);
      }
    });

  // Icon with Arrow
  const iconG = legItem.append('g');
    drawMarkerShape(
      iconG, 
      getMarkerShapeForName(m.name, selectedMeasurements), 
      color, 
      8, // Slightly larger radius for readability
      isDownloadable
    );

    // Text Label
    legItem.append('text')
      .attr('x', 15)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#333')
      .style('user-select', 'none')
      .text(m.alias || m.name);

    // Subtle hover effect
    if (isDownloadable) {
      legItem.on('mouseover', function() { d3.select(this).style('opacity', 0.7); })
            .on('mouseout', function() { d3.select(this).style('opacity', 1); });
    }
  });

  }, [id, fromDate, toDate, interval, yDomain, data, selectedMeasurements, sizeTick]);

  return <svg ref={ref} className="d3-chart" style={{ width: '100%', height: '100%' }} />;
};

export default D3Chart;