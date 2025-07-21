// File: src/App/Stack/Graph/Components/Menu/ExpandToggle.tsx

import React from 'react';
import './ExpandToggle.css';
import { TriangleFill } from 'react-bootstrap-icons';

/**
 * Props for the ExpandToggle component.
 *
 * @property expanded - Indicates whether the menu is currently expanded.
 * @property onToggle - Callback triggered when the toggle button is clicked.
 * @property className - Optional additional CSS class for styling.
 */
interface ExpandToggleProps {
  expanded: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * A small toggle button for showing or hiding the graph configuration menu.
 */
export default function ExpandToggle({ expanded, onToggle, className }: ExpandToggleProps) {
  return (

    <button className="expand-toggle" onClick={onToggle}>
      <TriangleFill
        style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(270deg)' }}
      />
    </button>
  );
}
