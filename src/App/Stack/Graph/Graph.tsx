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
import { useEmitGraphState, useClampDomainEffect, useFetchChartData, useLiveChartUpdates } from './graphHooks';
import { SelectedMeasurement, createBlankMeasurement } from './graphTypes';

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
  const [loading, setLoading] = useState(true);
  const { config } = useConfig();

  const [fromDate, setFromDate] = useState<string>(initialState?.fromDate || getStartOfTodayOneWeekAgo());
  const [toDate, setToDate] = useState<string>(initialState?.toDate || getNow());
  const [variables, setVariables] = useState<SelectedMeasurement[]>(
    (initialState?.variableNames || []).map((name) => ({
      ...createBlankMeasurement(),
      name,
      stationId: initialState?.stationId ?? 0,
      instrumentId: initialState?.instrumentId ?? 0,
    }))
  );
  const [interval, setInterval] = useState<string>(initialState?.interval || '60');

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(1);
  const [chartData, setChartData] = useState<{ [key: string]: string }[]>([]);

  const [domain, setDomain] = useState<[number, number]>([new Date(fromDate).getTime(), new Date(toDate).getTime()]);
  const [selection, setSelection] = useState<[number, number]>(initialState?.selection || domain);

  const lastEmitted = useRef<string>('');
  const lastFetchKey = useRef<string>('');

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
  });

  /** Validate and clamp domain/selection on date change */
  useClampDomainEffect(fromDate, toDate, setDomain, setSelection);

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
    setLoading,
  });

  useLiveChartUpdates({
  variables,
  interval,
  chartData,
  setChartData,
  isLive: !toDate,
  setDomain
});

  // --- Handlers ---

const handleFromDateChange = (newFromDate: string) => {
  if (!toDate || !newFromDate) {
    // live mode or invalid: just set as-is
    setFromDate(newFromDate);
    return;
  }

  const [from, to] = syncDateRange(newFromDate, toDate, true);
  setFromDate(from);
  setToDate(to);
};

const handleToDateChange = (newToDate: string) => {
  if (!newToDate || !fromDate) {
    // live mode or invalid: just set as-is
    setToDate(newToDate);
    return;
  }

  const [from, to] = syncDateRange(fromDate, newToDate, false);
  setFromDate(from);
  setToDate(to);
};


  const handleSliderChange = (range: [number, number]) => {
    const validated = validateSliderRange(range);
    if (validated) setSelection(validated);
  };

  const handleIntervalChange = (newInterval: string) => setInterval(newInterval);

  const handleVariableChange = (index: number, value: SelectedMeasurement) => {
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
    setVariables((prev) => [...prev, { ...createBlankMeasurement() }]);
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

          />
        </div>
      )}

      <div className="graph-expand-toggle">
        <ExpandToggle
          expanded={menuExpanded}
          onToggle={() => setMenuExpanded(  !menuExpanded)}
        />
      </div>

     <div className="graph-chart position-relative" >
            {loading && (
            <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 9999  }}>
              <div className="spinner-border text-dark" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
        )}



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
          selectedMeasurements={variables}
        />
      </div>

      <div className="graph-control-bar">
        <ControlBar onRemove={onRemove} />
      </div>

    </div>
  );
};

export default React.memo(Graph);