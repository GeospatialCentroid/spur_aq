// DragHandle.tsx
import React from 'react';
import { GripVertical } from 'react-bootstrap-icons';
import './DragHandle.css';

const DragHandle: React.FC = () => (
    <div className="drag-handle" aria-label="Drag graph">
        <GripVertical />
    </div>
);

export default DragHandle;
