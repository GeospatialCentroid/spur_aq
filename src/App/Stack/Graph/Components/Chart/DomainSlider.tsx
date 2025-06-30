// File: src/App/Stack/Graph/Components/Chart/DomainSlider.tsx

/**
 * DomainSlider component
 *
 * - Provides a draggable double-thumb slider for selecting a numeric range (e.g., time or value domain).
 * - Utilizes the `react-range` library for rendering and managing slider logic.
 * - Visually indicates the selected range and calls `onChange` when updated.
 */

import React from 'react';
import { Range, getTrackBackground } from 'react-range';
import './DomainSlider.css';

/**
 * Props for the DomainSlider component.
 *
 * @property domain - The full range of allowable values as a [min, max] tuple.
 * @property selection - The current selected range (subdomain) as a [min, max] tuple.
 * @property onChange - Callback triggered when the user updates the selection.
 */
interface DomainSliderProps {
  domain: [number, number];
  selection: [number, number];
  onChange: (range: [number, number]) => void;
}

const STEP = 1; // Minimum interval for dragging handles

/**
 * Renders a horizontal double-thumb range slider with custom track and thumbs.
 */
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

          // Render the track between the thumbs
          renderTrack={({ props, children }) => {
            const { key, ...rest } = props as any; // TS workaround for react-range's `key` prop
            return (
              <div
                key={key}
                {...rest}
                className="slider-track"
                style={{
                  background: getTrackBackground({
                    values: selection,
                    colors: ['#ddd', '#548BF4', '#ddd'], // highlight selected area
                    min: domain[0],
                    max: domain[1],
                  }),
                }}
              >
                {children}
              </div>
            );
          }}

          // Render the draggable slider handles
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
