const optionalAuth = require('./optionalAuth');
const jwt = require('jsonwebtoken');

describe('Optional Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { header: jest.fn() };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    process.env.JWT_SECRET = 'secret';
  });

  it('should call next without user if no token', () => {
    req.header.mockReturnValue(null);
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeNull();
  });

  it('should set req.user and call next if valid token', () => {
    const token = jwt.sign({ user: { id: 1 } }, 'secret');
    req.header.mockReturnValue(token);
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
  });

  it('should call next without user if invalid token', () => {
    req.header.mockReturnValue('invalid-token');
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeNull();
  });
});
