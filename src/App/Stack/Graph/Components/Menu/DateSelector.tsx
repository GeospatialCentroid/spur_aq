//src\App\Stack\Graph\Components\Menu\DateSelector.tsx
import { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery-datetimepicker';
import 'jquery-datetimepicker/build/jquery.datetimepicker.min.css';
import './DateSelector.css';

export default function DTPicker() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      $(input).datetimepicker({
        format: 'Y-m-d H:i',
        step: 15,
        onChangeDateTime: function (currentDateTime: Date) {
          console.log('Selected:', currentDateTime);
        }
      });
    }

    return () => {
      if (input) {
        $(input).datetimepicker('destroy');
      }
    };
  }, []);


  return (
    <div className="dtpicker-container">
      <input ref={inputRef} type="text" className="custom-dtpicker" />
    </div>
  );
}
