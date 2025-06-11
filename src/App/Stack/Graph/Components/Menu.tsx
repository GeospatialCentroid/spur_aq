// src/App/Stack/Graph/Components/Menu.tsx
import React from 'react';
import './Menu.css';
import DateSelector from './Menu/DateSelector';
import VariableSelector from './Menu/VariableSelector';

interface MenuProps {
  className?: string;
  fromDate: string;
  onFromDateChange: (date: string) => void;
  toDate: string;
  onToDateChange: (date: string) => void;
  firstVariable: string;
  onFirstVariableChange: (label: string) => void;
  secondVariable: string;
  onSecondVariableChange: (label: string) => void;
}

const Menu: React.FC<MenuProps> = ({
  className = '',
  fromDate,
  onFromDateChange: onFirstDateChange,
  toDate,
  onToDateChange: onSecondDateChange,
  firstVariable,
  onFirstVariableChange,
  secondVariable,
  onSecondVariableChange,
}) => {
  return (
    <div className={`graph-menu ${className}`}>
      <div className="menu-content">
        <div className="dt-button-group">
          <DateSelector value={fromDate} onChange={onFirstDateChange} />
          <DateSelector value={toDate} onChange={onSecondDateChange} />
        </div>
        <div className="variable-button-group">
          <VariableSelector value={firstVariable} onChange={onFirstVariableChange} />
          <VariableSelector value={secondVariable} onChange={onSecondVariableChange} />
        </div>
      </div>
    </div>
  );
};

export default Menu;
