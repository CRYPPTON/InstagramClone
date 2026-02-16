import React from 'react';
import Button from '../common/Button';
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
            <Button>Edit Profile</Button>
          </Link>
          <Button onClick={onShowBlockedUsers} style={{ marginLeft: '10px' }}>
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
        return <Button onClick={onUnfollow}>Requested</Button>;
      case 'accepted':
        return <Button onClick={onUnfollow}>Unfollow</Button>;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', marginBottom: '44px' }}>
      <div style={{ marginRight: '30px' }}>
        <img
          src={profilePictureUrl || process.env.PUBLIC_URL + '/noImage.jpg'}
          alt="avatar"
          style={{ width: '150px', height: '150px', borderRadius: '50%' }}
        />
      </div>
      <div>
        <h2>{user.username}</h2>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          {renderFollowButton()}
          {!isOwner && !isBlocked && (
            <Button onClick={onBlock} variant="secondary" style={{ marginLeft: '10px' }}>
              Block
            </Button>
          )}
        </div>
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          <div style={{ marginRight: '40px' }}>
            <strong>{postCount}</strong> posts
          </div>
          <div style={{ marginRight: '40px', cursor: 'pointer' }} onClick={onShowFollowers}>
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
