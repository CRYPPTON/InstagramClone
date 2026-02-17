import React from 'react';
import { Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../services/api';

const PostHeader = ({ username, avatar }) => {
  const avatarUrl = getImageUrl(avatar);
  return (
    <div className="d-flex align-items-center">
      <Image src={avatarUrl || process.env.PUBLIC_URL + '/noImage.jpg'} alt="avatar" roundedCircle style={{ width: '32px', height: '32px' }} className="me-2" />
      <Link to={`/profile/${username}`} className="fw-bold text-dark text-decoration-none">
        {username}
      </Link>
    </div>
  );
};

export default PostHeader;
