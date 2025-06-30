// File: src/App/Stack/Graph/Components/ControlBar.tsx

/**
 * ControlBar component for a graph panel.
 *
 * - Contains a drag handle to allow reordering the graph in the stack.
 * - Contains a close button to remove the graph from the stack.
 * - Adjusts layout direction based on screen size using Bootstrap utility classes.
 */

import React from 'react';
import CloseButton from './ControlBar/CloseButton';
import DragHandle from './ControlBar/DragHandle';
import './ControlBar.css';

/**
 * Props for the ControlBar component.
 *
 * @property onRemove - Callback function to remove the graph.
 * @property className - Optional extra class to apply to the control bar.
 */
interface ControlBarProps {
  onRemove: () => void;
  className?: string;
}

/**
 * Renders a vertical or horizontal bar with a drag handle and a close button.
 */
const ControlBar: React.FC<ControlBarProps> = ({ onRemove, className = '' }) => (
  <div className={`graph-control-bar d-flex flex-row flex-md-column ${className}`}>
    {/* Drag handle to support reordering via ReactSortable */}
    <div className="drag-handle order-1 order-md-2">
      <DragHandle />
    </div>

    {/* Close button to remove the graph */}
    <div className="delete-btn order-2 order-md-1">
      <CloseButton onClick={onRemove} />
    </div>
  </div>
);

export default ControlBar;
