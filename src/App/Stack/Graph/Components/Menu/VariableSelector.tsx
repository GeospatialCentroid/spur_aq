// File: src/App/Stack/Graph/Components/Menu/VariableSelector.tsx

/**
 * VariableSelector component
 *
 * - Renders a button to trigger a modal for selecting a measurement variable.
 * - Uses a modal to present available variable options to the user.
 * - Notifies the parent component of the selected variable via `onChange`.
 * - Can be instructed to open immediately on mount (used when a variable is just added).
 */

import React, { useEffect, useState } from 'react';
import VariableModal from './VariableModal/VariableModal';
import './VariableSelector.css';
import { getColorForVariable } from '../../ColorUtils';
import { XLg } from 'react-bootstrap-icons';
import { SelectedMeasurement } from '../../graphTypes';

/**
 * Props for the VariableSelector component.
 *
 * @property value - Currently selected variable (or null).
 * @property onChange - Callback to update the selected variable.
 * @property onRemove - Optional callback for removing the variable.
 * @property openOnMount - If true, modal will open immediately on first render.
 */
interface VariableSelectorProps {
  value: SelectedMeasurement | null;
  onChange: (variable: SelectedMeasurement) => void;
  onRemove?: () => void;
  openOnMount?: boolean;
}

/**
 * Renders a button that opens a modal for selecting a measurement variable.
 */
const VariableSelector: React.FC<VariableSelectorProps> = ({
  value,
  onChange,
  onRemove,
  openOnMount,
}) => {
  const [isOpen, setIsOpen] = useState(false); // Tracks if the modal is open

  // Open the modal immediately on first mount if instructed
  useEffect(() => {
    if (openOnMount) {
      setIsOpen(true);
    }
  }, [openOnMount]);

  // Opens the modal manually
  const openModal = () => setIsOpen(true);

  // Closes the modal
  const closeModal = () => setIsOpen(false);

  // Handles confirmation of variable selection from the modal
  const handleConfirmSelection = (variable: SelectedMeasurement) => {
    onChange(variable);
    closeModal();
  };

  return (
    <>
      {/* Wrapper around the selection button and optional remove button */}
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

        {/* Optional remove button */}
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
