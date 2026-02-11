import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProfileHeader from '../components/profile/ProfileHeader';
import PostGrid from '../components/profile/PostGrid';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followStatus, setFollowStatus] = useState('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

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
      setIsBlocked(true);
      setFollowStatus('none');
      fetchProfileAndStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnblock = async () => {
    if (!authUser || !profile) return;
    try {
      await api.unblockUser(profile.id);
      setIsBlocked(false);
      fetchProfileAndStatus();
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!profile) {
    return <div>User not found.</div>;
  }

  const isOwner = authUser && authUser.id === profile.id;

  return (
    <div style={{ maxWidth: '935px', margin: '0 auto' }}>
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
        onUnblock={handleUnblock}
        onShowFollowers={handleShowFollowers}
        onShowFollowing={handleShowFollowing}
      />
      <PostGrid
        posts={profile.posts}
        onPostDeleted={handlePostDeleted}
        onPostUpdated={handlePostUpdated}
      />
      {showFollowers && (
        <Modal onClose={() => setShowFollowers(false)}>
          <h2>Followers</h2>
          {followers.map((follower) => (
            <div key={follower.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <img src={getImageUrl(follower.profile_picture_url) || 'https://via.placeholder.com/50'} alt="avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }} />
              <Link to={`/profile/${follower.username}`}>{follower.username}</Link>
              {authUser && authUser.id !== follower.id && (
                <Button onClick={() => handleFollowFromModal(follower.id, following.some(f => f.id === follower.id))} style={{ marginLeft: 'auto' }}>
                  {following.some(f => f.id === follower.id) ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          ))}
        </Modal>
      )}
      {showFollowing && (
        <Modal onClose={() => setShowFollowing(false)}>
          <h2>Following</h2>
          {following.map((follow) => (
            <div key={follow.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <img src={getImageUrl(follow.profile_picture_url) || 'https://via.placeholder.com/50'} alt="avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }} />
              <Link to={`/profile/${follow.username}`}>{follow.username}</Link>
              {authUser && authUser.id !== follow.id && (
                <Button onClick={() => handleFollowFromModal(follow.id, true)} style={{ marginLeft: 'auto' }}>
                  Unfollow
                </Button>
              )}
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;
