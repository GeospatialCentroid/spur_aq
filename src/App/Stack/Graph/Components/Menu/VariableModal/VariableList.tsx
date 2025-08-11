// File: src/App/Stack/Graph/Components/Menu/VariableModal/VariableList.tsx

/**
 * VariableList component
 *
 * - Renders a hierarchical selection list of stations, instruments, and measurements.
 * - Allows users to click any item to select it.
 * - Each selection updates parent state through the `onSelect` callback.
 * - Highlights the currently selected item based on a unique `selectedKey`.
 */

import React from 'react';
import { Station } from '../../../../../../Types/config';
import { Calibration } from '../../../../../../Types/calibration';
import { useMode } from '../../../../../../context/ModeContext';
/**
 * Props for the VariableList component.
 *
 * @property stations - Array of stations, each with instruments and measurements.
 * @property onSelect - Callback invoked when a station, instrument, or measurement is clicked.
 * @property selectedKey - Optional unique key used to highlight the currently selected item.
 * @property selectedColor - Optional color used to highlight the selected measurement.
 */
interface VariableListProps {
  stations: Station[];
  onSelect: (
    item: {
      type: 'station' | 'instrument' | 'measurement';
      name: string;
      description: string;
      alias?: string;
      units?: string;
      calibrations?: Calibration[];
      public_display?:boolean;
    },
    key: string
  ) => void;
  selectedKey?: string;
  selectedColor?: string;
}

/**
 * Renders the station → instrument → measurement hierarchy as a nested interactive list.
 */
const VariableList: React.FC<VariableListProps> = ({
  stations,
  onSelect,
  selectedKey,
  selectedColor,
}) => {
  const { mode } = useMode();
  return (
    <div>
      {stations.map((station) => (
        <div key={station.id} style={{ marginBottom: '1rem' }}>
          {/* Station Level */}
          <div
            className={`selectable station ${
              selectedKey === `station-${station.id}` ? 'selected' : ''
            }`}
            onClick={() =>
              onSelect(
                {
                  type: 'station',
                  name: station.name,
                  description: station.description,
                },
                `station-${station.id}`
              )
            }
          >
            {station.name}
          </div>

          <ul>
            {station.children.map((instrument) => (
              <li key={instrument.id}>
                {/* Instrument Level */}
                <div style={{ display: mode === 'researcher' ? 'block' : 'none' }}>
                <div
                  className={`selectable instrument ${
                    selectedKey === `instrument-${instrument.id}` ? 'selected' : ''
                  }`}
                  onClick={() =>
                    onSelect(
                      {
                        type: 'instrument',
                        name: instrument.name,
                        description: instrument.description,
                      },
                      `instrument-${instrument.id}`
                    )
                  }
                >
                  {instrument.name}
                </div>
                </div>
                <ul>
                  {instrument.measurements.map((m) => {
                    const measurementKey = `${station.id}:${instrument.id}:${m.name}`;
                    const isSelected = selectedKey === measurementKey;
                    if (mode === 'public' && !m.public_display) {
                        return null;
                      }
                    return (
                      <li
                        key={m.id}
                        className={`selectable measurement ${isSelected ? 'selected' : ''}`}
                        onClick={() =>
                          onSelect(
                         {
                            type: 'measurement',
                            name: m.name,
                            description: m.description ?? '',
                            alias: m.alias ?? m.name,
                            units: m.units?.toString(),
                          },
                            measurementKey
                          )
                        }
                        style={
                          isSelected && selectedColor
                            ? {
                                backgroundColor: selectedColor,
                                color: 'white',
                              }
                            : undefined
                        }
                      >
                        {m.alias || m.name}

                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default VariableList;