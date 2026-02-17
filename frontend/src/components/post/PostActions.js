import React, { useState, useEffect, useCallback } from 'react';
import { FaHeart, FaRegHeart, FaRegComment, FaRegPaperPlane } from 'react-icons/fa';
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
    <div className="d-flex align-items-center p-2">
      <button onClick={handleLike} className="btn btn-link text-dark" disabled={isLiking}>
        {isLiked ? <FaHeart color="red" size={24} /> : <FaRegHeart size={24} />}
      </button>
      <button className="btn btn-link text-dark">
        <FaRegComment size={24} />
      </button>

      {error && <p className="text-danger ms-2 mb-0">{error}</p>}
    </div>
  );
};

export default PostActions;