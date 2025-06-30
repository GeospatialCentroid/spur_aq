// File: src/types/config.ts

/**
 * Type definitions for the station configuration data used throughout the application.
 */

import { Instrument } from './instrument';

/**
 * Represents a monitoring station.
 *
 * @property id - Unique identifier for the station.
 * @property name - Display name of the station.
 * @property description - Human-readable description of the station.
 * @property lat - Latitude of the station (as a string).
 * @property lng - Longitude of the station (as a string).
 * @property children - Array of `Instrument` objects associated with the station.
 */
export interface Station {
  id: number;
  name: string;
  description: string;
  lat: string;
  lng: string;
  children: Instrument[];
}

/**
 * Represents the full configuration returned by the backend.
 * This is an array of `Station` objects.
 */
export type Config = Station[];
