// src/App/Stack/Graph/Components/Menu/VariableModal.tsx

import React, { useState } from 'react';
import './VariableModal.css';
import VariableList from './VariableList';
import VariableDescription from './VariableDescription';
import { useConfig } from '../../../../../../context/ConfigContext';

type SelectedItem = {
  type: 'station' | 'instrument' | 'measurement';
  name: string;
  description: string;
  alias?: string;
  units?: string;
};

interface SelectedVariable {
  name: string;
  stationId: number;
  instrumentId: number;
}

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSelection?: (variable: SelectedVariable) => void;
}

const VariableModal: React.FC<VariableModalProps> = ({
  isOpen,
  onClose,
  onConfirmSelection,
}) => {
  const { config } = useConfig();
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  if (!isOpen || !config) return null;

  const handleConfirm = () => {
    if (selected?.type === 'measurement' && selectedKey) {
      const label = selected.alias || selected.name;

      const parts = selectedKey.split(':');
      if (parts.length === 3) {
        const stationId = parseInt(parts[0], 10);
        const instrumentId = parseInt(parts[1], 10);

        onConfirmSelection?.({
          name: label,
          stationId,
          instrumentId,
        });

        onClose();
      } else {
        console.warn('Invalid selectedKey format:', selectedKey);
      }
    }
  };

  const handleCancel = () => {
    setSelected(null);
    setSelectedKey(null);
  };

  const handleSelect = (item: SelectedItem, key: string) => {
    setSelected(item);
    setSelectedKey(key);
  };

  const renderHeaderText = () => {
    if (!selected) return null;
    if (selected.type === 'measurement') {
      const label = selected.alias || selected.name;
      return `${label}${selected.units ? ` (${selected.units})` : ''}`;
    }
    return selected.name;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-section left">
            <h2>Select a Variable</h2>
          </div>

          <div className="modal-header-section center">
            {selected && (
              <span className="selected-alias-header">{renderHeaderText()}</span>
            )}
          </div>

          <div className="modal-header-section right">
            <button className="close-button" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="variableList">
            <VariableList
              stations={config}
              onSelect={handleSelect}
              selectedKey={selectedKey ?? undefined}
            />
          </div>

          {selected ? (
            <VariableDescription
              type={selected.type}
              description={selected.description}
              onConfirm={selected.type === 'measurement' ? handleConfirm : undefined}
              onCancel={selected.type === 'measurement' ? handleCancel : undefined}
            />
          ) : (
            <div className="variableDescription">
              <p>Select a station, instrument, or measurement to view its description.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariableModal;
