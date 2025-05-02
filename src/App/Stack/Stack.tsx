// src/App/Stack/Stack.tsx
import React, { useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import './Stack.css';
import Graph from './Graph/Graph';
import { Plus } from 'react-bootstrap-icons';

interface GraphItem { id: number }

const Stack: React.FC = () => {
  const [graphs, setGraphs] = useState<GraphItem[]>([]);

  const addGraph = () => {
    setGraphs(g => [...g, { id: Date.now() }]);
  };

  const removeGraph = (id: number) => {
    setGraphs(g => g.filter(item => item.id !== id));
  };

  return (
    <div className="container-fluid py-4 d-flex flex-column stack-container">
      <ReactSortable
        list={graphs}
        setList={setGraphs}
        tag="div"
        className="graph-stack flex-grow-1"
        animation={150}
        handle=".drag-handle"
      >
        {graphs.map(item => (
          <div key={item.id} className="graph-wrapper">
            <Graph id={item.id} onRemove={() => removeGraph(item.id)} />
          </div>
        ))}
      </ReactSortable>

      <button
        type="button"
        className="btn btn-outline-primary align-self-center mt-4"
        onClick={addGraph}
      >
        <Plus /> Add Graph
      </button>
    </div>
  );
};

export default Stack;
