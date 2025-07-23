// File: src/App/Stack/Stack.tsx

/**
 * Renders a sortable, dynamic stack of Graph components.
 *
 * Users can add new graphs, remove existing ones, and reorder them via drag-and-drop.
 * Graph state is serialized into the URL to allow reloading the same layout later.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import { useNavigate, useLocation } from 'react-router-dom';
import './Stack.css';
import Graph from './Graph/Graph';
import { Plus } from 'react-bootstrap-icons';
import {
  EncodedGraphState,
  decodeGraphList,
  encodeGraphList,
} from './Graph/graphStateUtils';

/**
 * Internal item structure for each graph in the stack.
 *
 * @property id - Unique numeric identifier for rendering and managing the graph.
 * @property state - Serialized settings for this specific graph instance.
 */
interface GraphItem {
  id: number;
  state: EncodedGraphState;
}

/**
 * Stack component that manages and displays a sortable list of Graph components.
 *
 * - Loads initial graph layout from the URL.
 * - Saves graph state back to the URL whenever changed.
 * - Allows adding, removing, and reordering graphs.
 */
const Stack: React.FC = () => {
  const [graphs, setGraphs] = useState<GraphItem[]>([]);             // State: list of graph items with state
  const nextIdRef = useRef(1);                                       // Unique ID counter for new graphs

  const navigate = useNavigate();
  const location = useLocation();

  /**
   * On component mount, parse the URL to restore any previously saved graph layout.
   */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gParam = params.get('g');
    if (gParam) {
      const decoded = decodeGraphList(gParam);
      const restored = decoded.map((state) => ({
        id: nextIdRef.current++,
        state,
      }));
      setGraphs(restored);
    }
  }, []);

  /**
   * Whenever the graph layout or settings change, update the URL with the new state.
   */
  useEffect(() => {
    const query = encodeGraphList(graphs.map((g) => g.state));
    const url = new URL(window.location.href);
    url.searchParams.set('g', query);
    navigate(url.pathname + url.search, { replace: true });
  }, [graphs]);

  /**
   * Adds a new empty graph to the stack with default settings.
   */
  const addGraph = () => {
    const newId = nextIdRef.current++;
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const newGraph: GraphItem = {
      id: newId,
      state: {
        id: newId.toString(36),
        stationId: 0,
        instrumentId: 0,
        variableNames: [],
        fromDate: oneWeekAgo.toISOString(),
        toDate: now.toISOString(),
        interval: '60',
        selection: [oneWeekAgo.getTime(), now.getTime()],
      },
    };

    setGraphs((prev) => [...prev, newGraph]);
  };

  /**
   * Removes a graph from the stack.
   *
   * @param id - The graph ID to remove.
   */
  const removeGraph = (id: number) => {
    setGraphs((g) => g.filter((item) => item.id !== id));
  };

  /**
   * Updates the saved state of a single graph, triggering a URL update.
   *
   * @param id - The ID of the graph being updated.
   * @param newState - The new state to save.
   */
  const updateGraphState = (id: number, newState: EncodedGraphState) => {
    setGraphs((prev) =>
      prev.map((g) => (g.id === id ? { ...g, state: newState } : g))
    );
  };

  return (
    // Main container for the graph stack UI
    <div className="container-fluid py-4 d-flex flex-column stack-container">

      {/*
        Sortable container for the list of Graph components.
        - `list` provides the current array of graph items.
        - `setList` updates the state when reordered.
        - `handle=".drag-handle"` enables dragging by a specific part of the graph.
      */}
      <ReactSortable
        list={graphs}
        setList={(newState) => setGraphs([...newState])}
        tag="div"
        className="graph-stack flex-grow-1"
        animation={150}
        handle=".drag-handle"
      >
        {graphs.map((item) => (
          <div key={item.id} className="graph-wrapper">
            <Graph
              id={item.id}
              initialState={item.state}
              onStateChange={(id, state) => updateGraphState(item.id, state)}
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
