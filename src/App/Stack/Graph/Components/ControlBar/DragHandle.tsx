// File: src/App/Stack/Graph/Components/ControlBar/DragHandle.tsx

/**
 * DragHandle component
 *
 * - Renders a vertical grip icon used for reordering graph panels via drag-and-drop.
 * - Meant to be used in combination with a sortable container like ReactSortable.
 * - The `drag-handle` class allows it to be recognized by the `handle` prop in sorting.
 */

import React from 'react';
import { GripVertical } from 'react-bootstrap-icons';
import './DragHandle.css';
import { useTranslation } from 'react-i18next';

/**
 * A visual handle element that allows the graph to be dragged to reorder.
 */
const DragHandle: React.FC = () => {
  const { t } = useTranslation('common'); // ✅ Hook inside component, and probably "common" ns

  return (
    <div className="drag-handle" aria-label={String(t('A11Y.DRAG_GRAPH'))}>
      <GripVertical />
    </div>
  );
};

export default DragHandle;
