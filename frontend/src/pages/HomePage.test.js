import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HomePage from './HomePage';
import api from '../services/api';

// Mock the API
jest.mock('../services/api');

// Mock child component Post
jest.mock('../components/post/Post', () => ({ post }) => (
  <div data-testid="mock-post">{post.caption}</div>
));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock PullToRefresh as it might cause issues in test environment
jest.mock('react-simple-pull-to-refresh', () => ({ children }) => <div>{children}</div>);

describe('HomePage UI Integration Test', () => {
  test('renders loading state then posts', async () => {
    const mockPosts = [
      { post_id: 1, caption: 'First post', user_id: 1 },
      { post_id: 2, caption: 'Second post', user_id: 2 },
    ];
    api.getPosts.mockResolvedValueOnce(mockPosts);

    render(<HomePage />);

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByTestId('mock-post')).toHaveLength(2);
      expect(screen.getByText('First post')).toBeInTheDocument();
      expect(screen.getByText('Second post')).toBeInTheDocument();
    });
  });

  test('renders empty state when no posts', async () => {
    api.getPosts.mockResolvedValueOnce([]);

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Your timeline is empty/i)).toBeInTheDocument();
    });
  });
});
