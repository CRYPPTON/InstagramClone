import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Stranica ne postoji</h2>
      <p>The page you are looking for does not exist.</p>
      <Button onClick={handleGoBack}>
        {isAuthenticated ? 'Go to Home' : 'Go to Login'}
      </Button>
    </div>
  );
};

export default NotFoundPage;
