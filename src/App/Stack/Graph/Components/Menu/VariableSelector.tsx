// src/App/Stack/Graph/Components/Menu/VariableSelector.tsx
import React, { useState } from 'react';
import VariableModal from './VariableModal/VariableModal';
import './VariableSelector.css';

interface SelectedVariable {
  name: string;
  stationId: number;
  instrumentId: number;
}

interface VariableSelectorProps {
  value: SelectedVariable | null;
  onChange: (variable: SelectedVariable) => void;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleConfirmSelection = (variable: SelectedVariable) => {
    onChange(variable);
    closeModal();
  };

  return (
    <>
      <button className="variable-select-button" onClick={openModal}>
        {value?.name || 'Select Variable'}
      </button>

      <VariableModal
        isOpen={isOpen}
        onClose={closeModal}
        onConfirmSelection={handleConfirmSelection}
      />
    </>
  );
};

export default VariableSelector;
