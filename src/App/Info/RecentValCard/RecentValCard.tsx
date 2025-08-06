// (imports remain unchanged)
import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import VariableModal from '../../Stack/Graph/Components/Menu/VariableModal/VariableModal';
import './RecentValCard.css';
export {}; // Fixes TS1208 module error

interface Range {
  color: string;
  range: [number, number];
  category: string;
}

interface RecentValuesCardProps {
  stationData: any[];
  timeSeriesData: Record<string, { timestamp: string; value: number }[]>;
}

const RecentValuesCard: React.FC<RecentValuesCardProps> = ({ stationData, timeSeriesData }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<any>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchAndUpdate = async () => {
      if (!stationData || stationData.length === 0) return;

      const allMeasurements = stationData
        .flatMap((station: any) => station.children || [])
        .flatMap((child: any) =>
          (child.measurements || []).map((m: any) => ({
            ...m,
            instrument_id: child.id,
          }))
        );

      const firstFeatureMeasure = allMeasurements.find((m: any) => {
        return m.feature_measure && m.instrument_id && Array.isArray(m.ranges) && m.ranges.length > 0;
      });

      if (!firstFeatureMeasure) return;

      try {
        const url = `http://129.82.30.24:8001/latest_measurement/${firstFeatureMeasure.instrument_id}/60/`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
        const raw = await response.json();
        const latestEntry = Array.isArray(raw) ? raw[0] : raw;
        const parsed = JSON.parse(latestEntry.data || '{}');

        const latestValue = parsed[firstFeatureMeasure.name] ?? 0;

        setSelectedVariable({
          ...firstFeatureMeasure,
          latest_value: latestValue,
        });
        setHasData(true);
      } catch (err) {
        console.error('Error fetching latest measurement:', err);
      }
    };

    fetchAndUpdate();
    intervalId = setInterval(fetchAndUpdate, 300000);
    return () => clearInterval(intervalId);
  }, [stationData]);

const GaugeDial: React.FC<{ value: number; ranges: Range[] }> = ({ value, ranges }) => {
  const ref = React.useRef<SVGSVGElement>(null);
  const sortedRanges = [...ranges].sort((a, b) => a.range[0] - b.range[0]);

  useEffect(() => {
    if (!ref.current || sortedRanges.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const width = 300;
    const height = 180;
    const centerX = width / 2;
    const centerY = height * 0.9;
    const radius = 100;

    const startAngleDeg = -90;
    const endAngleDeg = 90;
    const totalAngle = (endAngleDeg - startAngleDeg) * (Math.PI / 180);
    const arcCount = sortedRanges.length;
    const arcSpan = totalAngle / arcCount;

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
          startAngle,
          endAngle,
          innerRadius: radius - 25,
          outerRadius: radius,
        })!)
        .attr('fill', r.color || '#ccc')
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5);
    });

    const scale = d3.scaleLinear()
      .domain([sortedRanges[0].range[0], sortedRanges[sortedRanges.length - 1].range[1]])
      .range([startAngleDeg * (Math.PI / 180), endAngleDeg * (Math.PI / 180)]);

    const valueAngle = scale(value);
    const needleLength = radius - 30;
    const x2 = centerX + Math.cos(valueAngle) * needleLength;
    const y2 = centerY + Math.sin(valueAngle) * needleLength;

    svg.append('line')
      .attr('x1', centerX)
      .attr('y1', centerY)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', '#333')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round');

    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 6)
      .attr('fill', '#333');

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

  return <svg ref={ref} width={300} height={180}></svg>;
};

const handleVariableSelect = (variable: any) => {
  const series = timeSeriesData[variable.name] || [];
  const latest = series.length > 0 ? series[series.length - 1].value : 0;

  setSelectedVariable({
    ...variable,
    latest_value: latest,
  });
  setModalOpen(false);
};

if (!hasData) {
  return (
    <div className="recent-values-wrapper">
      <div className="card recent-values-card">
        <div className="card-body">
          <p>Loading data...</p>
        </div>
      </div>
    </div>
  );
}

const latestValue = selectedVariable?.latest_value || 0;
const ranges: Range[] = selectedVariable?.ranges || [];

const unitAbbreviations: Record<string, string> = {
  'parts-per-million': 'ppm',
  'parts-per-billion': 'ppb',
  'degrees-celsius': '°C',
  'micrograms-per-cubic-meter': 'µg/m³',
  'milligrams-per-liter': 'mg/L',
  // Add more as needed
};

return (
  <div className="recent-values-wrapper">
    <div className="card recent-values-card">
      <div className="card-body">
        <button
          onClick={() => setModalOpen(true)}
          className="variable-button"
        >
          Change Variable
        </button>

        {selectedVariable && (
          <div className="selected-variable-display gauge-section">
            {ranges.length > 0 && <GaugeDial value={latestValue} ranges={ranges} />}

            {(() => {
              const match = [...ranges].sort((a, b) => a.range[0] - b.range[0]).find(
                (r) => latestValue >= r.range[0] && latestValue <= r.range[1]
              );
              return match ? (
                <p style={{ fontWeight: 'bold', color: '#000', marginTop: '1rem' }}>
                  {selectedVariable.name.charAt(0).toUpperCase() + selectedVariable.name.slice(1)}: {match.category}
                </p>
              ) : null;
            })()}

            <p style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.25rem' }}>
              {latestValue} {unitAbbreviations[selectedVariable.units] || selectedVariable.units || ''}
            </p>
          </div>
        )}

        <VariableModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirmSelection={handleVariableSelect}
          stationsOverride={
            stationData.map((station: any) => ({
              ...station,
              children: (station.children || []).map((child: any) => ({
                ...child,
                measurements: (child.measurements || []).filter((m: any) => m.feature_measure === true)
              }))
            }))
          }
        />
      </div>
    </div>
  </div>
);
};

export default RecentValuesCard;
