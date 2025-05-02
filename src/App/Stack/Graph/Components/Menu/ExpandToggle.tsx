<<<<<<< HEAD
// src/App/Stack/Graph/Components/Menu/ExpandToggle.tsx
import React, { useState } from 'react';
import './ExpandToggle.css';

const ExpandToggle: React.FC = () => {
    const [expanded, setExpanded] = useState(false);

    const toggle = () => setExpanded(prev => !prev);

    return (
        <button className="expand-toggle btn btn-sm btn-secondary" onClick={toggle}>
            {expanded ? 'Collapse Menu ▲' : 'Expand Menu ▼'}
        </button>
    );
};

export default ExpandToggle;
=======
import React from 'react';
>>>>>>> 109625fd710ed2f1da22c0818b3b36a61a34e628
