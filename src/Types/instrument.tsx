// File: src/types/instrument.ts

/**
 * Type definition for an Instrument, which is a component of a Station.
 * Each instrument records a set of measurements over a specific date range.
 */

import { Measurement } from './measurement';

/**
 * Represents a single instrument attached to a station.
 *
 * @property id - Unique identifier for the instrument.
 * @property name - Name or label for the instrument.
 * @property start_date - ISO date string representing when the instrument began collecting data.
 * @property end_date - ISO date string representing when the instrument stopped collecting data.
 * @property description - Human-readable description of the instrument and its purpose.
 * @property measurements - An array of `Measurement` objects collected by the instrument.
 */
export interface Instrument {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  description: string;
  measurements: Measurement[];
}
