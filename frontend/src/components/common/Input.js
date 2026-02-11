import React from 'react';

const Input = ({ type, value, onChange, placeholder }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        border: '1px solid #dbdbdb',
        borderRadius: '3px',
        padding: '9px',
        backgroundColor: '#fafafa',
        width: '100%',
        marginBottom: '10px'
      }}
    />
  );
};

export default Input;
