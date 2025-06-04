// types/config.ts
import { Instrument } from './instrument';

export interface Station {
  id: number;
  name: string;
  description: string;
  lat: string;
  lng: string;
  children: Instrument[];
}

export type Config = Station[];