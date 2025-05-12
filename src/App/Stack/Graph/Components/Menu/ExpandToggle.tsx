// src/App/Stack/Graph/Components/Menu/ExpandToggle.tsx
import React from 'react';
import './ExpandToggle.css';

interface ExpandToggleProps {
    expanded: boolean;
    onToggle: () => void;
    className?: string;
}

export default function ExpandToggle({ expanded, onToggle }: ExpandToggleProps) {
    return (
        <button className="expand-toggle" onClick={onToggle}>
            {expanded ? '<<' : '>>'}
        </button>
    );
}
