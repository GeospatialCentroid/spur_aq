// File: src/App/Stack/Graph/Components/Menu/IntervalSelector.tsx

/**
 * Dropdown selector for choosing the graph data interval.
 *
 * @property value - The currently selected interval.
 * @property onChange - Callback triggered when the interval changes.
 */

import React from 'react';
import './IntervalSelector.css'
import { useMode } from '../../../../../context/ModeContext'; // adjust the path
import { useTranslation } from 'react-i18next';


interface IntervalSelectorProps {
  value: string;
  onChange: (interval: string) => void;
}

const IntervalSelector: React.FC<IntervalSelectorProps> = ({ value, onChange }) => {
 const { mode } = useMode();
 const { t } = useTranslation('graph');
  return (
    <select
      className="interval-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={String(t('INTERVAL.LABEL'))}
    >
      {mode === 'researcher' && <option value="0">{t('INTERVAL.RAW_DATA')}</option>}
      <option value="1">{t('INTERVAL.ONE_MIN')}</option>
      <option value="5">{t('INTERVAL.FIVE_MINS')}</option>
      <option value="10">{t('INTERVAL.TEN_MINS')}</option>
      <option value="60">{t('INTERVAL.SIXTY_MINS')}</option>
    </select>
  );
};

export default IntervalSelector;
