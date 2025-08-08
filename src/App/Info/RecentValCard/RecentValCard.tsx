import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import GaugeDial from './GaugeDial';
import { extractMeasurementsWithRanges, ParsedMeasurement } from './MeasurementUtils';
import FadingLeftArrow from './FadingLeftArrow';
import FadingRightArrow from './FadingRightArrow';
import './RecentValCard.css';

interface RecentValuesCardProps {
  stationData: any[];
}

const RecentValuesCard: React.FC<RecentValuesCardProps> = ({ stationData }) => {
  const parsedMeasurements = extractMeasurementsWithRanges(stationData).filter(p => p.ranges.length > 0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [latestValue, setLatestValue] = useState<number>(0);

  const selected = parsedMeasurements[currentIndex] || null;
  const match = selected?.ranges.find(r => latestValue >= r.range[0] && latestValue <= r.range[1]);

  const fetchLatestValue = async (measurement: ParsedMeasurement) => {
    try {
      const res = await fetch(`http://129.82.30.24:8001/latest_measurement/${measurement.instrumentId}/60/`);
      const json = await res.json();
      const latestEntry = Array.isArray(json) ? json[0] : json;
      const parsedData = JSON.parse(latestEntry.data || '{}');
      const fetchedValue = parsedData[measurement.measurementName] ?? 0;
      setLatestValue(fetchedValue);
    } catch (err) {
      console.error('Error fetching latest value:', err);
      setLatestValue(0);
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
      <div className="card recent-values-card">
        <div className="card-body">
          <div
            className="swipe-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}
          >
            <button
              onClick={() =>
                setCurrentIndex((currentIndex - 1 + parsedMeasurements.length) % parsedMeasurements.length)
              }
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <FadingLeftArrow />
            </button>

            <h5 style={{ textAlign: 'center', flex: '1' }}>
              {selected?.measurementName.charAt(0).toUpperCase() + selected?.measurementName.slice(1)}
            </h5>

            <button
              onClick={() =>
                setCurrentIndex((currentIndex + 1) % parsedMeasurements.length)
              }
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <FadingRightArrow />
            </button>
          </div>

          {selected && (
            <div className="selected-variable-display gauge-section">
              <GaugeDial value={latestValue} ranges={selected.ranges} />
              <p style={{ fontWeight: 'bold', color: '#000', marginTop: '1rem' }}>
                {match?.category || 'Unknown'}
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 'normal', marginTop: '0.25rem' }}>
                {latestValue} {selected.units || ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentValuesCard;
