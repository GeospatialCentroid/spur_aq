//src/models/instrument.tsx
import { Measurement } from './measurement';

export interface Instrument {
  Measurements: Measurement[];
  FromDT: string;
  ToDT: string;
}
