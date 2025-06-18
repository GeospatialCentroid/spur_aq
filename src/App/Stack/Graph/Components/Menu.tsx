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
}) => {
  return (
    <div className={`graph-menu ${className}`}>
      <div className="menu-content">
        <div className="dt-button-group">
          <DateSelector value={fromDate} onChange={onFromDateChange} />
          <DateSelector value={toDate} onChange={onToDateChange} />
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
