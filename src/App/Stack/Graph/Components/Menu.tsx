// src/App/Stack/Graph/Components/Menu.tsx
import React from 'react';
import './Menu.css';
import DateSelector from './Menu/DateSelector';
import VariableSelector from './Menu/VariableSelector';

interface MenuProps {
  className?: string;
  firstDate: string;
  onFirstDateChange: (date: string) => void;
  secondDate: string;
  onSecondDateChange: (date: string) => void;
  firstVariable: string;
  onFirstVariableChange: (label: string) => void;
  secondVariable: string;
  onSecondVariableChange: (label: string) => void;
}

const Menu: React.FC<MenuProps> = ({
  className = '',
  firstDate,
  onFirstDateChange,
  secondDate,
  onSecondDateChange,
  firstVariable,
  onFirstVariableChange,
  secondVariable,
  onSecondVariableChange,
}) => {
  return (
    <div className={`graph-menu ${className}`}>
      <div className="menu-content">
        <div className="dt-button-group">
          <DateSelector value={firstDate} onChange={onFirstDateChange} />
          <DateSelector value={secondDate} onChange={onSecondDateChange} />
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
