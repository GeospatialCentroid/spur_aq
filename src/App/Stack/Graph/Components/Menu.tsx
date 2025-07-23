// File: src/App/Stack/Graph/Components/Menu.tsx

import React from 'react';
import './Menu.css';
import DateSelector from './Menu/DateSelector';
import VariableSelector from './Menu/VariableSelector';
import IntervalSelector from './Menu/IntervalSelector';
import { SelectedVariable } from '../graphTypes';
import { getNow } from '../graphDateUtils';

/**
 * Props for the Menu component.
 *
 * @property className - Optional class to append to the base menu class.
 * @property fromDate - ISO string representing the start of the time range.
 * @property toDate - ISO string representing the end of the time range.
 * @property onFromDateChange - Callback for when the start date is updated.
 * @property onToDateChange - Callback for when the end date is updated.
 * @property variables - Array of selected variables.
 * @property onVariableChange - Callback for modifying a selected variable.
 * @property onAddVariable - Callback for adding a new variable selector.
 * @property onRemoveVariable - Callback for removing a variable.
 * @property interval - Currently selected averaging interval.
 * @property onIntervalChange - Callback for changing the interval.
 * @property updateLive - Whether live updates are enabled.
 * @property onUpdateLiveChange - Callback for toggling live update.
 */
interface MenuProps {
  className?: string;
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  variables: SelectedVariable[];
  onVariableChange: (index: number, v: SelectedVariable) => void;
  onAddVariable: () => void;
  onRemoveVariable: (index: number) => void;
  interval: string;
  onIntervalChange: (interval: string) => void;
  updateLive: boolean;
  onUpdateLiveChange: (value: boolean) => void;
}

/**
 * Menu component used to configure a graph query.
 */
const Menu: React.FC<MenuProps> = ({
  className = '',
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  variables,
  onVariableChange,
  onAddVariable,
  onRemoveVariable,
  interval,
  onIntervalChange,
  updateLive,
  onUpdateLiveChange,
}) => {
  return (
    <div className={`graph-menu ${className}`}>
      <div className="menu-content">

        {/* Time range controls */}
        <div className="dt-button-group">
          <div className="start-date" title="The start date for the graph">
            From:
            <DateSelector
              value={fromDate}
              onChange={onFromDateChange}
              maxDate={toDate}
            />
          </div>
          <div className="end-date" title="The end date for the graph">
            To:
            <DateSelector
              value={toDate}
              onChange={onToDateChange}
              minDate={fromDate}
              maxDate={getNow()}
            />
          </div>
        </div>

        {/* Interval and Update Live controls */}
        <div className="dt-button-group interval-group">
          <div className="interval-selector" title="The timing between data points for the graph">
            Interval:
            <IntervalSelector value={interval} onChange={onIntervalChange} />
          </div>
          <div className="update-live-checkbox" title="Automatically fetch new data when available">
            Update Live:
            <input
              type="checkbox"
              checked={updateLive}
              onChange={(e) => onUpdateLiveChange(e.target.checked)}
            />
          </div>
        </div>

        {/* Variable selectors */}
        <div className="variable-button-group">
          {variables.map((v, i) => (
            <VariableSelector
              key={i}
              value={v}
              onChange={(val) => onVariableChange(i, val)}
              onRemove={() => onRemoveVariable(i)}
            />
          ))}

          <button className="add-variable-button" onClick={onAddVariable}>
            + Add Variable
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
