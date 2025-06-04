//src\App\Stack\Graph\Components\Menu\DateSelector.tsx
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
      const yyyy = d.getFullYear();
      const MM = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      input.value = `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
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
