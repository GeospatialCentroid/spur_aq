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
// Helper methods:

//Returns midnight 7 days ago from the users current time
function getStartOfTodayOneWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
//Returns the UTC Time at this very moment
function getNow(): string {
  return new Date().toISOString();
}
//Builds and returns the API Url from user selections
function buildApiUrl(
  stationId: number,
  variableNames: string[],
  instrumentId: number,
  startDate: string,
  endDate: string
): string {
  const baseUrl = 'http://129.82.30.72:8001/stations/';
  const encodedStart = encodeURIComponent(startDate);
  const encodedEnd = encodeURIComponent(endDate);
  const variablePath = variableNames.join(',');
  return `${baseUrl}/measurement/${stationId}/measurements/${variablePath}/${instrumentId}/?start=${encodedStart}&end=${encodedEnd}`;
}

const Graph: React.FC<GraphProps> = ({ id, onRemove }) => {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const { config } = useConfig();

  const [fromDate, setFromDate] = useState<string>(getStartOfTodayOneWeekAgo());
  const [toDate, setSecondDate] = useState<string>(getNow());
  const [firstVariable, setFirstVariable] = useState<string>('');
  const [secondVariable, setSecondVariable] = useState<string>('');

  useEffect(() => {
    console.log(`Graph ${id}: created`);
    return () => {
      console.log(`Graph ${id}: removed`);
    };
  }, [id]);

  useEffect(() => {
    if (!firstVariable && !secondVariable) return;
    const variables = [firstVariable, secondVariable].filter(Boolean);
    const stationId = 5;     // Replace with real value if needed
    const instrumentId = 1;  // Replace with real value if needed

    const url = buildApiUrl(stationId, variables, instrumentId, fromDate, toDate);
    console.log(`Graph ${id}: API URL = ${url}`);
    // You can optionally fetch here
  }, [firstVariable, secondVariable, fromDate, toDate, id]);

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
