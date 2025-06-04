import { Measurement } from './measurement';

export interface Instrument {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  description: string;
  measurements: Measurement[];
}