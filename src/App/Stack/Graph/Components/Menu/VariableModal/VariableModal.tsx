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

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSelection?: (label: string) => void;
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
    if (selected?.type === 'measurement' && selected.alias) {
      onConfirmSelection?.(selected.alias);
      onClose();
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
    if (selected.type === 'measurement' && selected.alias) {
      return `${selected.alias}${selected.units ? ` (${selected.units})` : ''}`;
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
              description={selected.description} // ✅ full description text now passed
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
