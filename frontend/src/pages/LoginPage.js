import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LoginPage = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { token } = await api.login({ loginIdentifier, password });
      login(token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '350px', margin: '50px auto', textAlign: 'center' }}>
      <h1>Instagram</h1>
      <form onSubmit={handleLogin}>
        <Input
          type="text"
          value={loginIdentifier}
          onChange={(e) => setLoginIdentifier(e.target.value)}
          placeholder="Username or Email"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/register">Sign up</Link>
      </div>
    </div>
  );
};

export default LoginPage;
