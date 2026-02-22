import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

test('renders login page by default', async () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  // The login page contains "Instagram" as an h1
  const loginHeader = await screen.findByText(/Instagram/i);
  expect(loginHeader).toBeInTheDocument();
});
