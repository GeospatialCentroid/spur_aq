// File: src/App/Stack/Graph/Components/ControlBar/CloseButton.tsx

import React from 'react';
import { XLg } from 'react-bootstrap-icons';
import './CloseButton.css';
import { useTranslation } from 'react-i18next';

interface CloseButtonProps {
  onClick: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClick }) => {
  const { t } = useTranslation('common'); 
  return (
    <button
      className="delete-btn"
      onClick={onClick}
      aria-label={t('A11Y.REMOVE_GRAPH') as string}
    >
      <XLg size={16} style={{ stroke: 'currentColor', strokeWidth: 1 }} />
    </button>
  );
};

export default CloseButton;
