// File: src/App/Stack/Graph/Components/Menu/ExpandToggle.tsx

import React from 'react';
import './ExpandToggle.css';
import { ArrowBarLeft, ArrowBarRight } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';


/**
 * Props for the ExpandToggle component.
 *
 * @property expanded - Indicates whether the menu is currently expanded.
 * @property onToggle - Callback triggered when the toggle button is clicked.
 * @property className - Optional additional CSS class for styling.
 */
interface ExpandToggleProps {
  expanded: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * A small toggle button for showing or hiding the graph configuration menu.
 */
export default function ExpandToggle({ expanded, onToggle, className }: ExpandToggleProps) {
  const { t } = useTranslation('graph');
  return (
    <button
      className={`expand-toggle ${className || ''}`}
      onClick={onToggle}
      title={expanded ? String(t('MENU.COLLAPSE')) : String(t('MENU.EXPAND'))}
    >
      {expanded ? <ArrowBarLeft size={30} /> : <ArrowBarRight size={30} />}
    </button>
  );
}