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

import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getMaxSeries } from './graphStateUtils';
import { isResearcherMode } from './graphStateUtils';

/** Props for the Graph component */
interface GraphProps {
  id: number;
  onRemove: () => void;
  initialState?: EncodedGraphState;
  onStateChange?: (id: number, newState: EncodedGraphState) => void;
}

/** Main component representing one full graph unit */
const Graph: React.FC<GraphProps> = ({ id, onRemove, initialState, onStateChange }) => {
  const { t } = useTranslation("graph");
  const [menuExpanded, setMenuExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const { config } = useConfig();
  const MAX_SERIES = getMaxSeries();

  // Helper to find a measurement in config by name, stationId, and instrumentId
function getMeasurementFromConfig(name: string, stationId: number, instrumentId: number) {
  if (!config) return undefined;
  const station = config.find((s) => s.id === stationId);
  if (!station) return undefined;
  const instrument = station.children.find((i) => i.id === instrumentId);
  if (!instrument || !instrument.measurements) return undefined;

  const needle = name.trim().toLowerCase();
  return instrument.measurements.find((m) => {
    const byName = (m.name ?? '').trim().toLowerCase() === needle;
    const byAlias = (m.alias ?? '').trim().toLowerCase() === needle;
    return byName || byAlias;
  });
}

function findMeasurementByInstrument(
  key: string,
  instrumentId: number
): { measurement?: any; stationId?: number } {
  if (!config) return {};
  const needle = (key ?? '').trim().toLowerCase();
  for (const station of config) {
    const inst = station.children?.find(i => i.id === instrumentId);
    if (!inst?.measurements) continue;
    const m = inst.measurements.find(mm => {
      const byName  = (mm.name  ?? '').trim().toLowerCase() === needle;
      const byAlias = (mm.alias ?? '').trim().toLowerCase() === needle;
      return byName || byAlias;
    });
    if (m) return { measurement: m, stationId: station.id };
  }
  return {};
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
    const stationIdDefault = initialState?.stationId ?? 0;
    const ms = initialState?.measurements ?? [];
    return ms.map(({ instrumentId, variableName }) => {
      const within = getMeasurementFromConfig(variableName, stationIdDefault, instrumentId);
      const across = findMeasurementByInstrument(variableName, instrumentId);
      const m = within ?? across.measurement ?? null;
      const resolvedStationId = within ? stationIdDefault : (across.stationId ?? stationIdDefault);

      return {
        ...createBlankMeasurement(),
        ...(m ?? {}),
        name:  m?.name  ?? variableName,  // canonical for API/data
        alias: m?.alias ?? null,          // prefer alias for UI
        stationId: resolvedStationId,
        instrumentId,
      };
    });
  });


    // Re-hydrate variables with full metadata once config is loaded (fixes alias after refresh)
 // Re-hydrate variables with full metadata once config is loaded (fixes alias after refresh)
useEffect(() => {
  if (!config || variables.length === 0) return;

  setVariables(prev =>
    prev.map(v => {
      const byName  = getMeasurementFromConfig(v.name,  v.stationId, v.instrumentId);
      const byAlias = v.alias ? getMeasurementFromConfig(v.alias, v.stationId, v.instrumentId) : undefined;
      const xName   = findMeasurementByInstrument(v.name,  v.instrumentId);
      const xAlias  = v.alias ? findMeasurementByInstrument(v.alias, v.instrumentId) : {};

      const m    = byName ?? byAlias ?? xName.measurement ?? xAlias.measurement;
      const stId = (byName || byAlias) ? v.stationId : (xName.stationId ?? xAlias.stationId ?? v.stationId);
      if (!m) return v;

      return {
        ...v,
        ...m,
        name:  m.name  ?? v.name,            // keep canonical
        alias: m.alias ?? v.alias ?? v.name, // show alias if available
        stationId: stId,                     // <- fix mismatched stationId
      };
    })
  );
  
}, [config]); // runs once when config hydrates


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
    const byName  = getMeasurementFromConfig(value.name,  value.stationId, value.instrumentId);
    const byAlias = value.alias ? getMeasurementFromConfig(value.alias, value.stationId, value.instrumentId) : undefined;
    const xName   = findMeasurementByInstrument(value.name,  value.instrumentId);
    const xAlias  = value.alias ? findMeasurementByInstrument(value.alias, value.instrumentId) : {};

    const measurement = byName ?? byAlias ?? xName.measurement ?? xAlias.measurement;
    const stId = (byName || byAlias) ? value.stationId : (xName.stationId ?? xAlias.stationId ?? value.stationId);

    const mergedValue = measurement ? {
      ...value,
      ...measurement,
      name:  measurement.name  ?? value.name,
      alias: measurement.alias ?? value.alias ?? null,
      stationId: stId, // <- ensure correct
    } : value;

    console.log('Selected Measurement:', mergedValue);
    setVariables(prev => {
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
  // For demonstration, find the first available measurement from config
  if (!config || config.length === 0) return;

  setVariables(prev => {
    // Enforce max-series limit (normal = 2, researcher mode = Infinity)
    if (prev.length >= MAX_SERIES) return prev;

    // Find the first station/instrument/measurement that actually exists
    let chosen:
      | { stationId: number; instrumentId: number; name: string; measurement: any }
      | null = null;

    for (const station of config) {
      const instruments = station.children ?? [];
      for (const instrument of instruments) {
        const m = instrument.measurements?.[0];
        if (m && m.name) {
          chosen = {
            stationId: station.id,
            instrumentId: instrument.id,
            name: m.name,
            measurement: m,
          };
          break;
        }
      }
      if (chosen) break;
    }

    if (!chosen) {
      console.warn('[Graph] addVariable(): no instruments/measurements found in config');
      return prev; // Safety guard if data missing
    }

    return [
      ...prev,
      {
        ...createBlankMeasurement(),
        ...chosen.measurement,
        name: chosen.name,
        stationId: chosen.stationId,
        instrumentId: chosen.instrumentId,
      },
    ];
  });
};



  if (!config) return null;

  return (
    <div className={`graph ${isResearcherMode() ? 'research-mode' : ''}`}>
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
              <span className="visually-hidden">{t('GRAPH.LOADING')}</span>
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
