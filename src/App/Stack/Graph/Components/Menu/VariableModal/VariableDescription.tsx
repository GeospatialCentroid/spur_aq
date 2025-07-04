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
 * @property highlightColor - Color passed from ColorUtil -> Menu -> here, determines the color of the confirm button.
 */
interface VariableDescriptionProps {
  type: 'station' | 'instrument' | 'measurement';
  description: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  highlightColor?: string;
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
  highlightColor,
}) => {
  return (
    <div className="variableDescription">
      {/* Show multi-line description with preserved line breaks */}
      <p style={{ whiteSpace: 'pre-wrap' }}>{description}</p>

      {/* Only show Confirm/Cancel if a measurement is selected and handlers are defined */}
      {type === 'measurement' && onConfirm && onCancel && (
        <div className="description-actions">
          <button
            className="confirm-button btn btn-primary"
            onClick={onConfirm}
            style={
              highlightColor
                ? {
                  backgroundColor: highlightColor,
                  color: 'white',
                  borderColor: highlightColor, // Ensures border matches if Bootstrap is used
                }
                : undefined
            }
          >
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
