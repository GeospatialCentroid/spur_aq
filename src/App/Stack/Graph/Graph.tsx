// Graph.tsx
import React from 'react';
import './Graph.css';

interface GraphProps {
  id: number;
}

const Graph: React.FC<GraphProps> = ({ id }) => (
  <div className="graph-container">
    <h2>Graph #{id}</h2>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nec tellus metus.</p>
  </div>
);

export default Graph;
