// File: src/App/Stack/Graph/Components/Menu/VariableModal/VariableDescription.tsx

/**
 * VariableDescription component
 *
 * - Displays the description of the selected station, instrument, or measurement.
 * - If a measurement is selected and confirmation handlers are provided, shows Confirm/Cancel buttons.
 */

import React from 'react';
import './VariableDescription.css';

/**
 * Props for the VariableDescription component.
 *
 * @property type - Type of the selected item ("station", "instrument", or "measurement").
 * @property description - Text description of the selected item.
 * @property onConfirm - Optional callback to confirm the selection (only used for measurements).
 * @property onCancel - Optional callback to cancel the selection (only used for measurements).
 */
interface VariableDescriptionProps {
  type: 'station' | 'instrument' | 'measurement';
  description: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Renders the description of a selected item.
 * If a measurement is selected, shows action buttons to confirm or cancel.
 */
const VariableDescription: React.FC<VariableDescriptionProps> = ({
  type,
  description,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="variableDescription">
      {/* Show multi-line description with preserved line breaks */}
      <p style={{ whiteSpace: 'pre-wrap' }}>{description}</p>

      {/* Only show Confirm/Cancel if a measurement is selected and handlers are defined */}
      {type === 'measurement' && onConfirm && onCancel && (
        <div className="description-actions">
          <button onClick={onConfirm} className="btn btn-primary">
            Confirm
          </button>
          <button onClick={onCancel} className="btn btn-secondary ml-2">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default VariableDescription;
