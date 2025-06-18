// src/App/Stack/Graph/Components/Menu.tsx

import React from 'react';
import './Menu.css';
import DateSelector from './Menu/DateSelector';
import VariableSelector from './Menu/VariableSelector';

interface SelectedVariable {
  name: string;
  stationId: number;
  instrumentId: number;
}

interface MenuProps {
  className?: string;
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  variables: SelectedVariable[];
  onVariableChange: (index: number, v: SelectedVariable) => void;
  onAddVariable: () => void;
  interval: string;
  onIntervalChange: (interval: string) => void;
}

const Menu: React.FC<MenuProps> = ({
  className = '',
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  variables,
  onVariableChange,
  onAddVariable,
  interval,
  onIntervalChange,
}) => {
  return (
    <div className={`graph-menu ${className}`}>
      <div className="menu-content">
        <div className="dt-button-group">
          <DateSelector value={fromDate} onChange={onFromDateChange} />
          <DateSelector value={toDate} onChange={onToDateChange} />

          <label className="interval-select-label">
            Interval:
            <select
              className="interval-select"
              value={interval}
              onChange={(e) => onIntervalChange(e.target.value)}
            >
              <option value="1">1 minute</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </label>
        </div>

        <div className="variable-button-group">
          {variables.map((v, i) => (
            <VariableSelector
              key={i}
              value={v}
              onChange={(val) => onVariableChange(i, val)}
            />
          ))}

          <button className="add-variable-button" onClick={onAddVariable}>
            + Add Variable
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
