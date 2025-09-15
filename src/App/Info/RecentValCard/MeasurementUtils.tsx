import type { Calibration } from "../../../Types/calibration";


// Represents a color-coded category with a numeric range and label
type RangeEntry = {
  color: string;                 // Hex or named color string for the gauge segment
  range: [number, number];      // Tuple representing the numeric range (e.g., [0, 50])
  category: string;             // Label/category name (e.g., "Good", "Moderate")
};

// Represents a parsed measurement including its source station and instrument metadata
type ParsedMeasurement = {
  stationName: string;          
  instrumentName: string;        
  instrumentId: number;          
  measurementId: number;
  measurementName: string;      
  alias?: string;                 
  units: string | null;          
  ranges: RangeEntry[];     
  calibrations?: Calibration[];      
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
      (child.measurements || [])
        .filter((measurement: any) => measurement?.feature_measure === true)
        .map((measurement: any) => ({
        stationName: station.name,
        instrumentName: child.name,
        instrumentId: child.id,
        measurementId: measurement.id,
        measurementName: measurement.name,
        alias: measurement.alias ?? undefined, 
        units: measurement.units || null,
        ranges: Array.isArray(measurement.ranges)
          ? measurement.ranges.map((r: any) => ({
              color: r.color,
              range: r.range as [number, number],
              category: r.category || '',
            }))
          : [], // If no valid ranges, return an empty array
          calibrations: Array.isArray(measurement.calibrations) ? measurement.calibrations : [], 
      }))
    )
  );
};

// Export the types for use in other modules
export type { ParsedMeasurement, RangeEntry };
// ADD: shared filter for feature-measure items
export const onlyFeatureMeasures = <T extends { feature_measure?: boolean | null }>(list: T[] = []) =>
  list.filter(m => m?.feature_measure === true);

