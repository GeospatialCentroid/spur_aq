// src/App/Stack/Graph/Components/Menu.tsx
import React from 'react';
import './Menu.css';
import DTPicker from './Menu/DateSelector';
import VariableSelector from './Menu/VariableSelector';

interface MenuProps {
  className?: string;
}

const Menu: React.FC<MenuProps> = ({ className = '' }) => {
  return (
    <div className={`graph-menu ${className}`}>
      <div className="menu-content">
        <DTPicker />
        <div className="variable-button-group">
          <VariableSelector />
          <VariableSelector />
        </div>
      </div>
    </div>
  );
};

export default Menu;
