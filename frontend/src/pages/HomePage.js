import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Post from '../components/post/Post';
import api from '../services/api';
import PullToRefresh from 'react-simple-pull-to-refresh';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
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

  if (loading && posts.length === 0) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <PullToRefresh onRefresh={fetchPosts}>
      <div style={{ maxWidth: '600px', margin: '0 auto', minHeight: '50vh' }}>
        {posts.length > 0 ? (
          posts.map(post => (
            <Post
              key={post.post_id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
            />
          ))
        ) : (
          <div className="text-center mt-5 p-5 border rounded bg-light">
            <h3>Your timeline is empty</h3>
            <p className="text-muted mb-4">Start by following some users to see their posts here!</p>
            <Link to="/search">
              <Button variant="primary" size="lg">
                Search Users
              </Button>
            </Link>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

export default HomePage;
