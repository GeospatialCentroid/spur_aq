// src/App/Stack/Graph/Components/Chart.tsx
import React from 'react';
import D3Chart from './Chart/D3Chart';
import DomainSlider from './Chart/DomainSlider';
import './Chart.css';

interface ChartProps {
  id: number;
  className?: string;
}

const Chart: React.FC<ChartProps> = ({ id, className = '' }) => (
  <div className={`graph-chart ${className}`}>
    <D3Chart id={id} />
    <DomainSlider/>
  </div>
);

export default Chart;


