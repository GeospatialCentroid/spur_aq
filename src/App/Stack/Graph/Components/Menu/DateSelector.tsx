import { useState } from 'react';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import './DateSelector.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function DTPicker() {
  const [value, onChange] = useState<Value>(new Date());

  return (
    <div className="dtpicker-container">
      <DateTimePicker
        onChange={onChange}
        value={value}
        className="custom-dtpicker"
      />
    </div>
  );
}
