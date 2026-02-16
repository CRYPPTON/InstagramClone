import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Post from '../components/post/Post';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedPost = await api.getPost(postId);
      setPost(fetchedPost);
    } catch (err) {
      setError('Failed to fetch post.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleBack = (e) => {
    e.preventDefault();
    navigate(-1);
  };

  const handlePostDeleted = () => {
    if (authUser) {
      navigate(`/profile/${authUser.username}`);
    } else {
      navigate('/');
    }
  };

  const handlePostUpdated = () => {
    fetchPost(); // Re-fetch post data
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!post) {
    return <div>Post not found.</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
      <a href="#" onClick={handleBack} style={{ display: 'block', marginBottom: '20px', color: '#00376b', textDecoration: 'none' }}>
        &larr; Back
      </a>
      <Post post={post} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
    </div>
  );
};

export default PostPage;
