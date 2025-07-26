/** User-selected variable (station, instrument, and variable name) */
import { Measurement } from "../../../Types/measurement"
export type SelectedMeasurement = Measurement & {
  name: string;
  stationId: number;
  instrumentId: number;
};

/** Groups variables by instrument for efficient API requests */
export type VariableGroup = {
  stationId: number;
  instrumentId: number;
  variableNames: string[];
};

// Creates a blank measurement, allows a new unselected variable
export function createBlankMeasurement(): SelectedMeasurement {
  return {
    id: -1,
    name: '',
    alias: '',
    units: 0,
    min: 0,
    max: 0,
    description: '',
    stationId: -1,
    instrumentId: -1,
  };
}
