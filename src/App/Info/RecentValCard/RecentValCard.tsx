import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import GaugeDial from './GaugeDial';
import { extractMeasurementsWithRanges, ParsedMeasurement } from './MeasurementUtils';
import FadingLeftArrow from './FadingLeftArrow';
import FadingRightArrow from './FadingRightArrow';
import './RecentValCard.css';
import { apiUrl } from '../../../config/api'; // TEAM: use one base everywhere
import { calibrateValueForMeasurement } from '../../../utils/calibration';  


interface RecentValuesCardProps {
  stationData: any[];
}

const RecentValuesCard: React.FC<RecentValuesCardProps> = ({ stationData }) => {
  const parsedMeasurements = extractMeasurementsWithRanges(stationData).filter(p => p.ranges.length > 0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [latestValue, setLatestValue] = useState<number>(0);
  const [latestTimestamp, setLatestTimestamp] = useState<string | null>(null);

  const selected = parsedMeasurements[currentIndex] || null;
  const match = selected?.ranges.find(r => latestValue >= r.range[0] && latestValue <= r.range[1]);
  // banner text + a slug we can use for category-based colors
  const categoryLabel = match?.category ?? 'Unknown';
  const categorySlug = categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const displayLabel = selected?.alias ?? selected?.measurementName ?? '_';
  const formattedTimestamp =
  typeof latestTimestamp === 'string' && latestTimestamp
    ? new Date(latestTimestamp).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Boise', // 👈 lock to Mountain Time
      })
    : '';



const fetchLatestValue = async (measurement: ParsedMeasurement) => {
  try {
    // cache-buster so we don’t get a cached response
    const res = await fetch(apiUrl(`/latest_measurement/${measurement.instrumentId}/60/?_=${Date.now()}`));
    const json = await res.json();
    const latestEntry = Array.isArray(json) ? json[0] : json;

  // Prefer the reading's own timestamp if present; otherwise fall back to server date or client now.
  const readingTime =
    latestEntry?.datetime ??
    res.headers.get('Date') ??
    new Date().toISOString();

  // If value lives inside latestEntry.data as JSON, read it.
  // NOTE: Your backend returns stringified JSON in `data`.
  const parsedData = JSON.parse(latestEntry?.data || '{}');

  // Keys like "no", "no2", "ozone" are case-sensitive; use the config name directly.
  const rawValue = parsedData?.[measurement.measurementName];
  const rawNum = Number(rawValue);

  // Apply calibration (no-op if there are none)
  const calibrated = Number.isFinite(rawNum)
    ? calibrateValueForMeasurement(measurement, rawNum, readingTime)
    : 0;

  setLatestValue(calibrated);
  setLatestTimestamp(new Date(readingTime).toISOString());

  //(Optional) Debug during integration
  console.debug("Calibration", {
    measurement: measurement.measurementName,
    readingTime,
    raw: rawNum,
    calibrations: measurement.calibrations,
    calibrated,
  });

  } catch (err) {
    console.error('Error fetching latest value:', err);
    setLatestValue(0);
    setLatestTimestamp(null);
  }
};



 // Fetch immediately, then pull every 5 minutes for the currently selected instrument
useEffect(() => {
  if (!selected) return;

  fetchLatestValue(selected); // immediate fetch

  const id = setInterval(() => {
    fetchLatestValue(selected);
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(id);
  // Recreate the timer when the selected instrument changes
}, [selected?.instrumentId, selected?.measurementName]);



  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((currentIndex + 1) % parsedMeasurements.length);
    },
    onSwipedRight: () => {
      setCurrentIndex((currentIndex - 1 + parsedMeasurements.length) % parsedMeasurements.length);
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  return (
    <div className="recent-values-wrapper" {...swipeHandlers}>
      <div className="arrow-button left" onClick={() =>
        setCurrentIndex((currentIndex - 1 + parsedMeasurements.length) % parsedMeasurements.length)
      }>
        <FadingLeftArrow />
      </div>

      <div className="arrow-button right" onClick={() =>
        setCurrentIndex((currentIndex + 1) % parsedMeasurements.length)
      }>
        <FadingRightArrow />
      </div>

      <div className="card recent-values-card">
        <div className="card-body">
          {selected && (
            <div className="selected-variable-display gauge-section">
            <div className="gauge-box">  
              <GaugeDial value={latestValue} ranges={selected.ranges} />
            </div>
              {/* Air quality category (e.g., Good) */}
              <p style={{ fontWeight: 'bold', color: '#000', marginTop: '0.8rem', marginBottom: '0.1rem' }}>
                {match?.category || 'Unknown'}
              </p>


              {/* Measurement name (now at the bottom) */}
        <h6 style={{ textAlign: 'center', marginTop: '0.6rem' }}>
          {displayLabel} ({latestValue.toFixed(1)} {selected.units || ''})
        </h6>



            {formattedTimestamp && (
              <div className="latest-timestamp" aria-live="polite">
                Last updated {formattedTimestamp}
              </div>
            )}


            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentValuesCard;
