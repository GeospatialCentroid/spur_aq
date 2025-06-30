// File: src/App/Stack/Stack.tsx

/**
 * Renders a sortable, dynamic stack of Graph components.
 *
 * Users can add new graphs, remove existing ones, and reorder them via drag-and-drop.
 */

import React, { useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import './Stack.css';
import Graph from './Graph/Graph';
import { Plus } from 'react-bootstrap-icons';

/**
 * Represents a single graph item in the stack.
 *
 * @property id - Unique identifier used to track and render each graph.
 */
interface GraphItem {
  id: number;
}

let nextGraphId = 1; // Stable, incrementing ID outside the component to ensure uniqueness

/**
 * Stack component that manages and displays a sortable list of Graph components.
 *
 * - Allows users to add and remove graphs.
 * - Maintains internal state for the list of graph IDs.
 * - Uses ReactSortable to support drag-and-drop reordering.
 */
const Stack: React.FC = () => {
  const [graphs, setGraphs] = useState<GraphItem[]>([]); // State: list of graphs currently rendered

  /**
   * Adds a new Graph to the stack with a unique ID.
   */
  const addGraph = () => {
    setGraphs(g => [...g, { id: nextGraphId++ }]);
  };

  /**
   * Removes a Graph from the stack by ID.
   *
   * @param id - The ID of the Graph to remove.
   */
  const removeGraph = (id: number) => {
    setGraphs(g => g.filter(item => item.id !== id));
  };

  return (
    // Main container for the graph stack UI
    <div className="container-fluid py-4 d-flex flex-column stack-container">

      {/* 
      Sortable container for the list of Graph components.
      - `list` provides the current array of graph items.
      - `setList` updates the state when reordered.
      - `handle=".drag-handle"` enables drag functionality on elements with that class.
    */}
      <ReactSortable
        list={graphs}
        setList={(newState) => setGraphs([...newState])}
        tag="div"
        className="graph-stack flex-grow-1"
        animation={150}
        handle=".drag-handle"
      >
        {/* 
        Render each Graph inside a wrapper div.
        Each Graph receives:
        - `id`: the unique identifier.
        - `onRemove`: a callback to remove it from the stack.
      */}
        {graphs.map(item => (
          <div key={item.id} className="graph-wrapper">
            <Graph
              id={item.id}
              onRemove={() => removeGraph(item.id)}
            />
          </div>
        ))}
      </ReactSortable>

      {/* 
      Button to add a new Graph to the stack.
      - Calls `addGraph` when clicked.
      - Uses Bootstrap and an icon for visual styling.
    */}
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
