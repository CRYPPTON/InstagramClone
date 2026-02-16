import React, { useState, useEffect, useCallback } from 'react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const FollowRequestsPage = () => {
  const { user: authUser } = useAuth();
  const [followRequests, setFollowRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState('');

  const fetchFollowRequests = useCallback(async () => {
    if (!authUser) return;
    try {
      const requests = await api.getFollowRequests(authUser.id);
      setFollowRequests(requests);
    } catch (err) {
      setRequestsError('Failed to load follow requests.');
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchFollowRequests();
  }, [fetchFollowRequests]);

  const handleRequestAction = async (followerId, action) => {
    setRequestsLoading(true);
    setRequestsError('');
    try {
      if (action === 'accept') {
        await api.acceptFollowRequest(authUser.id, followerId);
      } else {
        await api.rejectFollowRequest(authUser.id, followerId);
      }
      fetchFollowRequests(); // Refresh requests list
    } catch (err) {
      setRequestsError(err.message || `Failed to ${action} request.`);
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  if (!authUser) {
    return <div>Please log in to see follow requests.</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #dbdbdb' }}>
      <h2>Follow Requests</h2>
      {requestsError && <p style={{ color: 'red' }}>{requestsError}</p>}
      {requestsLoading ? (
        <div>Loading requests...</div>
      ) : (
        followRequests.length === 0 ? (
          <p>No pending follow requests.</p>
        ) : (
          <div>
            {followRequests.map((request) => (
              <div key={request.follower_id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <img src={api.getMediaUrl(request.profile_picture_url) || 'https://via.placeholder.com/50'} alt="Requester" style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }} />
                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{request.username}</span>
                <Button onClick={() => handleRequestAction(request.follower_id, 'accept')} style={{ marginRight: '5px' }}>Accept</Button>
                <Button onClick={() => handleRequestAction(request.follower_id, 'reject')} variant="secondary">Reject</Button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default FollowRequestsPage;