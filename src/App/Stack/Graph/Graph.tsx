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

/** Props for the Graph component */
interface GraphProps {
  id: number;
  onRemove: () => void;
}

/** User-selected variable (station, instrument, and variable name) */
type SelectedVariable = {
  name: string;
  stationId: number;
  instrumentId: number;
};

/** Groups variables by instrument for efficient API requests */
type VariableGroup = {
  stationId: number;
  instrumentId: number;
  variableNames: string[];
};

/** Utility: Get ISO string for midnight one week ago today */
function getStartOfTodayOneWeekAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Utility: Get ISO string for current time */
function getNow(): string {
  return new Date().toISOString();
}

/** Utility: Format a date for the API URL */
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

/** Utility: Build a fully encoded API URL for measurements */
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

/** Utility: Group selected variables by station/instrument pair */
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

/** Main component representing one full graph unit */
const Graph: React.FC<GraphProps> = ({ id, onRemove }) => {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const { config } = useConfig();

  const [fromDate, setFromDate] = useState<string>(getStartOfTodayOneWeekAgo());
  const [toDate, setToDate] = useState<string>(getNow());
  const [variables, setVariables] = useState<SelectedVariable[]>([]);
  const [interval, setInterval] = useState<string>('60');

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(10);
  const [chartData, setChartData] = useState<any[]>([]);

  // Track lifecycle for logging
  useEffect(() => {
    console.log(`Graph ${id}: created`);
    return () => console.log(`Graph ${id}: removed`);
  }, [id]);

  /**
   * Trigger API fetch when variables, dates, or interval change.
   * Skips fetch if any variable is incomplete.
   */
  useEffect(() => {
    if (
      variables.length === 0 ||
      variables.some(v => !v.name || v.stationId === 0 || v.instrumentId === 0)
    ) {
      return;
    }

    const groups = groupVariablesByInstrument(variables);

    groups.forEach(async (group, index) => {
      const url = buildApiUrl(
        group.stationId,
        group.variableNames,
        group.instrumentId,
        fromDate,
        toDate,
        interval
      );
      console.log(`Graph ${id}: URL #${index + 1} = ${url}`);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();

        console.log(`Graph ${id}: Data received`, data);
        setChartData(data);

        const values = Object.values(data).flatMap((series: any) =>
          Array.isArray(series) ? series.map((d: any) => d.value) : []
        );
        const min = Math.min(...values);
        const max = Math.max(...values);
        setYMin(min);
        setYMax(max);
      } catch (error) {
        console.error(`Graph ${id}: Failed to fetch data`, error);
      }
    });
  }, [variables, fromDate, toDate, interval, id]);

  // --- Event Handlers ---
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

  // --- Render ---
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
