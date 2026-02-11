import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import CreatePostPage from './pages/CreatePostPage';
import SearchPage from './pages/SearchPage';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/accounts/edit" element={<ProfileEditPage />} />
          <Route path="/create-post" element={<CreatePostPage />} />
          <Route path="/search" element={<SearchPage />} />
          {/* Add other private routes here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
