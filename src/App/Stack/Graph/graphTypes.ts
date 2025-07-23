/** User-selected variable (station, instrument, and variable name) */
type SelectedVariable = {
    name: string;
    stationId: number;
    instrumentId: number;
};

/** Groups variables by instrument for efficient API requests */
type VariableGroup = {
    stationId: number;
    instrumentId: number;
    variableNames: string[];
};
