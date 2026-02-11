import React, { useState, useEffect, useCallback } from 'react';
import Post from '../components/post/Post';
import api from '../services/api';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const fetchedPosts = await api.getPosts();
      setPosts(fetchedPosts);
    } catch (err) {
      setError('Failed to fetch posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.post_id !== deletedPostId));
  };

  const handlePostUpdated = (updatedPostId, newCaption) => {
    setPosts(prevPosts => prevPosts.map(post =>
      post.post_id === updatedPostId ? { ...post, caption: newCaption } : post
    ));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {posts.map(post => (
        <Post
          key={post.post_id}
          post={post}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
        />
      ))}
    </div>
  );
};

export default HomePage;
