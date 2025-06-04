// src/App/Stack/Graph/Components/Menu/VariableModal/VariableDescription.tsx

import React from 'react';
import './VariableDescription.css';

interface VariableDescriptionProps {
  type: 'station' | 'instrument' | 'measurement';
  description: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const VariableDescription: React.FC<VariableDescriptionProps> = ({
  type,
  description,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="variableDescription">
      <p style={{ whiteSpace: 'pre-wrap' }}>{description}</p>

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
