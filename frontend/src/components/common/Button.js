import React from 'react';

const Button = ({ children, onClick, type = 'button', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: '#3897f0',
        color: 'white',
        border: '1px solid #3897f0',
        borderRadius: '4px',
        padding: '5px 9px',
        fontWeight: '600',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
};

export default Button;
