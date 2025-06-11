// src/App/Stack/Graph/Components/Menu/DateSelector.tsx
import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery-datetimepicker';
import 'jquery-datetimepicker/build/jquery.datetimepicker.min.css';

import './DateSelector.css';
;(window as any).$ = $;
;(window as any).jQuery = $;

interface DateSelectorProps {
  value: string;
  onChange: (newDate: string) => void;
}

export default function DateSelector({ value, onChange }: DateSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      $(input).datetimepicker({
        format: 'Y-m-d H:i',
        step: 15,
        onChangeDateTime: (current: Date) => {
          if (current) {
            onChange(current.toISOString());
          } else {
            onChange('');
          }
        },
      });

      // If no valid date was passed in, set a default starting date
      if (!value) {
        const defaultDate = new Date();
        input.value = formatDateForPicker(defaultDate);
        onChange(defaultDate.toISOString());
      }
    }

    return () => {
      if (input) {
        $(input).datetimepicker('destroy');
      }
    };
  }, [onChange]);

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

// Helper to format Date to "YYYY-MM-DD HH:mm"
function formatDateForPicker(date: Date): string {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
}
