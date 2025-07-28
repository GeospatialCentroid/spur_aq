// File: src/App/Stack/Stack.tsx

/**
 * Renders a sortable, dynamic stack of Graph components.
 *
 * - Loads initial graph layout from the URL.
 * - Saves graph state back to the URL whenever changed.
 * - Allows adding, removing, and reordering graphs.
 * - Ensures stable ID rehydration using base36 encoding.
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
 * @property id - Unique numeric identifier for rendering and management.
 * @property state - Encoded state used for serialization and rehydration.
 */
interface GraphItem {
  id: number;
  state: EncodedGraphState;
}

const Stack: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nextIdRef = useRef(1); // Counter to ensure unique graph IDs

  /**
   * Initial hydration from the URL's `g` parameter.
   * Decodes encoded graph state list and reconstructs GraphItems with stable IDs.
   */
  const [graphs, setGraphs] = useState<GraphItem[]>(() => {
    const params = new URLSearchParams(location.search);
    const gParam = params.get('g');
    if (!gParam) return [];

    const decoded = decodeGraphList(gParam);
    const hydrated = decoded.map((state) => {
      // If the encoded ID is missing or unparsable, assign a new one
      let parsedId = parseInt(state.id || '', 36);
      if (isNaN(parsedId)) {
        parsedId = nextIdRef.current++;
        state.id = parsedId.toString(36);
      } else {
        nextIdRef.current = Math.max(nextIdRef.current, parsedId + 1);
      }

      return { id: parsedId, state };
    });

    return hydrated;
  });

  /**
   * Encodes and persists graph state to the URL whenever any graph changes.
   */
  useEffect(() => {
    const query = encodeGraphList(graphs.map((g) => g.state));
    const url = new URL(window.location.href);
    url.searchParams.set('g', query);
    navigate(url.pathname + url.search, { replace: true });
  }, [graphs, navigate]);

  /**
   * Adds a new graph with a default 7-day date range and empty variable selection.
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
   * Removes a graph from the stack by its unique ID.
   */
  const removeGraph = (id: number) => {
    setGraphs((g) => g.filter((item) => item.id !== id));
  };

  /**
   * Updates the encoded state of a specific graph, preserving its ID.
   */
  const updateGraphState = (id: number, newState: EncodedGraphState) => {
    setGraphs((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        return {
          ...g,
          state: {
            ...newState,
            id: newState.id || g.id.toString(36),
          },
        };
      })
    );
  };

  return (
    <div className="container-fluid py-4 d-flex flex-column stack-container">
      <ReactSortable
        list={graphs}
        setList={(newState) => setGraphs([...newState])}
        tag="div"
        className="graph-stack flex-grow-1"
        animation={150}
        handle=".drag-handle"
      >
        {graphs.map((item) => (
          <div key={`graph-${item.id}`} className="graph-wrapper">
            <Graph
              id={item.id}
              initialState={item.state}
              onStateChange={(id, state) => updateGraphState(item.id, state)}
              onRemove={() => removeGraph(item.id)}
            />
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
