const express = require('express');
const cors = require('cors');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
// Increase limits for JSON and URL-encoded bodies if needed by gateway itself
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));

// --- PROXY RULES ---

// Auth & Users
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onProxyReq: fixRequestBody
}));

app.use('/api/users', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
  onProxyReq: fixRequestBody
}));

// Interactions
app.use(['/api/posts/*/like', '/api/posts/*/comment', '/api/posts/*/comments'], createProxyMiddleware({
  target: process.env.INTERACTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '/interactions' },
  onProxyReq: fixRequestBody
}));

// Posts
app.use('/api/posts', createProxyMiddleware({
  target: process.env.POST_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/posts': '/posts' },
  onProxyReq: fixRequestBody
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

app.get('/', (req, res) => {
  res.json({ msg: 'API Gateway is running' });
});

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
