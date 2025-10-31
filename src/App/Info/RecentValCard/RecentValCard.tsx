import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import GaugeDial from './GaugeDial';
import { extractMeasurementsWithRanges, ParsedMeasurement } from './MeasurementUtils';
import FadingLeftArrow from './FadingLeftArrow';
import FadingRightArrow from './FadingRightArrow';
import './RecentValCard.css';
import { apiUrl } from '../../../config/api';
import { calibrateValueForMeasurement } from '../../../utils/calibration';
import { useTranslation } from "react-i18next";

interface RecentValuesCardProps {
  stationData: any[];
}

const RecentValuesCard: React.FC<RecentValuesCardProps> = ({ stationData }) => {
  const { t, i18n } = useTranslation("recent");
  const parsedMeasurements = extractMeasurementsWithRanges(stationData).filter(p => p.ranges.length > 0);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [latestValue, setLatestValue] = useState<number>(0);
  const [latestTimestamp, setLatestTimestamp] = useState<string | null>(null);

  const selected = parsedMeasurements[currentIndex] || null;
  const match = selected?.ranges.find(r => latestValue >= r.range[0] && latestValue <= r.range[1]);
  const displayLabel = selected?.alias ?? selected?.measurementName ?? '_';

  const formattedTimestamp =
    typeof latestTimestamp === 'string' && latestTimestamp
      ? new Date(latestTimestamp).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'America/Boise',
        })
      : '';

  const fetchLatestValue = async (measurement: ParsedMeasurement) => {
    try {
      const res = await fetch(apiUrl(`/latest_measurement/${measurement.instrumentId}/60/?_=${Date.now()}`));
      const json = await res.json();
      const latestEntry = Array.isArray(json) ? json[0] : json;

      const readingTime =
        latestEntry?.datetime ??
        res.headers.get('Date') ??
        new Date().toISOString();

      const parsedData = JSON.parse(latestEntry?.data || '{}');
      const rawValue = parsedData?.[measurement.measurementName];
      const rawNum = Number(rawValue);

      const calibrated = Number.isFinite(rawNum)
        ? calibrateValueForMeasurement(measurement, rawNum, readingTime)
        : 0;

      setLatestValue(calibrated);
      setLatestTimestamp(new Date(readingTime).toISOString());
    } catch (err) {
      console.error('Error fetching latest value:', err);
      setLatestValue(0);
      setLatestTimestamp(null);
    }
  };

  // Fetch immediately, then every 5 minutes for the selected instrument
  useEffect(() => {
    if (!selected) return;

    fetchLatestValue(selected);

    const id = setInterval(() => {
      fetchLatestValue(selected);
    }, 5 * 60 * 1000);

    return () => clearInterval(id);
  }, [selected]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentIndex((currentIndex + 1) % parsedMeasurements.length);
    },
    onSwipedRight: () => {
      setCurrentIndex((currentIndex - 1 + parsedMeasurements.length) % parsedMeasurements.length);
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <div className="recent-values-wrapper" {...swipeHandlers}>
      <button
        type="button"
        className="arrow-button left"
        onClick={() =>
          setCurrentIndex((currentIndex - 1 + parsedMeasurements.length) % parsedMeasurements.length)
        }
        aria-label={String(t("A11Y.PREV"))}
      >
        <FadingLeftArrow />
      </button>

      <button
        type="button"
        className="arrow-button right"
        onClick={() =>
          setCurrentIndex((currentIndex + 1) % parsedMeasurements.length)
        }
        aria-label={String(t("A11Y.NEXT"))}
      >
        <FadingRightArrow />
      </button>

      {selected && (
        <div className="rv-content">
          <div className="gauge-box">
            <GaugeDial value={latestValue} ranges={selected.ranges} />
          </div>

          <div className="gauge-meta" aria-live="polite">
            <p className="gauge-category">{match?.category || t("LABELS.UNKNOWN")}</p>

            <h6 className="gauge-name">
              {displayLabel} ({latestValue.toFixed(1)} {selected.units || ''})
            </h6>

            {formattedTimestamp && (
              <div className="latest-timestamp">
                {t("LABELS.LAST_UPDATED", { date: formattedTimestamp })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentValuesCard;
