import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(decoded.user);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false); // Set loading to false after initial check
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser(decoded.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

      const isAuthenticated = !!user;
  
    const refreshUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          // Assuming your backend's getProfile can fetch by ID or username from decoded token
          // For now, let's assume we can re-decode from token or fetch fresh if needed.
          // A direct fetch using api.getProfile would be more robust to get latest data.
          // For simplicity and assuming token contains sufficient info, we'll just re-set user.
          // If profile details (like profile_picture_url) are updated, we need to fetch.
          // For now, let's make a simple fetch for the currently logged-in user.
          const updatedUser = await api.getProfile(decoded.user.username); // Assuming username is in decoded token
          setUser(updatedUser);
        } catch (error) {
          console.error("Error refreshing user:", error);
          logout(); // Logout if refresh fails
        }
      }
    };
  
    return (
      <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading, refreshUser }}>
        {children}
      </AuthContext.Provider>
    );
  };
export const useAuth = () => {
  return useContext(AuthContext);
};
