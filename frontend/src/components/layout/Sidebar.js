import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaHome, FaSearch, FaCompass, FaFilm, FaHeart, FaPlusSquare, FaUserCircle } from 'react-icons/fa';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get user info

const Sidebar = () => {
  const { user: authUser } = useAuth(); // Get authenticated user for profile link

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100%',
      width: '250px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #dbdbdb',
      padding: '20px'
    }}>
      <h1 style={{ marginBottom: '30px' }}>Instagram</h1>
      <Nav className="flex-column">
        <LinkContainer to="/">
          <Nav.Link className="d-flex align-items-center mb-3">
            <FaHome size={24} className="me-3" />
            Home
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/search">
          <Nav.Link className="d-flex align-items-center mb-3">
            <FaSearch size={24} className="me-3" />
            Search
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/explore">
          <Nav.Link className="d-flex align-items-center mb-3">
            <FaCompass size={24} className="me-3" />
            Explore
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/reels">
          <Nav.Link className="d-flex align-items-center mb-3">
            <FaFilm size={24} className="me-3" />
            Reels
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/notifications">
          <Nav.Link className="d-flex align-items-center mb-3">
            <FaHeart size={24} className="me-3" />
            Notifications
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/create-post">
          <Nav.Link className="d-flex align-items-center mb-3">
            <FaPlusSquare size={24} className="me-3" />
            Create
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to={`/profile/${authUser?.username}`}>
          <Nav.Link className="d-flex align-items-center mb-3">
            <FaUserCircle size={24} className="me-3" />
            Profile
          </Nav.Link>
        </LinkContainer>
      </Nav>
    </div>
  );
};

export default Sidebar;
