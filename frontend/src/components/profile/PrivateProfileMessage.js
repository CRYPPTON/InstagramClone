import React from 'react';
import { Button } from 'react-bootstrap';

const PrivateProfileMessage = ({ onFollow, followStatus }) => {
  return (
    <div className="text-center p-5">
      <h3>This Account is Private</h3>
      <p>Follow this account to see their photos and videos.</p>
      {followStatus === 'none' && (
        <Button onClick={onFollow}>Follow</Button>
      )}
      {followStatus === 'pending' && (
        <Button disabled>Requested</Button>
      )}
    </div>
  );
};

export default PrivateProfileMessage;
