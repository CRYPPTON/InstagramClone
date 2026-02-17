import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
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
    <Container className="mt-5">
      <h2>Create New Post</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Images/Videos (max 20, 50MB each):</Form.Label>
          <Form.Control
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Caption</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
          />
        </Form.Group>
        
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </Form>
    </Container>
  );
};

export default CreatePostPage;
