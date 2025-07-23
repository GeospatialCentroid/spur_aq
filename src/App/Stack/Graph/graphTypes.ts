/** User-selected variable (station, instrument, and variable name) */
export type SelectedVariable = {
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
