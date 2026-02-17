import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Container } from 'react-bootstrap';

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
    <Container className="text-center mt-5">
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <Button onClick={handleGoBack}>
        {isAuthenticated ? 'Go to Home' : 'Go to Login'}
      </Button>
    </Container>
  );
};

export default NotFoundPage;
