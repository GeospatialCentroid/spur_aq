/** User-selected variable (station, instrument, and variable name) */
import { Measurement } from "../../../Types/measurement"
export type SelectedMeasurement = Measurement & {
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
    units: '',
    min: null,
    max: null,
    description: '',
    calibrations: [],
    public_display: false,
    feature_measure: false,
    ranges: null,
    stationId: -1,
    instrumentId: -1,
  };
}

