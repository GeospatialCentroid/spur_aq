import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import GaugeDial from './GaugeDial';
import { extractMeasurementsWithRanges, ParsedMeasurement } from './MeasurementUtils';
import FadingLeftArrow from './FadingLeftArrow';
import FadingRightArrow from './FadingRightArrow';
import './RecentValCard.css';
import { apiUrl } from '../../../config/api'; // TEAM: use one base everywhere


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
  const variableName =
    selected?.measurementName
      ? selected.measurementName.charAt(0).toUpperCase() + selected.measurementName.slice(1)
      : '—';

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
    const res = await fetch(apiUrl(`/latest_measurement/${measurement.instrumentId}/60/`));
    const json = await res.json();
    const latestEntry = Array.isArray(json) ? json[0] : json;

    // B) Capture and store the ISO timestamp from the backend
    setLatestTimestamp(latestEntry?.datetime ?? null);

    const parsedData = JSON.parse(latestEntry?.data || '{}');
    const fetchedValue = parsedData?.[measurement.measurementName] ?? 0;
    setLatestValue(fetchedValue);
  } catch (err) {
    console.error('Error fetching latest value:', err);
    setLatestValue(0);
    setLatestTimestamp(null); // clear on error
  }
};


  useEffect(() => {
    if (selected) {
      fetchLatestValue(selected);
    }
  }, [currentIndex]);

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
              {selected.measurementName} {/* Value with units, rounded to 1 decimal */} ({latestValue.toFixed(1)} {selected.units || ''})
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
