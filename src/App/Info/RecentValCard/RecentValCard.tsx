// File: src/App/Info/RecentValCard/RecentValCard.tsx

import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import VariableModal from '../../Stack/Graph/Components/Menu/VariableModal/VariableModal';
import './RecentValCard.css';

interface Range {
  color: string;
  range: [number, number];
  category: string;
}

interface RecentValuesCardProps {
  stationData: any[]; // full station dataset (with children and measurements)
  timeSeriesData: Record<string, { timestamp: string; value: number }[]>;
}

const GaugeDial: React.FC<{ value: number; ranges: Range[] }> = ({ value, ranges }) => {
  const ref = React.useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const width = 200;
    const height = 120;
    const centerX = width / 2;
    const centerY = height;
    const radius = 80;

    const arc = d3.arc()
      .innerRadius(radius - 15)
      .outerRadius(radius);

    const min = ranges[0].range[0];
    const max = ranges[ranges.length - 1].range[1];

    const angleScale = d3.scaleLinear().domain([min, max]).range([-Math.PI / 2, Math.PI / 2]);

    ranges.forEach((r) => {
      const startAngle = angleScale(r.range[0]);
      const endAngle = angleScale(r.range[1]);
      svg
        .append('path')
        .datum({ startAngle, endAngle })
        .attr('transform', `translate(${centerX},${centerY})`)
        .attr('d', arc as any)
        .attr('fill', r.color);
    });

    const needleAngle = angleScale(value);
    const needleLen = radius - 15;
    svg
      .append('line')
      .attr('x1', centerX)
      .attr('y1', centerY)
      .attr('x2', centerX + Math.cos(needleAngle) * needleLen)
      .attr('y2', centerY + Math.sin(needleAngle) * needleLen)
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    svg
      .append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 4)
      .attr('fill', 'black');
  }, [value, ranges]);

  return <svg ref={ref} width={200} height={120}></svg>;
};

const RecentValuesCard: React.FC<RecentValuesCardProps> = ({ stationData, timeSeriesData }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<any>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (stationData && stationData.length > 0) {
      setHasData(true);

      const firstFeatureMeasure = stationData
        .flatMap(station => station.children || [])
        .flatMap(child => child.measurements || [])
        .find(m => m.feature_measure && m.ranges);

      if (firstFeatureMeasure) {
        const series = timeSeriesData[firstFeatureMeasure.name] || [];
        const latest = series.length > 0 ? series[series.length - 1].value : 0;

        setSelectedVariable({ ...firstFeatureMeasure, latest_value: latest });
      }
    }
  }, [stationData, timeSeriesData]);

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
      <div className="recent-values-card">
        <p>Loading data...</p>
      </div>
    );
  }

  const latestValue = selectedVariable?.latest_value || 0;
  const ranges: Range[] = selectedVariable?.ranges || [];

  return (
    <div className="col-md-4">
      <div className="card h-100">
        <div className="card-body">
          <button onClick={() => setModalOpen(true)} className="open-variable-modal-button">
            {selectedVariable ? `Change Variable (${selectedVariable.name})` : 'Select a Variable'}
          </button>

          {selectedVariable && (
            <div className="selected-variable-display mt-3">
              <p><strong>Selected:</strong> {selectedVariable.name}</p>
              {selectedVariable.units && <p><strong>Units:</strong> {selectedVariable.units}</p>}
              {selectedVariable.description && (
                <div className="variable-description" dangerouslySetInnerHTML={{ __html: selectedVariable.description }} />
              )}
              {ranges.length > 0 && <GaugeDial value={latestValue} ranges={ranges} />}
            </div>
          )}

          <VariableModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirmSelection={handleVariableSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default RecentValuesCard;
