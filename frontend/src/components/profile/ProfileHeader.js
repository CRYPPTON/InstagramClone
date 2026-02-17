import React from 'react';
import { Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ProfileHeader = ({
  user,
  postCount,
  followersCount,
  followingCount,
  isOwner,
  followStatus,
  onFollow,
  onUnfollow,
  isBlocked,
  onBlock,
  onUnblock,
  onShowFollowers,
  onShowFollowing,
  onShowBlockedUsers,
  api,
}) => {
  const profilePictureUrl = api.getMediaUrl(user.profile_picture_url);

  const renderFollowButton = () => {
    if (isOwner) {
      return (
        <>
          <Link to="/accounts/edit">
            <Button variant="light">Edit Profile</Button>
          </Link>
          <Button onClick={onShowBlockedUsers} variant="light" className="ms-2">
            Blocked Users
          </Button>
        </>
      );
    }

    if (isBlocked) {
      return <Button onClick={onUnblock} variant="danger">Unblock</Button>;
    }

    switch (followStatus) {
      case 'none':
        return <Button onClick={onFollow}>Follow</Button>;
      case 'pending':
        return <Button onClick={onUnfollow} variant="secondary">Requested</Button>;
      case 'accepted':
        return <Button onClick={onUnfollow}>Unfollow</Button>;
      default:
        return null;
    }
  };

  return (
    <div className="d-flex mb-5">
      <div className="me-5">
        <Image
          src={profilePictureUrl || process.env.PUBLIC_URL + '/noImage.jpg'}
          alt="avatar"
          roundedCircle
          style={{ width: '150px', height: '150px' }}
        />
      </div>
      <div>
        <h2>{user.username}</h2>
        <div className="d-flex align-items-center mb-3">
          {renderFollowButton()}
          {!isOwner && !isBlocked && (
            <Button onClick={onBlock} variant="secondary" className="ms-2">
              Block
            </Button>
          )}
        </div>
        <div className="d-flex mb-3">
          <div className="me-4">
            <strong>{postCount}</strong> posts
          </div>
          <div className="me-4" style={{ cursor: 'pointer' }} onClick={onShowFollowers}>
            <strong>{followersCount}</strong> followers
          </div>
          <div style={{ cursor: 'pointer' }} onClick={onShowFollowing}>
            <strong>{followingCount}</strong> following
          </div>
        </div>
        <div>
          <strong>{user.full_name}</strong>
          <p>{user.bio}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
