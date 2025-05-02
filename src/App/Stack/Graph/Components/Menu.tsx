// src/App/Stack/Graph/Components/Menu.tsx
import React from 'react';
import ExpandToggle from './Menu/ExpandToggle';
import './Menu.css'

interface MenuProps {
  className?: string;
}

const Menu: React.FC<MenuProps> = ({ className = '' }) => (
  <div className={`graph-menu ${className}`}>
    <ExpandToggle />
  </div>
);

export default Menu;

