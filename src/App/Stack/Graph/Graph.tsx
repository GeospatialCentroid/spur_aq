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

type SelectedVariable = {
  name: string;
  stationId: number;
  instrumentId: number;
};

type VariableGroup = {
  stationId: number;
  instrumentId: number;
  variableNames: string[];
};

// Utility functions
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
  endDate: string
): string {
  const baseUrl = 'http://129.82.30.72:8001';
  const encodedStart = encodeURIComponent(formatDateForUrl(startDate));
  const encodedEnd = encodeURIComponent(formatDateForUrl(endDate));
  const variablePath = variableNames.join(',');
  return `${baseUrl}/measurement/${instrumentId}/measurements/${variablePath}/60/?start=${encodedStart}&end=${encodedEnd}`;
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

const Graph: React.FC<GraphProps> = ({ id, onRemove }) => {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const { config } = useConfig();

  const [fromDate, setFromDate] = useState<string>(getStartOfTodayOneWeekAgo());
  const [toDate, setToDate] = useState<string>(getNow());
  const [variables, setVariables] = useState<SelectedVariable[]>([]);

  // Lifecycle log
  useEffect(() => {
    console.log(`Graph ${id}: created`);
    return () => {
      console.log(`Graph ${id}: removed`);
    };
  }, [id]);

  // Generate one URL per compatible group of variables
  useEffect(() => {
    if (variables.length === 0) return;

    const groups = groupVariablesByInstrument(variables);
    groups.forEach((group, index) => {
      const url = buildApiUrl(group.stationId, group.variableNames, group.instrumentId, fromDate, toDate);
      console.log(`Graph ${id}: URL #${index + 1} = ${url}`);
      // Optionally: fetch(url) here
    });
  }, [variables, fromDate, toDate, id]);

  // Handlers
  const handleFromDateChange = (date: string) => {
    console.log(`Graph ${id}: fromDate set to ${date}`);
    setFromDate(date);
  };

  const handleToDateChange = (date: string) => {
    console.log(`Graph ${id}: toDate set to ${date}`);
    setToDate(date);
  };

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
