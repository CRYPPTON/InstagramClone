import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Form, Container, ListGroup, Image } from 'react-bootstrap';
import api, { getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const results = await api.searchUsers(searchQuery);
        setSearchResults(results);
      } catch (err) {
        setError(err.message || 'Failed to search users.');
      } finally {
        setLoading(false);
      }
    };

    const debounceSearch = setTimeout(() => {
      if (isAuthenticated) { // Only search if authenticated
        fetchSearchResults();
      } else {
        setError('Please log in to search for users.');
      }
    }, 500); // Debounce search to avoid too many requests

    return () => clearTimeout(debounceSearch);
  }, [searchQuery, isAuthenticated]);

  return (
    <Container className="mt-5">
      <h2>Search Users</h2>
      <Form.Control
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by username or full name..."
        className="mb-3"
      />
      {error && <p className="text-danger">{error}</p>}
      {loading ? (
        <div>Searching...</div>
      ) : (
        <ListGroup>
          {searchResults.length === 0 && searchQuery.trim() && !error ? (
            <p>No users found.</p>
          ) : (
            searchResults.map((user) => (
              <ListGroup.Item key={user.id} as={Link} to={`/profile/${user.username}`} className="d-flex align-items-center">
                <Image src={getImageUrl(user.profile_picture_url) || '/noImage.jpg'} alt="Profile" roundedCircle width="50" height="50" className="me-3" />
                <div>
                  <div className="fw-bold">{user.username}</div>
                  {user.full_name && <div className="text-muted">{user.full_name}</div>}
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      )}
    </Container>
  );
};

export default SearchPage;
