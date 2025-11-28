import React from 'react';

interface ConfirmationModalProps {
    letter: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ letter, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Guess</h2>
                <div className="selected-letter">{letter}</div>
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onCancel}>Cancel</button>
                    <button className="btn-confirm" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
};
