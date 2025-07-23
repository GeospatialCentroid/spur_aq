// File: src/App/Stack/Graph/Graph.tsx

/**
 * Graph component representing a single interactive graph panel in the UI.
 *
 * - Manages selected variables, date range, interval, and "update live" flag for the chart.
 * - Builds API URLs to fetch measurement data based on selected settings.
 * - Displays a Menu for configuration, a Chart for visualization, and a ControlBar for controls.
 * - Supports toggling menu visibility, removing the graph, and zooming via a DomainSlider.
 * - Emits compact state to parent when relevant settings change.
 */

import React, { useRef, useState } from 'react';
import './Graph.css';
import Menu from './Components/Menu';
import ControlBar from './Components/ControlBar';
import Chart from './Components/Chart';
import ExpandToggle from './Components/Menu/ExpandToggle';
import { useConfig } from '../../../context/ConfigContext';
import { EncodedGraphState } from './graphStateUtils';
import { getStartOfTodayOneWeekAgo, getNow } from './graphDateUtils';
import { syncDateRange, validateSliderRange } from './graphHandlers';
import { useHydrateInitialVariables, useEmitGraphState, useClampDomainEffect, useFetchChartData } from './graphHooks';
import { SelectedVariable } from './graphTypes';

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
  const [updateLive, setUpdateLive] = useState<boolean>(initialState?.updateLive ?? false);

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(1);
  const [chartData, setChartData] = useState<{ [key: string]: string }[]>([]);

  const [domain, setDomain] = useState<[number, number]>([new Date(fromDate).getTime(), new Date(toDate).getTime()]);
  const [selection, setSelection] = useState<[number, number]>(initialState?.selection || domain);

  const lastEmitted = useRef<string>('');
  const lastFetchKey = useRef<string>('');

  /** Hydrate variables from initial state if provided */
  useHydrateInitialVariables(initialState, setVariables);

  /** Emit compact state only when values actually change */
  useEmitGraphState({
    id,
    variables,
    fromDate,
    toDate,
    interval,
    selection,
    onStateChange,
    lastEmitted,
    updateLive,
  });

  /** Validate and clamp domain/selection on date change */
  useClampDomainEffect(fromDate, toDate, domain, setDomain, setSelection);

  /** Fetch chart data only when dependencies change meaningfully */
  useFetchChartData({
    id,
    variables,
    fromDate,
    toDate,
    interval,
    setChartData,
    setYMin,
    setYMax,
    lastFetchKey,
  });

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
            updateLive={updateLive}
            onUpdateLiveChange={setUpdateLive}
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
