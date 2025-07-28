// File: src/types/measurement.ts

import {Calibration} from './calibration'
/**
 * Represents a measurable variable collected by an instrument.
 *
 * @property id - Unique identifier for the measurement.
 * @property name - Full name of the measurement (e.g., "Temperature", "PM2.5").
 * @property alias - Alternate display name or shorthand.
 * @property units - Numeric code representing the units of measurement.
 * @property min - Minimum expected or valid value for this measurement.
 * @property max - Maximum expected or valid value for this measurement.
 * @property description - Human-readable explanation of what the measurement represents.
 */
export interface Measurement {
  id: number;
  name: string;
  alias: string;
  units: number;
  min: number;
  max: number;
  description: string;
  calibrations:Calibration[];

  }