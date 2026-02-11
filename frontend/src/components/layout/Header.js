import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const Header = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      borderBottom: '1px solid #dbdbdb',
      backgroundColor: 'white'
    }}>
      <Link to="/"><h1>Instagram</h1></Link>
      <nav>
        <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
        <Link to="/search" style={{ marginRight: '15px' }}>Search</Link>
        <Link to="/create-post" style={{ marginRight: '15px' }}>Create Post</Link>
        <Link to="/profile" style={{ marginRight: '15px' }}>Profile</Link>
        <Button onClick={handleLogout}>Logout</Button>
      </nav>
    </header>
  );
};

export default Header;
