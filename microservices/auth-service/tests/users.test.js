const request = require('supertest');
const app = require('../app');
const { Pool } = require('pg');
const axios = require('axios');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('axios');

// Mock auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 1, username: 'testuser' };
  next();
});

jest.mock('../middleware/optionalAuth', () => (req, res, next) => {
    req.user = { id: 1, username: 'testuser' };
    next();
});

describe('Auth Service - Users Routes', () => {
  let pool;
  beforeEach(() => {
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe('GET /users/search', () => {
    it('should search for users', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 2, username: 'user2' }] });
      const res = await request(app).get('/users/search?query=user2');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([{ id: 2, username: 'user2' }]);
    });
  });

  describe('GET /users/:username', () => {
    it('should return user profile', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'testuser', is_private: false }] }); // user check
      pool.query.mockResolvedValueOnce({ rows: [] }); // block check
      pool.query.mockResolvedValueOnce({ rows: [{ count: '10' }] }); // followers
      pool.query.mockResolvedValueOnce({ rows: [{ count: '20' }] }); // following
      pool.query.mockResolvedValueOnce({ rows: [] }); // isFollowing check
      axios.get.mockResolvedValueOnce({ data: [] }); // posts
      const res = await request(app).get('/users/testuser');
      expect(res.statusCode).toEqual(200);
      expect(res.body.username).toBe('testuser');
    });
  });

  describe('POST /users/:id/follow', () => {
    it('should follow a user', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // block check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 2, is_private: false }] }); // followee check
      pool.query.mockResolvedValueOnce({ rows: [] }); // existing
      pool.query.mockResolvedValueOnce({}); // insert
      const res = await request(app).post('/users/2/follow');
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('POST /users/:id/unfollow', () => {
    it('should unfollow a user', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
        const res = await request(app).post('/users/2/unfollow');
        expect(res.statusCode).toEqual(200);
    });
  });

  describe('PUT /users/:userId/followers/:followerId/accept', () => {
    it('should accept a follow request', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        const res = await request(app).put('/users/1/followers/2/accept');
        expect(res.statusCode).toEqual(200);
    });
  });

  describe('PUT /users/:userId/followers/:followerId/reject', () => {
    it('should reject a follow request', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        const res = await request(app).put('/users/1/followers/2/reject');
        expect(res.statusCode).toEqual(200);
    });
  });

  describe('POST /users/:id/block', () => {
    it('should block a user', async () => {
        pool.query.mockResolvedValueOnce({}); // begin
        pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
        pool.query.mockResolvedValueOnce({}); // insert
        pool.query.mockResolvedValueOnce({}); // delete follow
        pool.query.mockResolvedValueOnce({}); // commit
        const res = await request(app).post('/users/2/block');
        expect(res.statusCode).toEqual(200);
    });
  });

  describe('DELETE /users/:id/unblock', () => {
    it('should unblock a user', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
        const res = await request(app).delete('/users/2/unblock');
        expect(res.statusCode).toEqual(200);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user profile', async () => {
        const mClient = {
            query: jest.fn()
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({ rows: [{ is_private: false, profile_picture_url: null }] }) // current
                .mockResolvedValueOnce({ rows: [{ id: 1, full_name: 'New Name' }] }) // update
                .mockResolvedValueOnce({}), // COMMIT
            release: jest.fn()
        };
        pool.connect.mockResolvedValueOnce(mClient);
        const res = await request(app).put('/users/1').send({ full_name: 'New Name', bio: 'Bio', is_private: 'false' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.full_name).toBe('New Name');
    });
  });
});
