import React from 'react';
import { Range, getTrackBackground } from 'react-range';
import './DomainSlider.css';

interface DomainSliderProps {
  domain: [number, number];
  selection: [number, number];
  onChange: (range: [number, number]) => void;
}

const STEP = 1;

export default function DomainSlider({
  domain,
  selection,
  onChange,
}: DomainSliderProps) {
  return (
    <div className="domain-slider-wrapper">
      <div className="domain-slider">
        <Range
          values={selection}
          step={STEP}
          min={domain[0]}
          max={domain[1]}
          draggableTrack
          onChange={(vals) => onChange([vals[0], vals[1]])}
          renderTrack={({ props, children }) => {
            const { key, ...rest } = props as any; // `as any` to bypass TS warning
            return (
              <div
                key={key}
                {...rest}
                className="slider-track"
                style={{
                  background: getTrackBackground({
                    values: selection,
                    colors: ['#ddd', '#548BF4', '#ddd'],
                    min: domain[0],
                    max: domain[1],
                  }),
                }}
              >
                {children}
              </div>
            );
          }}
          renderThumb={({ props, index }) => {
            const { key, ...rest } = props as any;
            return (
              <div
                key={key}
                {...rest}
                className="slider-handle"
                role="slider"
                aria-label={`Handle ${index + 1}`}
                aria-valuemin={domain[0]}
                aria-valuemax={domain[1]}
                aria-valuenow={selection[index]}
              />
            );
          }}
        />
      </div>
    </div>
  );
}
