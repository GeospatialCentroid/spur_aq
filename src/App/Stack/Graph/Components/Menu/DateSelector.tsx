// File: src/App/Stack/Graph/Components/Menu/DateSelector.tsx

/**
 * DateSelector component
 *
 * - Wraps a jQuery datetimepicker input inside a React component.
 * - Allows the user to pick a date/time which is converted to an ISO string.
 * - Supports two-way binding with external state via `value` and `onChange`.
 */

import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery-datetimepicker';
import 'jquery-datetimepicker/build/jquery.datetimepicker.min.css';
import './DateSelector.css';

// Expose jQuery to global scope (required for datetimepicker plugin to work)
; (window as any).$ = $;
; (window as any).jQuery = $;

/**
 * Props for the DateSelector component.
 *
 * @property value - The current ISO date string.
 * @property onChange - Callback triggered when the user selects a new date/time.
 * @property minDate - ISO string representing the minimum selectable date as determined by the total current date range
 * @property maxDate - ISO string representing the maximimum selectable date as determined by the total current date range
 */
interface DateSelectorProps {
  value: string;
  onChange: (newDate: string) => void;
  minDate?: string;
  maxDate?: string;
}

/**
 * Renders a date/time picker using jQuery's datetimepicker inside a React component.
 */
export default function DateSelector({ value, onChange, minDate, maxDate }: DateSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize the jQuery datetimepicker on mount
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      $(input).datetimepicker({
        format: 'Y-m-d H:i',
        step: 15,
        minDate: minDate ? new Date(minDate) : false,
        maxDate: maxDate ? new Date(maxDate) : false,
        onChangeDateTime: (current: Date) => {
          if (current) {
            onChange(current.toISOString());
          } else {
            onChange('');
          }
        },
      });

      // If no value is provided, default to the current date/time

      if (!value) {
        const defaultDate = new Date();
        input.value = formatDateForPicker(defaultDate);
        onChange(defaultDate.toISOString());
      }
    }

    // Cleanup on unmount
    return () => {
      if (input) {
        $(input).datetimepicker('destroy');
      }
    };
  }, [onChange, minDate, maxDate]);


  // Keep input field in sync with external value prop
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    if (value) {
      const d = new Date(value);
      input.value = formatDateForPicker(d);
    } else {
      input.value = '';
    }
  }, [value]);

  return (
    <div className="dtpicker-container">
      <input ref={inputRef} type="text" className="custom-dtpicker" />
    </div>
  );
}

/**
 * Helper function to format a Date object into "YYYY-MM-DD HH:mm"
 * for display in the input field.
 */
function formatDateForPicker(date: Date): string {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
}
