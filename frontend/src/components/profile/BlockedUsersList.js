import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { getImageUrl } from '../../services/api';

const BlockedUsersList = ({ blockedUsers, onUnblock }) => {
  return (
    <div>
      <h2>Blocked Users</h2>
      {blockedUsers.map((user) => (
        <div key={user.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <img src={getImageUrl(user.profile_picture_url) || 'https://via.placeholder.com/50'} alt="avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }} />
          <Link to={`/profile/${user.username}`}>{user.username}</Link>
          <Button onClick={() => onUnblock(user.id)} style={{ marginLeft: 'auto' }} variant="danger">
            Unblock
          </Button>
        </div>
      ))}
    </div>
  );
};

export default BlockedUsersList;
