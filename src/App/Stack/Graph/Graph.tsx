// src/App/Stack/Graph/Graph.tsx
import React, { useState } from 'react';
import './Graph.css';
import Menu from './Components/Menu';
import ControlBar from './Components/ControlBar';
import Chart from './Components/Chart';
import ExpandToggle from './Components/Menu/ExpandToggle';
import { useConfig } from '../../../context/ConfigContext';

interface GraphProps {
  id: number;
  onRemove: () => void;
}

const Graph: React.FC<GraphProps> = ({ id, onRemove }) => {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const { config } = useConfig();

  // Lifted state for dates and variables
  const [firstDate, setFirstDate] = useState<string>('');
  const [secondDate, setSecondDate] = useState<string>('');
  const [firstVariable, setFirstVariable] = useState<string>('');
  const [secondVariable, setSecondVariable] = useState<string>('');

  if (!config) return null;

  return (
    <div className="graph">
      {menuExpanded && (
        <Menu
          firstDate={firstDate}
          onFirstDateChange={setFirstDate}
          secondDate={secondDate}
          onSecondDateChange={setSecondDate}
          firstVariable={firstVariable}
          onFirstVariableChange={setFirstVariable}
          secondVariable={secondVariable}
          onSecondVariableChange={setSecondVariable}
        />
      )}
      <ExpandToggle
        expanded={menuExpanded}
        onToggle={() => setMenuExpanded(!menuExpanded)}
      />
      <Chart id={id} />
      <ControlBar onRemove={onRemove} />
    </div>
  );
};

export default Graph;
