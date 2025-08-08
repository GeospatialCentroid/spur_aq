import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RangeEntry } from './MeasurementUtils';

interface GaugeDialProps {
  value: number;
  ranges: RangeEntry[];
}

const GaugeDial: React.FC<GaugeDialProps> = ({ value, ranges }) => {
  const ref = useRef<SVGSVGElement>(null);

  // Sort the provided ranges by their starting value
  const sortedRanges = [...ranges].sort((a, b) => a.range[0] - b.range[0]);

  useEffect(() => {
    if (!ref.current || sortedRanges.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove(); // Clear previous SVG elements

    // Set up SVG dimensions and center point
    const width = 300;
    const height = 180;
    const centerX = width / 2;
    const centerY = height * 0.9;
    const radius = 100;

    // Define angular range for the semi-circle dial
    const startAngleDeg = -90;
    const endAngleDeg = 90;
    const arcCount = sortedRanges.length;
    const arcSpan = ((endAngleDeg - startAngleDeg) * Math.PI) / 180 / arcCount;

    // Draw each colored range arc based on index
    sortedRanges.forEach((r, i) => {
      const startAngle = (startAngleDeg + i * (180 / arcCount)) * (Math.PI / 180);
      const endAngle = startAngle + arcSpan;

      const arcPath = d3.arc()
        .innerRadius(radius - 25)
        .outerRadius(radius)
        .startAngle(startAngle)
        .endAngle(endAngle);

      svg.append('path')
        .attr('transform', `translate(${centerX},${centerY})`)
        .attr('d', arcPath({
          innerRadius: radius - 25,
          outerRadius: radius,
          startAngle,
          endAngle
        })!)
        .attr('fill', r.color || '#ccc')
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5);
    });

    // Determine scale for converting value to angle
    const rangeMin = Math.min(...sortedRanges.map(r => r.range[0]));
    const rangeMax = Math.max(...sortedRanges.map(r => r.range[1]));
    const scale = d3.scaleLinear()
      .domain([rangeMin, rangeMax])
      .range([startAngleDeg * (Math.PI / 180), endAngleDeg * (Math.PI / 180)]);

    // Find which range the value falls into
    const matchedIndex = sortedRanges.findIndex(r => value >= r.range[0] && value <= r.range[1]);

    // Fallback to center if no match
    const segmentIndex = matchedIndex !== -1 ? matchedIndex : Math.floor(sortedRanges.length / 2);

    // Compute the center angle of that segment
    const segmentAngleDeg = startAngleDeg + (segmentIndex + 0.5) * ((endAngleDeg - startAngleDeg) / arcCount);
    const segmentAngleRad = segmentAngleDeg * (Math.PI / 180);

    // Needle endpoint
    const needleLength = radius - 30;
    const x2 = centerX + Math.cos(segmentAngleRad) * needleLength;
    const y2 = centerY + Math.sin(segmentAngleRad) * needleLength;

    // Draw the needle
    svg.append('line')
    .attr('x1', centerX)
    .attr('y1', centerY)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('stroke', '#333')
    .attr('stroke-width', 3)
    .attr('stroke-linecap', 'round');

    // Draw needle base circle
    svg.append('circle')
    .attr('cx', centerX)
    .attr('cy', centerY)
    .attr('r', 6)
    .attr('fill', '#333');


    // Draw needle base circle
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 6)
      .attr('fill', '#333');

    // Add tick labels for the start of each range
    sortedRanges.forEach((r, i) => {
      const labelAngle = -Math.PI + i * arcSpan;
      const x = centerX + Math.cos(labelAngle) * (radius + 20);
      const y = centerY + Math.sin(labelAngle) * (radius + 20);

      svg.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(r.range[0]);

      // Add the end label for the final range
      if (i === sortedRanges.length - 1) {
        const endLabelAngle = -Math.PI + (i + 1) * arcSpan;
        const endX = centerX + Math.cos(endLabelAngle) * (radius + 20);
        const endY = centerY + Math.sin(endLabelAngle) * (radius + 20);

        svg.append('text')
          .attr('x', endX)
          .attr('y', endY)
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(r.range[1]);
      }
    });
  }, [value, sortedRanges]);

  // Render SVG container for the gauge
  return <svg ref={ref} width={300} height={180}></svg>;
};

export default GaugeDial;
