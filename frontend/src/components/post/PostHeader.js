import React from 'react';
import { getImageUrl } from '../../services/api';

const PostHeader = ({ username, avatar }) => {
  const avatarUrl = getImageUrl(avatar);
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
      <img src={avatarUrl} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '10px' }} />
      <strong>{username}</strong>
    </div>
  );
};

export default PostHeader;
