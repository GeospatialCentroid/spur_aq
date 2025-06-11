// src/App/Stack/Graph/Graph.tsx
import React, { useEffect, useState } from 'react';
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
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setSecondDate] = useState<string>('');
  const [firstVariable, setFirstVariable] = useState<string>('');
  const [secondVariable, setSecondVariable] = useState<string>('');

  useEffect(() => {
    console.log(`Graph ${id}: created`);
    return () => {
      console.log(`Graph ${id}: removed`);
    };
  }, [id]);

  const handleFromDateChange = (date: string) => {
    console.log(`Graph ${id}: fromDate set to ${date}`);
    setFromDate(date);
  };

  const handleToDateChange = (date: string) => {
    console.log(`Graph ${id}: toDate set to ${date}`);
    setSecondDate(date);
  };

  const handleFirstVariableChange = (value: string) => {
    console.log(`Graph ${id}: firstVariable set to ${value}`);
    setFirstVariable(value);
  };

  const handleSecondVariableChange = (value: string) => {
    console.log(`Graph ${id}: secondVariable set to ${value}`);
    setSecondVariable(value);
  };

  if (!config) return null;

  return (
    <div className="graph">
      {menuExpanded && (
        <Menu
          fromDate={fromDate}
          onFromDateChange={handleFromDateChange}
          toDate={toDate}
          onToDateChange={handleToDateChange}
          firstVariable={firstVariable}
          onFirstVariableChange={handleFirstVariableChange}
          secondVariable={secondVariable}
          onSecondVariableChange={handleSecondVariableChange}
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
