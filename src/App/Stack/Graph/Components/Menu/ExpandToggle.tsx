// File: src/App/Stack/Graph/Components/Menu/ExpandToggle.tsx

/**
 * ExpandToggle component
 *
 * - Renders a toggle button for collapsing or expanding the menu panel.
 * - Displays "<<" when expanded, and ">>" when collapsed.
 */

import React from 'react';
import './ExpandToggle.css';

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
export default function ExpandToggle({ expanded, onToggle }: ExpandToggleProps) {
  return (
    <button className="expand-toggle" onClick={onToggle}>
      {expanded ? '<<' : '>>'}
    </button>
  );
}
