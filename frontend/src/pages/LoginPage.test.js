import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';
import api from '../services/api';

// Mock the API
jest.mock('../services/api');

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  BrowserRouter: ({ children }) => <div>{children}</div>,
}));

describe('LoginPage UI Integration Test', () => {
  test('renders login form and handles successful login', async () => {
    api.login.mockResolvedValueOnce({ token: 'test-token' });

    render(
      <LoginPage />
    );

    // Check if elements are rendered
    expect(screen.getByPlaceholderText(/Username or Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText(/Username or Email/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

    // Wait for login to be called and navigation to happen
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        loginIdentifier: 'testuser',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('displays error message on login failure', async () => {
    api.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <LoginPage />
    );

    fireEvent.change(screen.getByPlaceholderText(/Username or Email/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });
});
