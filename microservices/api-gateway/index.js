const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// --- PROXY RULES ---

// Auth & Users
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' }
}));

app.use('/api/users', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' }
}));

// Interactions
app.use(['/api/posts/*/like', '/api/posts/*/comment', '/api/posts/*/comments'], createProxyMiddleware({
  target: process.env.INTERACTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '/interactions' }
}));

// Posts
app.use('/api/posts', createProxyMiddleware({
  target: process.env.POST_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/posts': '/posts' }
}));

// --- STATIC FILES PROXY ---

// Handle all /uploads through a combined proxy to prevent path stripping
app.use(createProxyMiddleware('/uploads', {
  target: process.env.POST_SERVICE_URL, // Default to post service
  router: (req) => {
    // Redirect to auth-service for profile pictures
    if (req.url.includes('/profile-') || req.url.includes('/profile_picture-')) {
      return process.env.AUTH_SERVICE_URL;
    }
    return process.env.POST_SERVICE_URL;
  },
  changeOrigin: true,
}));

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
