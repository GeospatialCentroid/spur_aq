// src/App/Stack/Graph/Components/Menu/VariableSelector.tsx

import React, { useState } from 'react';
import VariableModal from './VariableModal/VariableModal';
import './VariableSelector.css';

const VariableSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null); // ✅ Track confirmed label

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleConfirmSelection = (label: string) => {
    setSelectedLabel(label);
    closeModal();
  };

  return (
    <>
      <button className="variable-select-button" onClick={openModal}>
        {selectedLabel || 'Select Variable'}
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
