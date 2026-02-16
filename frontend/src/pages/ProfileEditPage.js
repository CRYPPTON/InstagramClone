import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
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
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #dbdbdb' }}>
      <h2>Edit Profile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="profile_picture">Profile Picture:</label>
          {profileData.profile_picture_url && (
            <img src={api.getMediaUrl(profileData.profile_picture_url)} alt="Current Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', display: 'block', marginBottom: '10px' }} />
          )}
          <input type="file" id="profile_picture" name="profile_picture" onChange={handleFileChange} />
        </div>
        <Input
          label="Full Name"
          type="text"
          name="full_name"
          value={profileData.full_name}
          onChange={handleChange}
          placeholder="Full Name"
        />
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={profileData.bio}
            onChange={handleChange}
            placeholder="Bio"
            rows="3"
            style={{
              border: '1px solid #dbdbdb',
              borderRadius: '3px',
              padding: '9px',
              backgroundColor: '#fafafa',
              width: '100%',
              marginBottom: '10px'
            }}
          ></textarea>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="checkbox"
            id="is_private"
            name="is_private"
            checked={profileData.is_private}
            onChange={handleChange}
          />
          <label htmlFor="is_private">Private Account</label>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>

      <hr style={{ margin: '30px 0' }} />

      <Button onClick={() => navigate('/follow-requests')}>
        View Follow Requests
      </Button>
    </div>
  );
};

export default ProfileEditPage;