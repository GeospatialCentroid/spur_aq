// src/App/Stack/Graph/Components/Menu.tsx
import React from 'react';
import './Menu.css';

interface MenuProps {
  className?: string;
}

const Menu: React.FC<MenuProps> = ({ className = '' }) => {

  return (
    <div className={`graph-menu ${className}`}>
      <div className="menu-content">
        {/* Your menu contents go here */}
        <p>Menu content goes here</p>
      </div>
    </div>
  );
};

export default Menu;