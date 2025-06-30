// File: src/App/Stack/Graph/Components/Menu/IntervalSelector.tsx

/**
 * Dropdown selector for choosing the graph data interval.
 *
 * @property value - The currently selected interval.
 * @property onChange - Callback triggered when the interval changes.
 */

import React from 'react';

interface IntervalSelectorProps {
  value: string;
  onChange: (interval: string) => void;
}

const IntervalSelector: React.FC<IntervalSelectorProps> = ({ value, onChange }) => {
  return (
    <label className="interval-select-label">
      Interval:
      <select
        className="interval-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="1">1 minute</option>
        <option value="5">5 minutes</option>
        <option value="10">10 minutes</option>
        <option value="30">30 minutes</option>
        <option value="60">60 minutes</option>
      </select>
    </label>
  );
};

export default IntervalSelector;
