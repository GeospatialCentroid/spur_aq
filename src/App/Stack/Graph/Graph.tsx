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
import { getStartOfTodayOneWeekAgoMountain } from './graphDateUtils';
import { syncDateRange, validateSliderRange } from './graphHandlers';
import {
  useEmitGraphState,
  useClampDomainEffect,
  useFetchChartData,
  useLiveChartUpdates,
} from './graphHooks';
import { SelectedMeasurement, createBlankMeasurement } from './graphTypes';
import { DateTime } from 'luxon';

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

  // Helper to find a measurement in config by name, stationId, and instrumentId
  function getMeasurementFromConfig(name: string, stationId: number, instrumentId: number) {
    if (!config) return undefined;
    const station = config.find((s) => s.id === stationId);
    if (!station) return undefined;
    const instrument = station.children.find((i) => i.id === instrumentId);
    if (!instrument || !instrument.measurements) return undefined;
    // Use case-insensitive comparison for name matching
    return instrument.measurements.find((m) => m.name.toLowerCase() === name.toLowerCase());
  }

  const [fromDate, setFromDate] = useState<string>(
    initialState?.fromDate || getStartOfTodayOneWeekAgoMountain() || ''
  );
  const [toDate, setToDate] = useState<string>(initialState?.toDate || '');

  /**
   * Variables state (selected measurements).
   * NOTE: with the v2 URL format, `initialState` carries `measurements` where each entry
   * embeds its own `instrumentId` alongside the `variableName`. We hydrate from that here.
   */
  const [variables, setVariables] = useState<SelectedMeasurement[]>(() => {
    const stationId = initialState?.stationId ?? 0;
    const ms = initialState?.measurements ?? [];
    return ms.map(({ instrumentId, variableName }) => {
      const measurement = getMeasurementFromConfig(variableName, stationId, instrumentId);
      if (!measurement) {
        console.warn(
          `Measurement not found for name: ${variableName}, stationId: ${stationId}, instrumentId: ${instrumentId}`
        );
      }
      // Transfer all measurement attributes, plus name/stationId/instrumentId
   return {
        ...createBlankMeasurement(),
        ...measurement,
        name: measurement?.name ?? variableName,   // canonical key used for data lookups
        alias: measurement?.alias ?? null,         // alias for UI
        stationId,
        instrumentId,
      };
    });
  });

  const [interval, setInterval] = useState<string>(initialState?.interval || '60');

  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(1);
  const [chartData, setChartData] = useState<{ [key: string]: string }[]>([]);

  const [domain, setDomain] = useState<[number, number]>([
    fromDate ? DateTime.fromISO(fromDate, { zone: 'America/Denver' }).toMillis() : 0,
    toDate ? DateTime.fromISO(toDate, { zone: 'America/Denver' }).toMillis() : DateTime.now().toMillis(),
  ]);
  const [selection, setSelection] = useState<[number, number]>(
    initialState?.selection || [
      fromDate ? DateTime.fromISO(fromDate, { zone: 'America/Denver' }).toMillis() : 0,
      toDate ? DateTime.fromISO(toDate, { zone: 'America/Denver' }).toMillis() : DateTime.now().toMillis(),
    ]
  );

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

  /**
   * Polls `/latest_measurement/<instrument>/<interval>/` if toDate is empty (live mode),
   * appending new data points to chartData.
   */
  useLiveChartUpdates({
    variables,
    interval,
    chartData,
    setChartData,
    isLive: !toDate,
    setDomain,
    setSelection,
  });

  // --- Handlers ---

  const handleFromDateChange = (newFromDate: string) => {
    // Always convert to Mountain Time ISO string
    const mtFromDate = newFromDate
      ? DateTime.fromISO(newFromDate).setZone('America/Denver').toISO({ suppressMilliseconds: true })
      : '';
    if (!toDate || !mtFromDate) {
      setFromDate(mtFromDate);
      return;
    }
    const [from, to] = syncDateRange(mtFromDate, toDate, true);
    setFromDate(from);
    setToDate(to);
  };

  const handleToDateChange = (newToDate: string) => {
    // Always convert to Mountain Time ISO string
    const mtToDate = newToDate
      ? DateTime.fromISO(newToDate).setZone('America/Denver').toISO({ suppressMilliseconds: true })
      : '';
    if (!mtToDate || !fromDate) {
      setToDate(mtToDate);
      return;
    }
    const [from, to] = syncDateRange(fromDate, mtToDate, false);
    setFromDate(from);
    setToDate(to);
  };

  const handleSliderChange = (range: [number, number]) => {
    const validated = validateSliderRange(range);
    if (validated) setSelection(validated);
  };

  const handleIntervalChange = (newInterval: string) => setInterval(newInterval);

  const handleVariableChange = (index: number, value: SelectedMeasurement) => {
    const measurement = getMeasurementFromConfig(value.name, value.stationId, value.instrumentId);
    const mergedValue = measurement
      ? {
          ...value,
          ...measurement,
          name: measurement.name ?? value.name,          // keep canonical
          alias: measurement.alias ?? value.alias ?? null, // display
        }
      : value;

    // Log the selected measurement's attributes to the console
    console.log('Selected Measurement:', mergedValue);
    setVariables((prev) => {
      const updated = [...prev];
      updated[index] = mergedValue;
      return updated;
    });
  };

  const handleRemoveVariable = (index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const addVariable = () => {
    // You should prompt/select a valid name, stationId, instrumentId
    // For demonstration, use the first available measurement from config
    if (!config || config.length === 0) return;
    const stationId = config[0].id;
    const instrument = config[0].children[0];
    const instrumentId = instrument.id;
    const measurement = instrument.measurements?.[0];
    const name = measurement?.name ?? '';
    setVariables((prev) => [
      ...prev,
      {
        ...createBlankMeasurement(),
        ...measurement,
        name,
        stationId,
        instrumentId,
      },
    ]);
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
          onToggle={() => setMenuExpanded(!menuExpanded)}
        />
      </div>

      <div className="graph-chart position-relative">
        {loading && (
          <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        <Chart
          id={id}
          fromDate={DateTime.fromMillis(selection[0], { zone: 'America/Denver' }).toISO({
            suppressMilliseconds: true,
          })}
          toDate={DateTime.fromMillis(selection[1], { zone: 'America/Denver' }).toISO({
            suppressMilliseconds: true,
          })}
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
