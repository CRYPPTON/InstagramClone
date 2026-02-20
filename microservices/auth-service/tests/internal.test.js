const request = require('supertest');
const app = require('../app');
const { Pool } = require('pg');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Auth Service - Internal Routes', () => {
  let pool;
  beforeEach(() => {
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe('GET /internal/check-access', () => {
    it('should allow access if account is public', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ is_private: false }] }); // user check
      pool.query.mockResolvedValueOnce({ rows: [] }); // block check

      const res = await request(app)
        .get('/internal/check-access?viewerId=1&targetId=2');

      expect(res.statusCode).toEqual(200);
      expect(res.body.canView).toBe(true);
    });

    it('should deny access if account is private and not following', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ is_private: true }] }); // user check
      pool.query.mockResolvedValueOnce({ rows: [] }); // block check
      pool.query.mockResolvedValueOnce({ rows: [] }); // following check

      const res = await request(app)
        .get('/internal/check-access?viewerId=1&targetId=2');

      expect(res.statusCode).toEqual(200);
      expect(res.body.canView).toBe(false);
    });
  });

  describe('GET /internal/user-info/:id', () => {
    it('should return user info', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'testuser', full_name: 'Test User' }]
      });

      const res = await request(app).get('/internal/user-info/1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.username).toBe('testuser');
    });
  });

  describe('POST /internal/users-info', () => {
    it('should return bulk user info', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'user1' }, { id: 2, username: 'user2' }] });
        const res = await request(app).post('/internal/users-info').send({ userIds: [1, 2] });
        expect(res.statusCode).toEqual(200);
        expect(res.body['1'].username).toBe('user1');
    });
  });

  describe('GET /internal/following-ids/:userId', () => {
    it('should return following IDs', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ followee_id: 2 }, { followee_id: 3 }] });
        const res = await request(app).get('/internal/following-ids/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([2, 3]);
    });
  });

  describe('GET /internal/blocked-ids/:userId', () => {
    it('should return blocked IDs', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }, { id: 3 }] });
        const res = await request(app).get('/internal/blocked-ids/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([2, 3]);
    });
  });
});
