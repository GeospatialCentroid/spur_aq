// File: src/App/Stack/Graph/Components/ControlBar/CloseButton.tsx

/**
 * CloseButton component
 *
 * - Renders a button with an "X" icon to remove a graph from the stack.
 * - Triggers the `onClick` callback when pressed.
 */

import React from 'react';
import { X } from 'react-bootstrap-icons';
import './CloseButton.css';

/**
 * Props for the CloseButton component.
 *
 * @property onClick - Callback function triggered when the button is clicked.
 */
interface CloseButtonProps {
  onClick: () => void;
}

/**
 * A simple button for deleting/removing a graph panel from the UI.
 */
const CloseButton: React.FC<CloseButtonProps> = ({ onClick }) => (
  <button className="delete-btn" onClick={onClick} aria-label="Remove graph">
    <X />
  </button>
);

export default CloseButton;
