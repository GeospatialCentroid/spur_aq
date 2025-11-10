// File: src/App/Stack/Graph/Components/Menu/DateSelector.tsx

/**
 * DateSelector component
 *
 * - Wraps a jQuery datetimepicker input inside a React component.
 * - Allows the user to pick a date/time which is converted to an ISO string.
 * - Supports two-way binding with external state via `value` and `onChange`.
 */

import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DateSelector.css';
import { useTranslation } from 'react-i18next';
import { isUtcMode, isoFromZonedWallTime } from '../../../../../utils/time';


/**
 * Props for the DateSelector component.
 *
 * @property value - The current ISO date string.
 * @property onChange - Callback triggered when the user selects a new date/time.
 * @property minDate - ISO string representing the minimum selectable date as determined by the total current date range
 * @property maxDate - ISO string representing the maximimum selectable date as determined by the total current date range
 */
interface DateSelectorProps {
  value: string; // ISO string
  onChange: (newDate: string) => void;
  minDate?: string; // ISO string
  maxDate?: string; // ISO string
  isClearable?: boolean;
}

/**
 * Renders a date/time picker using the React-Datepicker package found at https://reactdatepicker.com/
 */
export default function DateSelector({
  value,
  onChange,
  minDate,
  maxDate,
  isClearable,
}: DateSelectorProps) {
  const { t } = useTranslation('graph');
  const useUtc = isUtcMode();
  const selectedDate = value
    ? new Date(value)
    : null;


  const handleChange = (date: Date | null) => {
    if (!date) {
      onChange('');
      return;
    }

    // Store as ISO-UTC. Interpret as UTC when ?tz=UTC, otherwise as America/Denver wall time.
    const iso = useUtc
      ? date.toISOString()
      : isoFromZonedWallTime(date, 'America/Denver');

    onChange(iso);
  };

  return (
    <div className="dtpicker-container">
      <DatePicker
        portalId="root"
        selected={selectedDate}
        showTimeSelect
        timeInputLabel={useUtc ? 'UTC' : 'America/Denver'}
        onChange={handleChange}
        timeIntervals={15}
        dateFormat="yyyy-MM-dd h:mm aa"
        minDate={minDate ? new Date(minDate) : undefined}
        maxDate={maxDate ? new Date(maxDate) : undefined}
        placeholderText={String(t('MENU.PLACEHOLDER_DATETIME'))}
        className="custom-dtpicker"
        popperPlacement="top-end"
        popperClassName="dtpicker-popper"
        isClearable={isClearable}
      />
    </div>
  );
}


