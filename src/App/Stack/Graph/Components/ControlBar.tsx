// src/App/Stack/Graph/Components/ControlBar.tsx
import React from 'react';
import CloseButton from './ControlBar/CloseButton';
import DragHandle from './ControlBar/DragHandle';
import './ControlBar.css';

interface ControlBarProps {
  onRemove: () => void;
  className?: string;
}

const ControlBar: React.FC<ControlBarProps> = ({ onRemove, className = '' }) => (
  <div className={`graph-control-bar d-flex flex-row flex-md-column ${className}`}>
    <div className="drag-handle order-1 order-md-2">
      <DragHandle />
    </div>
    <div className="delete-btn order-2 order-md-1">
      <CloseButton onClick={onRemove} />
    </div>
  </div>
);

export default ControlBar;

