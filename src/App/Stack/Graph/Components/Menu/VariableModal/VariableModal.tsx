""// File: src/App/Stack/Graph/Components/Menu/VariableModal.tsx

/**
 * VariableModal component
 *
 * - Displays a modal UI for selecting a measurement variable from available stations and instruments.
 * - Integrates with the shared configuration context to list all available options.
 * - Shows descriptions and allows confirmation only when a measurement is selected.
 * - Sends the final selection back to the parent through `onConfirmSelection`.
 */

import React, { useState } from 'react';
import './VariableModal.css';
import VariableList from './VariableList';
import VariableDescription from './VariableDescription';
import { useConfig } from '../../../../../../context/ConfigContext';
import { getColorForVariable } from '../../../ColorUtils';
import { SelectedMeasurement, createBlankMeasurement } from '../../../graphTypes';
import { Calibration } from '../../../../../../Types/calibration';

/**
 * Metadata representing a selected item in the hierarchy.
 *
 * @property type - Indicates the type of item selected (station, instrument, or measurement).
 * @property name - The name of the item.
 * @property description - Description of the item.
 * @property alias - Optional shorthand or display name.
 * @property units - Optional units of measurement (for measurements).
 */
type SelectedItem = {
  type: 'station' | 'instrument' | 'measurement';
  name: string;
  description: string;
  alias?: string;
  units?: string;
  calibrations?: Calibration[];
};

/**
 * Props for the VariableModal component.
 *
 * @property isOpen - Controls whether the modal is currently visible.
 * @property onClose - Callback to close the modal.
 * @property onConfirmSelection - Optional callback invoked with selected variable when confirmed.
 */
interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSelection?: (variable: SelectedMeasurement) => void;
}

const VariableModal: React.FC<VariableModalProps> = ({
  isOpen,
  onClose,
  onConfirmSelection,
}) => {
  const { config } = useConfig(); // Station/instrument/measurement data
  const [selected, setSelected] = useState<SelectedItem | null>(null); // Currently highlighted item
  const [selectedKey, setSelectedKey] = useState<string | null>(null); // Key in format "stationId:instrumentId:measurementName"

  // If modal is closed or config isn't ready, don't render anything
  if (!isOpen || !config) return null;

  /**
   * Handles the confirm action — only valid if a measurement is selected.
   * Parses the composite selectedKey and constructs the final SelectedMeasurement.
   */
  const handleConfirm = () => {
    if (selected?.type === 'measurement' && selectedKey) {
      const parts = selectedKey.split(':');
      if (parts.length === 3) {
        const stationId = parseInt(parts[0], 10);
        const instrumentId = parseInt(parts[1], 10);

        const measurement: SelectedMeasurement = {
          ...createBlankMeasurement(),
          name: selected.name,
          alias: selected.alias || selected.name,
          description: selected.description,
          stationId,
          instrumentId,
          units: selected.units ?? '',
          calibrations: selected.calibrations ?? []
        };

        onConfirmSelection?.(measurement);
        onClose();
      } else {
        console.warn('Invalid selectedKey format:', selectedKey);
      }
    }
  };

  /**
   * Clears selection and key when canceling.
   */
  const handleCancel = () => {
    setSelected(null);
    setSelectedKey(null);
  };

  /**
   * Updates selection state when an item is clicked in the list.
   */
  const handleSelect = (item: SelectedItem, key: string) => {
    setSelected(item);
    setSelectedKey(key);
  };

  /**
   * Returns formatted display string for the header based on selection.
   */
  const renderHeaderText = () => {
    if (!selected) return null;
    if (selected.type === 'measurement') {
      const label = selected.alias || selected.name;
      return `${label}${selected.units ? ` (${selected.units})` : ''}`;
    }
    return selected.name;
  };

  /**
   * Dynamically computes highlight color for selected measurement.
   */
  const getSelectedColor = (): string | undefined => {
    if (selected?.type !== 'measurement') return undefined;
    return getColorForVariable(selected.alias || selected.name);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
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

        {/* Modal Body */}
        <div className="modal-body">
          <div className="variableList">
            <VariableList
              stations={config}
              onSelect={handleSelect}
              selectedKey={selectedKey ?? undefined}
              selectedColor={getSelectedColor()}
            />
          </div>

          {selected ? (
            <VariableDescription
              type={selected.type}
              description={selected.description}
              onConfirm={selected.type === 'measurement' ? handleConfirm : undefined}
              onCancel={selected.type === 'measurement' ? handleCancel : undefined}
              highlightColor={
                selected.type === 'measurement'
                  ? getColorForVariable(selected.alias || selected.name)
                  : undefined
              }
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
