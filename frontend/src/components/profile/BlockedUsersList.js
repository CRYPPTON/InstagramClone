import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Image } from 'react-bootstrap';
import { getImageUrl } from '../../services/api';

const BlockedUsersList = ({ blockedUsers, onUnblock }) => {
  return (
    <div>
      <h2>Blocked Users</h2>
      {blockedUsers.map((user) => (
        <div key={user.id} className="d-flex align-items-center mb-3">
          <Image src={getImageUrl(user.profile_picture_url) || 'https://via.placeholder.com/50'} alt="avatar" roundedCircle width="50" height="50" className="me-3" />
          <Link to={`/profile/${user.username}`}>{user.username}</Link>
          <Button onClick={() => onUnblock(user.id)} variant="danger" size="sm" className="ms-auto">
            Unblock
          </Button>
        </div>
      ))}
    </div>
  );
};

export default BlockedUsersList;
