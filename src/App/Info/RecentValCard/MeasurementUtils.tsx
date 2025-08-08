// Represents a color-coded category with a numeric range and label
type RangeEntry = {
  color: string;                 // Hex or named color string for the gauge segment
  range: [number, number];      // Tuple representing the numeric range (e.g., [0, 50])
  category: string;             // Label/category name (e.g., "Good", "Moderate")
};

// Represents a parsed measurement including its source station and instrument metadata
type ParsedMeasurement = {
  stationName: string;           // Name of the station the instrument belongs to
  instrumentName: string;        // Name of the instrument reporting the measurement
  instrumentId: number;          // Unique identifier for the instrument
  measurementName: string;       // Variable name (e.g., "ozone", "no2")
  units: string | null;          // Units of the measurement (e.g., "ppb"), or null if not available
  ranges: RangeEntry[];          // Array of color-coded ranges associated with this variable
};

/**
 * Extracts measurements that include valid range data from a nested station dataset.
 *
 * This function traverses a hierarchical station object where each station may have children,
 * and each child may have measurements. It filters out measurements that lack a `ranges` array.
 *
 * @param stations - Array of station objects with potential nested children and measurements
 * @returns Array of parsed measurement objects, each containing metadata and cleaned range data
 */
export const extractMeasurementsWithRanges = (stations: any[]): ParsedMeasurement[] => {
  return stations.flatMap((station: any) =>
    (station.children || []).flatMap((child: any) =>
      (child.measurements || []).map((measurement: any) => ({
        stationName: station.name,
        instrumentName: child.name,
        instrumentId: child.id,
        measurementName: measurement.name,
        units: measurement.units || null,
        ranges: Array.isArray(measurement.ranges)
          ? measurement.ranges.map((r: any) => ({
              color: r.color,
              range: r.range as [number, number],
              category: r.category || '',
            }))
          : [], // If no valid ranges, return an empty array
      }))
    )
  );
};

// Export the types for use in other modules
export type { ParsedMeasurement, RangeEntry };
