import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/common/Input';
import api from '../services/api';
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
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #dbdbdb' }}>
      <h2>Search Users</h2>
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by username or full name..."
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <div>Searching...</div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {searchResults.length === 0 && searchQuery.trim() && !error ? (
            <p>No users found.</p>
          ) : (
            searchResults.map((user) => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <img src={user.profile_picture_url || 'https://via.placeholder.com/50'} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }} />
                <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none', color: 'black', fontWeight: 'bold' }}>
                  {user.username} {user.full_name ? `(${user.full_name})` : ''}
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
