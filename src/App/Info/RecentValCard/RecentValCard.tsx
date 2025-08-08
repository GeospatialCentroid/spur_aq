import React, { useState } from 'react';
import GaugeDial from './GaugeDial'; // Custom gauge component for visualizing a numeric value
import { extractMeasurementsWithRanges, ParsedMeasurement } from './MeasurementUtils'; // Utility for extracting measurements with range metadata
import './RecentValCard.css'; // Styling for the card layout and visuals

// Props expected from the parent, specifically an array of station data (with children and measurements)
interface RecentValuesCardProps {
  stationData: any[];
}

/**
 * Displays a card component that:
 * - Allows the user to select a measurement variable
 * - Fetches the latest value from the backend
 * - Visualizes the value on a D3-based gauge dial
 * 
 * Assumes stationData contains nested structure: stations -> children -> measurements
 */
const RecentValuesCard: React.FC<RecentValuesCardProps> = ({ stationData }) => {
  // Extract measurements with defined ranges
  const parsedMeasurements = extractMeasurementsWithRanges(stationData).filter(p => p.ranges.length > 0);

  // State to track the currently selected measurement
  const [selected, setSelected] = useState<ParsedMeasurement | null>(parsedMeasurements[0] || null);

  // State to hold the most recent value for the selected variable
  const [latestValue, setLatestValue] = useState<number>(0);

  // Match the current value to a category, based on the range it falls into
  const match = selected?.ranges.find(r => latestValue >= r.range[0] && latestValue <= r.range[1]);

  /**
   * Handles dropdown selection of a variable.
   * Fetches the most recent value for that variable from the backend,
   * parses it, and updates the dial and category display.
   */
  const handleDropdownChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;

    // Match selected variable by name
    const matched = parsedMeasurements.find(m => m.measurementName === selectedName);
    if (!matched) return;

    try {
      // Request the most recent value using instrument ID
      const res = await fetch(`http://129.82.30.24:8001/latest_measurement/${matched.instrumentId}/60/`);
      const json = await res.json();

      // Handle stringified `data` field from backend
      const latestEntry = Array.isArray(json) ? json[0] : json;
      const parsedData = JSON.parse(latestEntry.data || '{}');

      // Extract the actual value using measurement name as key
      const fetchedValue = parsedData[matched.measurementName] ?? 0;

      // Update UI state
      setSelected(matched);
      setLatestValue(fetchedValue);
    } catch (err) {
      console.error('Error fetching latest value:', err);
      setLatestValue(0); // Fallback to 0 if error
    }
  };

  return (
    <div className="recent-values-wrapper">
      <div className="card recent-values-card">
        <div className="card-body">
          {/* Dropdown for selecting measurement variable */}
          <select
            className="form-select mb-3"
            onChange={handleDropdownChange}
            value={selected?.measurementName || ''}
          >
            {parsedMeasurements.map((m, i) => (
              <option key={i} value={m.measurementName}>
                {/* Capitalize the first letter of the variable name */}
                {m.measurementName.charAt(0).toUpperCase() + m.measurementName.slice(1)}
              </option>
            ))}
          </select>

          {/* Gauge and label display for selected variable */}
          {selected && (
            <div className="selected-variable-display gauge-section">
              <GaugeDial value={latestValue} ranges={selected.ranges} />
              <p style={{ fontWeight: 'bold', color: '#000', marginTop: '1rem' }}>
                {match?.category || 'Unknown'} {/* Category label (e.g., "Good", "Moderate") */}
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.25rem' }}>
                {latestValue} {selected.units || ''} {/* Numeric value + units (if any) */}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentValuesCard;
