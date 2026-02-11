import React, { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // To get authenticated user ID

const PostActions = ({ postId, initialLikeCount, onLikeUpdate }) => {
  const { user: authUser } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState('');

  const checkLike = useCallback(async () => {
    if (!authUser) return;
    try {
      const res = await api.checkLikeStatus(postId);
      setIsLiked(res.liked);
    } catch (err) {
      // It's okay if this fails, just means we don't know the like status
      console.error(err);
    }
  }, [authUser, postId]);

  useEffect(() => {
    checkLike();
  }, [checkLike]);


  const handleLike = async () => {
    if (!authUser) {
      setError('Please log in to like posts.');
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      let newLikeCount;
      if (isLiked) {
        await api.unlikePost(postId);
        newLikeCount = likeCount - 1;
        setLikeCount(newLikeCount);
        setIsLiked(false);
      } else {
        await api.likePost(postId);
        newLikeCount = likeCount + 1;
        setLikeCount(newLikeCount);
        setIsLiked(true);
      }
      if (onLikeUpdate) {
        onLikeUpdate(newLikeCount);
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to toggle like.');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div style={{ padding: '10px', display: 'flex', alignItems: 'center' }}>
      <Button onClick={handleLike} style={{ marginRight: '10px' }} disabled={isLiking}>
        {isLiked ? 'Unlike' : 'Like'}
      </Button>
      <strong>{likeCount} likes</strong>
      {error && <p style={{ color: 'red', marginLeft: '10px' }}>{error}</p>}
      {/* Comment and Share buttons could go here */}
      <button style={{ marginLeft: '10px' }}>Comment</button>
      <button style={{ marginLeft: '10px' }}>Share</button>
    </div>
  );
};

export default PostActions;