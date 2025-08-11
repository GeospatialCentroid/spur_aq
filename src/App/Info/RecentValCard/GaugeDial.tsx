import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RangeEntry } from './MeasurementUtils';

interface GaugeDialProps {
  value: number;
  ranges: RangeEntry[];
}

const GaugeDial: React.FC<GaugeDialProps> = ({ value, ranges }) => {
  const ref = useRef<SVGSVGElement>(null);

  // SVG layout configuration
  const width = 300;
  const height = 150;
  const centerX = width / 2;
  const centerY = height * 0.9;
  const radius = 120;

  // Ensure ranges are sorted left-to-right
  const sortedRanges = [...ranges].sort((a, b) => a.range[0] - b.range[0]);

  useEffect(() => {
    if (!ref.current || sortedRanges.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove(); // Clear previous content

    // Define gauge angle range
    // Use radians for the correct full half-circle layout
// Arc layout: evenly divide full arc by number of color segments
const startAngleRad = -Math.PI/2; // -180 degrees
const endAngleRad = Math.PI/2;          //   0 degrees
const totalArc = endAngleRad - startAngleRad;
const arcCount = sortedRanges.length;
const arcSpan = totalArc / arcCount;

// Draw arc segments for each color, evenly distributed
sortedRanges.forEach((r, i) => {
  const arcStart = startAngleRad + i * arcSpan;
  const arcEnd = arcStart + arcSpan;

  const arcPath = d3.arc()
    .innerRadius(radius - 35)
    .outerRadius(radius)
    .startAngle(arcStart)
    .endAngle(arcEnd);

  svg.append('path')
    .attr('transform', `translate(${centerX},${centerY})`)
   .attr('d', arcPath({
    startAngle: arcStart,
    endAngle: arcEnd,
    innerRadius: radius - 35,
    outerRadius: radius
    })!)


   .attr('fill', r.color || '#ccc');

});


// Visually fixed needle arc from -Math.PI (left) to 0 (right)
const needleStartAngle = -Math.PI;
const needleEndAngle = 0;
const totalNeedleArc = needleEndAngle - needleStartAngle;

// Clamp value within bounds
const rangeMin = sortedRanges[0].range[0];
const rangeMax = sortedRanges[sortedRanges.length - 1].range[1];
const clampedValue = Math.max(rangeMin, Math.min(rangeMax, value));

// Find segment where value belongs
let needleAngle = needleStartAngle;
for (let i = 0; i < sortedRanges.length; i++) {
  const [minVal, maxVal] = sortedRanges[i].range;
  const segmentStartAngle = needleStartAngle + (i / sortedRanges.length) * totalNeedleArc;
  const segmentEndAngle = needleStartAngle + ((i + 1) / sortedRanges.length) * totalNeedleArc;

  if (clampedValue >= minVal && clampedValue <= maxVal) {
    const localRatio = (clampedValue - minVal) / (maxVal - minVal);
    needleAngle = segmentStartAngle + localRatio * (segmentEndAngle - segmentStartAngle);
    break;
  }
}



// Needle tip position
const needleLength = radius - 30;
const x2 = centerX + Math.cos(needleAngle) * needleLength;
const y2 = centerY + Math.sin(needleAngle) * needleLength;



    // Draw the needle
    svg.append('line')
      .attr('x1', centerX)
      .attr('y1', centerY)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', '#333')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round');

    // Center dot on the needle
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 6)
      .attr('fill', '#333');

    // Add labels (fixed position)
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

      // Add the final upper bound label
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

 return (
  <svg
    ref={ref}
    viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="xMidYMid meet"
    style={{ width: '100%', height: 'auto', maxWidth: '100%' }}
  />
);

};

export default GaugeDial;
