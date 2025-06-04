//src\App\Stack\Graph\Components\Menu\VariableSelector.tsx
import React, { useState } from 'react';
import VariableModal from './VariableModal/VariableModal';
import './VariableSelector.css';

interface VariableSelectorProps {
  value: string;
  onChange: (newLabel: string) => void;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleConfirmSelection = (label: string) => {
    onChange(label);
    closeModal();
  };

  return (
    <>
      <button className="variable-select-button" onClick={openModal}>
        {value || 'Select Variable'}
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
