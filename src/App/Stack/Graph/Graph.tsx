// File: src/App/Stack/Graph/Graph.tsx

/**
 * Graph component representing a single interactive graph panel in the UI.
 *
 * - Manages selected variables, date range, and interval for the chart.
 * - Builds API URLs to fetch measurement data based on selected settings.
 * - Displays a Menu for configuration, a Chart for visualization, and a ControlBar for controls.
 * - Supports toggling menu visibility, removing the graph, and zooming via a DomainSlider.
 * - Emits compact state to parent when relevant settings change.
 */

import React, { useEffect, useRef, useState } from 'react';
import './Graph.css';
import Menu from './Components/Menu';
import ControlBar from './Components/ControlBar';
import Chart from './Components/Chart';
import ExpandToggle from './Components/Menu/ExpandToggle';
import { useConfig } from '../../../context/ConfigContext';
import { EncodedGraphState } from './GraphStateUtils';
import { buildApiUrl, groupVariablesByInstrument } from './graphApiUtils';
import { getStartOfTodayOneWeekAgo, getNow } from './graphDateUtils'
import { syncDateRange, validateSliderRange } from './graphHandlers';

/** Props for the Graph component */
interface GraphProps {
  id: number;
  onRemove: () => void;
  initialState?: EncodedGraphState;
  onStateChange?: (id: number, newState: EncodedGraphState) => void;
}

/** Main component representing one full graph unit */
const Graph: React.FC<GraphProps> = ({ id, onRemove, initialState, onStateChange }) => {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const { config } = useConfig();

  const [fromDate, setFromDate] = useState<string>(initialState?.fromDate || getStartOfTodayOneWeekAgo());
  const [toDate, setToDate] = useState<string>(initialState?.toDate || getNow());
  const [variables, setVariables] = useState<SelectedVariable[]>([]);
  const [interval, setInterval] = useState<string>(initialState?.interval || '60');

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(1);
  const [chartData, setChartData] = useState<{ [key: string]: string }[]>([]);

  const [domain, setDomain] = useState<[number, number]>([new Date(fromDate).getTime(), new Date(toDate).getTime()]);
  const [selection, setSelection] = useState<[number, number]>(initialState?.selection || domain);

  const lastEmitted = useRef<string>('');
  const lastFetchKey = useRef<string>('');

  /** Hydrate variables from initial state if provided */
  useEffect(() => {
    if (initialState && initialState.variableNames.length > 0) {
      setVariables(initialState.variableNames.map(name => ({
        name,
        stationId: initialState.stationId,
        instrumentId: initialState.instrumentId,
      })));
    }
  }, [initialState]);

  /** Emit compact state only when values actually change */
  useEffect(() => {
    if (!onStateChange) return;

    const state: EncodedGraphState = {
      id: id.toString(36),
      stationId: variables[0]?.stationId || 0,
      instrumentId: variables[0]?.instrumentId || 0,
      variableNames: variables.map(v => v.name),
      fromDate,
      toDate,
      interval,
      selection,
    };

    const key = JSON.stringify(state);
    if (key === lastEmitted.current) return;
    lastEmitted.current = key;

    onStateChange(id, state);
  }, [id, fromDate, toDate, interval, variables, selection, onStateChange]);

  // --- Handlers ---

  const handleFromDateChange = (newFromDate: string) => {
    const [from, to] = syncDateRange(newFromDate, toDate, true);
    setFromDate(from);
    setToDate(to);
  };

  const handleToDateChange = (newToDate: string) => {
    const [from, to] = syncDateRange(fromDate, newToDate, false);
    setFromDate(from);
    setToDate(to);
  };

  const handleSliderChange = (range: [number, number]) => {
    const validated = validateSliderRange(range);
    if (validated) setSelection(validated);
  };

  const handleIntervalChange = (newInterval: string) => setInterval(newInterval);

  const handleVariableChange = (index: number, value: SelectedVariable) => {
    setVariables((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleRemoveVariable = (index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariable = () => {
    setVariables((prev) => [...prev, { name: '', stationId: 0, instrumentId: 0 }]);
  };

  /** Validate and clamp domain/selection on date change */
  useEffect(() => {
    let start = new Date(fromDate).getTime();
    let end = new Date(toDate).getTime();

    if (start > end) [start, end] = [end, start];
    if (end - start < 60 * 1000) end = start + 60 * 1000;

    const newDomain: [number, number] = [start, end];
    setDomain(newDomain);

    setSelection(([selStart, selEnd]) => {
      const wasFullyZoomedOut = selStart === domain[0] && selEnd === domain[1];
      const clampedStart = Math.max(start, Math.min(end, selStart));
      const clampedEnd = Math.max(start, Math.min(end, selEnd));
      return (wasFullyZoomedOut || clampedEnd - clampedStart < 60 * 1000) ? [start, end] : [clampedStart, clampedEnd];
    });
  }, [fromDate, toDate]);

  /** Fetch chart data only when dependencies change meaningfully */
  useEffect(() => {
    if (
      variables.length === 0 ||
      variables.some(v => !v.name || v.stationId === 0 || v.instrumentId === 0)
    ) {
      setChartData([]);
      return;
    }

    const fetchKey = JSON.stringify({ variables, fromDate, toDate, interval });
    if (fetchKey === lastFetchKey.current) return;
    lastFetchKey.current = fetchKey;

    console.log(`Graph ${id}: Fetching new data due to state change`);

    const groups = groupVariablesByInstrument(variables);
    groups.forEach(async (group, index) => {
      const url = buildApiUrl(group.stationId, group.variableNames, group.instrumentId, fromDate, toDate, interval);
      console.log(`Graph ${id}: URL #${index + 1} = ${url}`);

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data = await response.json();
        console.log(`Graph ${id}: Data received`, data);

        setChartData(data);

        const values: number[] = [];
        data.forEach((row: Record<string, string>) => {
          Object.entries(row).forEach(([key, val]) => {
            if (key !== 'datetime') {
              const num = parseFloat(val);
              if (!isNaN(num)) values.push(num);
            }
          });
        });

        const min = Math.min(...values);
        const max = Math.max(...values);
        setYMin(isFinite(min) ? min : 0);
        setYMax(isFinite(max) ? max : 1);
      } catch (error) {
        console.error(`Graph ${id}: Failed to fetch data`, error);
      }
    });
  }, [variables, fromDate, toDate, interval, id]);

  if (!config) return null;

  return (
    <div className="graph">
      {menuExpanded && (
        <div className="graph-menu">
          <Menu
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={handleFromDateChange}
            onToDateChange={handleToDateChange}
            variables={variables}
            onVariableChange={handleVariableChange}
            onRemoveVariable={handleRemoveVariable}
            onAddVariable={addVariable}
            interval={interval}
            onIntervalChange={handleIntervalChange}
          />
        </div>
      )}

      <div className="graph-expand-toggle">
        <ExpandToggle
          expanded={menuExpanded}
          onToggle={() => setMenuExpanded(!menuExpanded)}
        />
      </div>

      <div className="graph-chart">
        <Chart
          id={id}
          fromDate={new Date(selection[0]).toISOString()}
          toDate={new Date(selection[1]).toISOString()}
          interval={interval}
          yDomain={[yMin, yMax]}
          chartData={chartData}
          domain={domain}
          selection={selection}
          onSliderChange={handleSliderChange}
        />
      </div>

      <div className="graph-control-bar">
        <ControlBar onRemove={onRemove} />
      </div>
    </div>
  );
};

export default React.memo(Graph);
