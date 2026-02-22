import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

test('renders login page by default', async () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  // Search for the "Log In" button which is unique to the login page
  const loginButton = await screen.findByRole('button', { name: /Log In/i });
  expect(loginButton).toBeInTheDocument();
});
