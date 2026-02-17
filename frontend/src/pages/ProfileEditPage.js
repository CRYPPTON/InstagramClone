import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Alert, Image } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: '',
    bio: '',
    is_private: false,
    profile_picture_url: '',
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!authUser) return;
    try {
      const userProfile = await api.getProfile(authUser.username);
      setProfileData({
        full_name: userProfile.full_name || '',
        bio: userProfile.bio || '',
        is_private: userProfile.is_private || false,
        profile_picture_url: userProfile.profile_picture_url || '',
      });
    } catch (err) {
      setError('Failed to load profile data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setProfilePictureFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('full_name', profileData.full_name);
    formData.append('bio', profileData.bio);
    formData.append('is_private', profileData.is_private);
    if (profilePictureFile) {
      formData.append('profile_picture', profilePictureFile);
    }

    try {
      await api.updateProfile(authUser.id, formData);
      await refreshUser(); // Refresh user data in context
      navigate(`/profile/${authUser.username}`);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    return <div>Please log in to edit your profile.</div>;
  }

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  return (
    <Container className="mt-5">
      <Card>
        <Card.Header as="h2">Edit Profile</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Profile Picture</Form.Label>
              {profileData.profile_picture_url && (
                <Image src={api.getMediaUrl(profileData.profile_picture_url)} alt="Current Profile" roundedCircle width="100" height="100" className="d-block mb-2" />
              )}
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="full_name"
                value={profileData.full_name}
                onChange={handleChange}
                placeholder="Full Name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={profileData.bio}
                onChange={handleChange}
                placeholder="Bio"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="is_private"
                name="is_private"
                label="Private Account"
                checked={profileData.is_private}
                onChange={handleChange}
              />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Form>

          <hr className="my-4" />

          <Button variant="secondary" onClick={() => navigate('/follow-requests')}>
            View Follow Requests
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProfileEditPage;