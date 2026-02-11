import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [caption, setCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setMediaFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mediaFiles.length === 0) {
      setError('Please select at least one image or video.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('caption', caption);
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });

    try {
      await api.createPost(formData);
      navigate('/'); // Navigate to home page after successful post
    } catch (err) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    return <div>Please log in to create a post.</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #dbdbdb' }}>
      <h2>Create New Post</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="media">Images/Videos (max 20, 50MB each):</label>
          <input
            type="file"
            id="media"
            name="media"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
        </div>
        <Input
          label="Caption"
          type="textarea"
          name="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </form>
    </div>
  );
};

export default CreatePostPage;
