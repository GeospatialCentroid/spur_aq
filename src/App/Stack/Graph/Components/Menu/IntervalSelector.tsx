// File: src/App/Stack/Graph/Components/Menu/IntervalSelector.tsx

/**
 * Dropdown selector for choosing the graph data interval.
 *
 * @property value - The currently selected interval.
 * @property onChange - Callback triggered when the interval changes.
 */

import React from 'react';
import './IntervalSelector.css'
import { useMode } from '../../../../../context/ModeContext'; // adjust the path


interface IntervalSelectorProps {
  value: string;
  onChange: (interval: string) => void;
}

const IntervalSelector: React.FC<IntervalSelectorProps> = ({ value, onChange }) => {
 const { mode } = useMode();
  return (
    <select
      className="interval-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {mode === 'researcher' && <option value="0">Raw Data</option>}
      <option value="1">1 minute</option>
      <option value="5">5 minutes</option>
      <option value="10">10 minutes</option>
      <option value="60">60 minutes</option>
    </select>
  );
};

export default IntervalSelector;
