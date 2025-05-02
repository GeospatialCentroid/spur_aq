// src/App/Stack/Graph/Graph.tsx
import React from 'react';
import './Graph.css';
import Menu from './Components/Menu';
import ControlBar from './Components/ControlBar';
import Chart from './Components/Chart';

interface GraphProps {
  id: number;
  onRemove: () => void;
}

const Graph: React.FC<GraphProps> = ({ id, onRemove }) => (
  <div className="graph d-flex flex-column flex-md-row">
    <ControlBar onRemove={onRemove} className="order-1 order-md-3" />
    <Menu className="order-3 order-md-1" />
    <Chart id={id} className="order-2 order-md-2" />
  </div>
);

export default Graph;
