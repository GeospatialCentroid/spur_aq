// File: src/App/Info/RecentValuesCard.tsx

import React, { useState, useEffect } from 'react';
import VariableModal from '../../Stack/Graph/Components/Menu/VariableModal/VariableModal';
import './RecentValCard.css';

interface RecentValuesCardProps {
  stationData: any[]; // full station dataset (with children and measurements)
}

const RecentValuesCard: React.FC<RecentValuesCardProps> = ({ stationData }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<any>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (stationData && stationData.length > 0) {
      setHasData(true);
    }
  }, [stationData]);

  const handleVariableSelect = (variable: any) => {
    setSelectedVariable(variable);
    setModalOpen(false);
  };

  if (!hasData) {
    return (
      <div className="recent-values-card">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="col-md-4">
      <div className="card h-100">
        <div className="card-body">

          <button onClick={() => setModalOpen(true)} className="open-variable-modal-button">
            {selectedVariable ? `Change Variable (${selectedVariable.name})` : 'Select a Variable'}
          </button>

          {selectedVariable && (
            <div className="selected-variable-display mt-3">
              <p><strong>Selected:</strong> {selectedVariable.name}</p>
              {selectedVariable.units && <p><strong>Units:</strong> {selectedVariable.units}</p>}
              {selectedVariable.description && (
                <div className="variable-description" dangerouslySetInnerHTML={{ __html: selectedVariable.description }} />
              )}
            </div>
          )}

          <VariableModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirmSelection={handleVariableSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default RecentValuesCard;
