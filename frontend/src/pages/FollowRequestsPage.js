import React, { useState, useEffect, useCallback } from 'react';
import { Button, Image, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import { Link } from 'react-router-dom';

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
    <Container className="mt-5">
      <h2>Follow Requests</h2>
      {requestsError && <p className="text-danger">{requestsError}</p>}
      {requestsLoading ? (
        <div>Loading requests...</div>
      ) : (
        followRequests.length === 0 ? (
          <p>No pending follow requests.</p>
        ) : (
          <div>
            {followRequests.map((request) => (
              <div key={request.follower_id} className="d-flex align-items-center mb-3">
                <Image src={getImageUrl(request.profile_picture_url) || process.env.PUBLIC_URL + '/noImage.jpg'} alt="Requester" roundedCircle width="50" height="50" className="me-3" />
                <Link to={`/profile/${request.username}`} className="fw-bold me-auto">{request.username}</Link>
                <Button onClick={() => handleRequestAction(request.follower_id, 'accept')} className="me-2">Accept</Button>
                <Button onClick={() => handleRequestAction(request.follower_id, 'reject')} variant="secondary">Reject</Button>
              </div>
            ))}
          </div>
        )
      )}
    </Container>
  );
};

export default FollowRequestsPage;