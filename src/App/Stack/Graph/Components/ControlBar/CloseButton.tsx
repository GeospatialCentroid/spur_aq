import React from 'react';
import { X } from 'react-bootstrap-icons';
import './CloseButton.css'

interface CloseButtonProps {
    onClick: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClick }) => (
    <button className="delete-btn" onClick={onClick} aria-label="Remove graph">
        <X />
    </button>
);

export default CloseButton;
