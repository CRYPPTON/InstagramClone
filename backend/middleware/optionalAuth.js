const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // If no token, continue without setting req.user
  if (!token) {
    return next();
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, 'secret'); // 'secret' should be an environment variable
    req.user = decoded.user;
    next();
  } catch (err) {
    // If token is not valid, just continue without authentication
    // The route will then decide what a non-authenticated user can see
    next();
  }
};
