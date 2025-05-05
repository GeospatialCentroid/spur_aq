// src/App/Stack/Graph/Components/Chart.tsx
import React, { useState } from 'react';
import D3Chart from './Chart/D3Chart';
import DomainSlider from './Chart/DomainSlider';
import './Chart.css';

interface ChartProps {
  id: number;
  className?: string;
}

const Chart: React.FC<ChartProps> = ({ id, className = '' }) => {
  const fullDomain: [number, number] = [0, 10];
  const [selection, setSelection] = useState<[number, number]>([1, 3]);

  return (
    <div className={`graph-chart ${className}`}>
      <D3Chart id={id} selection={selection} />
      <DomainSlider
        domain={fullDomain}
        selection={selection}
        onChange={setSelection}
      />
    </div>
  );
};

export default Chart;
