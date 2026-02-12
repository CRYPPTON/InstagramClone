import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Post from '../components/post/Post';
import api from '../services/api';

const PostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPost = useCallback(async () => {
    try {
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
      <Post post={post} />
    </div>
  );
};

export default PostPage;
