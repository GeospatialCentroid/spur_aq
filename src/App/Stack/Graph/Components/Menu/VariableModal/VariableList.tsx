// src/App/Stack/Graph/Components/Menu/VariableModal/VariableList.tsx

import React from 'react';
import { Station } from '../../../../../../types/config';

interface VariableListProps {
  stations: Station[];
  onSelect: (
    item: {
      type: 'station' | 'instrument' | 'measurement';
      name: string;
      description: string;
      alias?: string;
      units?: string;
    },
    key: string
  ) => void;
  selectedKey?: string;
}

const VariableList: React.FC<VariableListProps> = ({ stations, onSelect, selectedKey }) => {
  return (
    <div>
      {stations.map((station) => (
        <div key={station.id} style={{ marginBottom: '1rem' }}>
          <div
            className={`selectable station ${selectedKey === `station-${station.id}` ? 'selected' : ''}`}
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
                <div
                  className={`selectable instrument ${selectedKey === `instrument-${instrument.id}` ? 'selected' : ''}`}
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
                <ul>
                  {instrument.measurements.map((m) => {
                    const measurementKey = `${station.id}:${instrument.id}:${m.name}`;
                    const isSelected = selectedKey === measurementKey;

                    return (
                      <li
                        key={m.id}
                        className={`selectable measurement ${isSelected ? 'selected' : ''}`}
                        onClick={() =>
                          onSelect(
                            {
                              type: 'measurement',
                              name: m.name,
                              description: m.description,
                              alias: m.alias,
                              units: m.units?.toString(),
                            },
                            measurementKey
                          )
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
