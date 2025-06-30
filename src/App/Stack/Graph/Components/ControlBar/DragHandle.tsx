// File: src/App/Stack/Graph/Components/ControlBar/DragHandle.tsx

/**
 * DragHandle component
 *
 * - Renders a vertical grip icon used for reordering graph panels via drag-and-drop.
 * - Meant to be used in combination with a sortable container like ReactSortable.
 * - The `drag-handle` class allows it to be recognized by the `handle` prop in sorting.
 */

import React from 'react';
import { GripVertical } from 'react-bootstrap-icons';
import './DragHandle.css';

/**
 * A visual handle element that allows the graph to be dragged to reorder.
 */
const DragHandle: React.FC = () => (
  <div className="drag-handle" aria-label="Drag graph">
    <GripVertical />
  </div>
);

export default DragHandle;
