import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Modal, Image } from 'react-bootstrap';
import ProfileHeader from '../components/profile/ProfileHeader';
import PostGrid from '../components/profile/PostGrid';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BlockedUsersList from '../components/profile/BlockedUsersList';
import PrivateProfileMessage from '../components/profile/PrivateProfileMessage';

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockSuccess, setBlockSuccess] = useState(false);
  const [followStatus, setFollowStatus] = useState('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

  const fetchProfileAndStatus = useCallback(async () => {
    try {
      const profileUsername = username || (authUser ? authUser.username : '');
      if (!profileUsername) {
        setError('User not found.');
        setLoading(false);
        return;
      }

      const fetchedProfile = await api.getProfile(profileUsername);
      setProfile(fetchedProfile);

      if (authUser && authUser.id !== fetchedProfile.id) {
        const statusResponse = await api.checkFollowStatus(fetchedProfile.id, authUser.id);
        setFollowStatus(statusResponse.status);

        const blockResponse = await api.checkBlockStatus(authUser.id, fetchedProfile.id);
        setIsBlocked(blockResponse.isBlocked);
      } else if (authUser && authUser.id === fetchedProfile.id) {
        setFollowStatus('owner');
        setIsBlocked(false);
      }
    } catch (err) {
      setError('Failed to fetch profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [username, authUser]);

  useEffect(() => {
    fetchProfileAndStatus();
  }, [fetchProfileAndStatus]);

  useEffect(() => {
    if (blockSuccess) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000); // 2-second delay before redirecting
      return () => clearTimeout(timer);
    }
  }, [blockSuccess, navigate]);

  const handleFollow = async () => {
    if (!authUser || !profile) return;
    try {
      await api.followUser(profile.id);
      setFollowStatus(profile.is_private ? 'pending' : 'accepted');
      fetchProfileAndStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnfollow = async () => {
    if (!authUser || !profile) return;
    try {
      await api.unfollowUser(profile.id);
      setFollowStatus('none');
      fetchProfileAndStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBlock = async () => {
    if (!authUser || !profile) return;
    try {
      await api.blockUser(profile.id);
      setBlockSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnblock = async (userIdToUnblock) => {
    if (!authUser) return;
    try {
      await api.unblockUser(userIdToUnblock);
      if (profile && userIdToUnblock === profile.id) {
        setIsBlocked(false);
      }
      fetchProfileAndStatus();
      if (showBlockedUsers) {
        handleShowBlockedUsers();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowFollowers = async () => {
    if (!profile) return;
    try {
      const followersList = await api.getFollowers(profile.id);
      setFollowers(followersList);
      setShowFollowers(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowFollowing = async () => {
    if (!profile) return;
    try {
      const followingList = await api.getFollowing(profile.id);
      setFollowing(followingList);
      setShowFollowing(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowBlockedUsers = async () => {
    if (!authUser) return;
    try {
      const blockedUsersList = await api.getBlockedUsers(authUser.id);
      setBlockedUsers(blockedUsersList);
      setShowBlockedUsers(true);
    } catch (err) {
      setError(err.message);
    }
  };


  const handleFollowFromModal = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        await api.unfollowUser(userId);
      } else {
        await api.followUser(userId);
      }
      fetchProfileAndStatus();
      // Refresh the lists
      if (showFollowers) handleShowFollowers();
      if (showFollowing) handleShowFollowing();
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePostDeleted = (deletedPostId) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      posts: prevProfile.posts.filter((post) => post.post_id !== deletedPostId),
      postCount: prevProfile.postCount - 1,
    }));
  };

  const handlePostUpdated = (updatedPostId, newCaption, newLikeCount) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      posts: prevProfile.posts.map((post) =>
        post.post_id === updatedPostId ? { ...post, caption: newCaption, like_count: newLikeCount } : post
      ),
    }));
  };

  const handleRemoveFollower = async (profileUserId, followerId, followerUsername) => {
    if (!authUser || !profile) return;
    if (window.confirm(`Are you sure you want to remove ${followerUsername} from your followers?`)) {
      try {
        await api.removeFollower(profileUserId, followerId);
        // Refresh the followers list
        await handleShowFollowers(); // This will re-fetch and update the state
        setProfile(prevProfile => ({
          ...prevProfile,
          followerCount: prevProfile.followerCount - 1
        }));
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to remove follower.');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (blockSuccess) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>User successfully blocked. You will be redirected to the home page shortly.</div>;
  }

  if (error) {
    return <div className="text-danger text-center mt-3">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center mt-3">User not found.</div>;
  }

  const isOwner = authUser && authUser.id === profile.id;
  const canViewProfile = !profile.is_private || isOwner || followStatus === 'accepted';

  return (
    <Container>
      <ProfileHeader
        user={profile}
        postCount={profile.posts.length}
        followersCount={profile.followerCount}
        followingCount={profile.followingCount}
        isOwner={isOwner}
        followStatus={followStatus}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        isBlocked={isBlocked}
        onBlock={handleBlock}
        onUnblock={() => handleUnblock(profile.id)}
        onShowFollowers={canViewProfile ? handleShowFollowers : () => {}}
        onShowFollowing={canViewProfile ? handleShowFollowing : () => {}}
        onShowBlockedUsers={handleShowBlockedUsers}
        api={api}
      />

      <hr />

      {canViewProfile ? (
        <PostGrid
          posts={profile.posts}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
        />
      ) : (
        <PrivateProfileMessage onFollow={handleFollow} followStatus={followStatus} />
      )}

      <Modal show={showFollowers} onHide={() => setShowFollowers(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Followers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {followers.map((follower) => (
            <div key={follower.id} className="d-flex align-items-center mb-3">
              <Image src={api.getMediaUrl(follower.profile_picture_url) || '/noImage.jpg'} alt="avatar" roundedCircle width="50" height="50" className="me-3" />
              <Link to={`/profile/${follower.username}`}>{follower.username}</Link>
              {isOwner && (
                <Button onClick={() => handleRemoveFollower(profile.id, follower.id, follower.username)} variant="danger" size="sm" className="ms-auto">
                  Remove
                </Button>
              )}
              {!isOwner && authUser && authUser.id !== follower.id && (
                <Button onClick={() => handleFollowFromModal(follower.id, following.some(f => f.id === follower.id))} size="sm" className="ms-auto">
                  {following.some(f => f.id === follower.id) ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          ))}
        </Modal.Body>
      </Modal>

      <Modal show={showFollowing} onHide={() => setShowFollowing(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Following</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {following.map((follow) => (
            <div key={follow.id} className="d-flex align-items-center mb-3">
              <Image src={api.getMediaUrl(follow.profile_picture_url) || '/noImage.jpg'} alt="avatar" roundedCircle width="50" height="50" className="me-3" />
              <Link to={`/profile/${follow.username}`}>{follow.username}</Link>
              {authUser && authUser.id !== follow.id && (
                <Button onClick={() => handleFollowFromModal(follow.id, true)} size="sm" className="ms-auto">
                  Unfollow
                </Button>
              )}
            </div>
          ))}
        </Modal.Body>
      </Modal>

      <Modal show={showBlockedUsers} onHide={() => setShowBlockedUsers(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Blocked Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BlockedUsersList blockedUsers={blockedUsers} onUnblock={handleUnblock} />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProfilePage;

