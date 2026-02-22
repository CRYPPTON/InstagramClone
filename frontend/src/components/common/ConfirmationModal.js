import React from 'react';
import './ConfirmationModal.css';

// Test actions
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirmation-modal-backdrop">
      <div className="confirmation-modal-content">
        <p>{message}</p>
        <div className="confirmation-modal-actions">
          <button onClick={onConfirm} className="btn btn-primary">Confirm</button>
          <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
