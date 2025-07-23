// File: src/App/Stack/Graph/Components/Menu/DateSelector.tsx

import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery-datetimepicker';
import 'jquery-datetimepicker/build/jquery.datetimepicker.min.css';
import './DateSelector.css';

(window as any).$ = $;
(window as any).jQuery = $;

interface DateSelectorProps {
  value: string;
  onChange: (newDate: string) => void;
  minDate?: string;
  maxDate?: string;
}

export default function DateSelector({ value, onChange, minDate, maxDate }: DateSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // One-time plugin initialization
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    $(input).datetimepicker({
      format: 'Y-m-d H:i',
      step: 15,
      scrollInput: false,
      onChangeDateTime: (current: Date) => {
        onChange(current ? current.toISOString() : '');
      },
    });

    return () => {
      $(input).datetimepicker('destroy');
    };
  }, [onChange]); // only run on mount

  // One-time set min/max constraints after mount
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const picker = $(input) as any;
    const options: any = {};

    if (minDate) options.minDate = new Date(minDate);
    if (maxDate) options.maxDate = new Date(maxDate);
    if (!minDate) options.minDate = false;
    if (!maxDate) options.maxDate = false;

    picker.datetimepicker('setOptions', options);
  }, [minDate, maxDate]);

  // Keep field value in sync
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.value = value ? formatDateForPicker(new Date(value)) : '';
  }, [value]);

  return (
    <div className="dtpicker-container">
      <input ref={inputRef} type="text" className="custom-dtpicker" />
    </div>
  );
}

function formatDateForPicker(date: Date): string {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
}
