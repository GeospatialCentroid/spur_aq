// File: src/App/Stack/Graph/Graph.tsx

/**
 * Graph component representing a single interactive graph panel in the UI.
 *
 * - Manages selected variables, date range, and interval for the chart.
 * - Builds API URLs to fetch measurement data based on selected settings.
 * - Displays a Menu for configuration, a Chart for visualization, and a ControlBar for controls.
 * - Supports toggling menu visibility and removing the graph from the stack.
 */

import React, { useEffect, useState } from 'react';
import './Graph.css';
import Menu from './Components/Menu';
import ControlBar from './Components/ControlBar';
import Chart from './Components/Chart';
import ExpandToggle from './Components/Menu/ExpandToggle';
import { useConfig } from '../../../context/ConfigContext';

/**
 * Props for the Graph component.
 *
 * @property id - Unique identifier for this Graph instance.
 * @property onRemove - Callback to remove this Graph from the stack.
 */
interface GraphProps {
  id: number;
  onRemove: () => void;
}

/**
 * Represents a single user-selected measurement variable.
 *
 * @property name - The variable name (e.g., "PM2.5").
 * @property stationId - ID of the station the variable comes from.
 * @property instrumentId - ID of the instrument recording the variable.
 */
type SelectedVariable = {
  name: string;
  stationId: number;
  instrumentId: number;
};

/**
 * A grouping of variables by instrument to optimize API calls.
 *
 * @property stationId - Shared station ID for the group.
 * @property instrumentId - Shared instrument ID.
 * @property variableNames - Array of variable names for this group.
 */
type VariableGroup = {
  stationId: number;
  instrumentId: number;
  variableNames: string[];
};

// --- Utility Functions ---

function getStartOfTodayOneWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getNow(): string {
  return new Date().toISOString();
}

function formatDateForUrl(dateString: string): string {
  const d = new Date(dateString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function buildApiUrl(
  stationId: number,
  variableNames: string[],
  instrumentId: number,
  startDate: string,
  endDate: string,
  interval: string
): string {
  const baseUrl = 'http://129.82.30.72:8001';
  const encodedStart = encodeURIComponent(formatDateForUrl(startDate));
  const encodedEnd = encodeURIComponent(formatDateForUrl(endDate));
  const variablePath = variableNames.join(',');
  return `${baseUrl}/measurement/${instrumentId}/measurements/${variablePath}/${interval}/?start=${encodedStart}&end=${encodedEnd}`;
}

function groupVariablesByInstrument(vars: SelectedVariable[]): VariableGroup[] {
  const map = new Map<string, VariableGroup>();

  vars.forEach((v) => {
    const key = `${v.stationId}:${v.instrumentId}`;
    if (!map.has(key)) {
      map.set(key, {
        stationId: v.stationId,
        instrumentId: v.instrumentId,
        variableNames: [],
      });
    }
    map.get(key)!.variableNames.push(v.name);
  });

  return Array.from(map.values());
}

// --- Graph Component ---

const Graph: React.FC<GraphProps> = ({ id, onRemove }) => {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const { config } = useConfig();

  const [fromDate, setFromDate] = useState<string>(getStartOfTodayOneWeekAgo());
  const [toDate, setToDate] = useState<string>(getNow());
  const [variables, setVariables] = useState<SelectedVariable[]>([]);
  const [interval, setInterval] = useState<string>('60');

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(10);

  useEffect(() => {
    console.log(`Graph ${id}: created`);
    return () => console.log(`Graph ${id}: removed`);
  }, [id]);

  useEffect(() => {
    if (variables.length === 0) return;

    const groups = groupVariablesByInstrument(variables);
    groups.forEach((group, index) => {
      const url = buildApiUrl(
        group.stationId,
        group.variableNames,
        group.instrumentId,
        fromDate,
        toDate,
        interval
      );
      console.log(`Graph ${id}: URL #${index + 1} = ${url}`);

      // Simulated data range for demo purposes
      const mockMin = -5;
      const mockMax = 120;
      setYMin(mockMin);
      setYMax(mockMax);
    });
  }, [variables, fromDate, toDate, interval, id]);

  const handleFromDateChange = (date: string) => setFromDate(date);
  const handleToDateChange = (date: string) => setToDate(date);
  const handleIntervalChange = (newInterval: string) => setInterval(newInterval);

  const handleVariableChange = (index: number, value: SelectedVariable) => {
    setVariables((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const addVariable = () => {
    setVariables((prev) => [
      ...prev,
      { name: '', stationId: 0, instrumentId: 0 },
    ]);
  };

  if (!config) return null;

  return (
    <div className="graph">
      {menuExpanded && (
        <Menu
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={handleFromDateChange}
          onToDateChange={handleToDateChange}
          variables={variables}
          onVariableChange={handleVariableChange}
          onAddVariable={addVariable}
          interval={interval}
          onIntervalChange={handleIntervalChange}
        />
      )}

      <ExpandToggle
        expanded={menuExpanded}
        onToggle={() => setMenuExpanded(!menuExpanded)}
      />

      <Chart
        id={id}
        fromDate={fromDate}
        toDate={toDate}
        interval={interval}
        yDomain={[yMin, yMax]}
      />

      <ControlBar onRemove={onRemove} />
    </div>
  );
};

export default Graph;
