// File: src/App/Stack/Graph/Components/Menu.tsx

/**
 * Menu component for selecting a time range, interval, and variables for a Graph.
 *
 * - Provides controls for setting `fromDate` and `toDate` using DateSelector components.
 * - Allows selection of an averaging interval.
 * - Allows dynamic addition and configuration of variable inputs via VariableSelector.
 */

import React from 'react';
import './Menu.css';
import DateSelector from './Menu/DateSelector';
import VariableSelector from './Menu/VariableSelector';
import IntervalSelector from './Menu/IntervalSelector';


/**
 * Represents a single user-selected measurement variable.
 *
 * @property name - The variable name (e.g., "PM2.5").
 * @property stationId - ID of the station the variable comes from.
 * @property instrumentId - ID of the instrument recording the variable.
 */
interface SelectedVariable {
  name: string;
  stationId: number;
  instrumentId: number;
}

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
 * @property interval - Currently selected averaging interval.
 * @property onIntervalChange - Callback for changing the interval.
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
  interval: string;
  onIntervalChange: (interval: string) => void;
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
  interval,
  onIntervalChange,
}) => {
  return (
    <div className={`graph-menu ${className}`}>
      <div className="menu-content">

        {/* Time and interval controls */}
        <div className="dt-button-group">
          <DateSelector value={fromDate} onChange={onFromDateChange} />
          <DateSelector value={toDate} onChange={onToDateChange} />

          <IntervalSelector value={interval} onChange={onIntervalChange} />

        </div>

        {/* Variable selectors and "Add Variable" button */}
        <div className="variable-button-group">
          {variables.map((v, i) => (
            <VariableSelector
              key={i}
              value={v}
              onChange={(val) => onVariableChange(i, val)}
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
