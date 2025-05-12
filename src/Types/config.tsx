//src/models/config.tsx
import { Instrument } from './instrument';

export interface Config {
  Info: {
    About: string;
    Map: string;
    LatestReadings: string;
  };
  Menu: {
    Instruments: Record<string, Instrument>; // Or Instrument[] if unkeyed
  };
}
