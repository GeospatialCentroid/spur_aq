// File: src/App/Stack/Graph/Components/Menu/VariableSelector.tsx

/**
 * VariableSelector component
 *
 * - Renders a button to trigger a modal for selecting a measurement variable.
 * - Uses a modal to present available variable options to the user.
 * - Notifies the parent component of the selected variable via `onChange`.
 */

import React, { useState } from 'react';
import VariableModal from './VariableModal/VariableModal';
import './VariableSelector.css';
import { getColorForVariable } from '../../ColorUtils';
import { XLg } from 'react-bootstrap-icons';

/**
 * Represents a user-selected variable.
 *
 * @property name - Name of the variable (e.g., "PM2.5").
 * @property stationId - ID of the station the variable comes from.
 * @property instrumentId - ID of the instrument that measures the variable.
 */
interface SelectedVariable {
  name: string;
  stationId: number;
  instrumentId: number;
}

/**
 * Props for the VariableSelector component.
 *
 * @property value - Currently selected variable (or null).
 * @property onChange - Callback to update the selected variable.
 */
interface VariableSelectorProps {
  value: SelectedVariable | null;
  onChange: (variable: SelectedVariable) => void;
  onRemove?: () => void;
}

/**
 * Renders a button that opens a modal for selecting a measurement variable.
 */
const VariableSelector: React.FC<VariableSelectorProps> = ({
  value,
  onChange,
  onRemove,
}) => {
  const [isOpen, setIsOpen] = useState(false); // Tracks if the modal is open

  // Opens the modal
  const openModal = () => setIsOpen(true);

  // Closes the modal
  const closeModal = () => setIsOpen(false);

  // Handles confirmation of variable selection from the modal
  const handleConfirmSelection = (variable: SelectedVariable) => {
    onChange(variable);
    closeModal();
  };

  return (
    <>
      {/* Button shows current variable or fallback text */}
      <div className="variable-selector-wrapper">
        {/* Button shows current variable or fallback text */}
        <button
          className="variable-select-button"
          onClick={openModal}
          style={
            value?.name
              ? {
                backgroundColor: getColorForVariable(value.name),
                color: 'white',
              }
              : undefined
          }
        >
          {value?.name || 'Select Variable'}
        </button>

        {onRemove && (
          <button
            className="remove-variable-button"
            onClick={onRemove}
            aria-label="Remove variable"
          >
            <XLg size={16} style={{ stroke: 'currentColor', strokeWidth: 1 }} />
          </button>
        )}
      </div>



      {/* Modal for choosing the variable */}
      <VariableModal
        isOpen={isOpen}
        onClose={closeModal}
        onConfirmSelection={handleConfirmSelection}
      />
    </>
  );
};

export default VariableSelector;
