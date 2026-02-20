const request = require('supertest');
const app = require('../app');
const { Pool } = require('pg');
const axios = require('axios');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
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

describe('Post Service - Posts Routes', () => {
  let pool;
  beforeEach(() => {
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe('GET /posts/timeline', () => {
    it('should return user timeline', async () => {
      axios.get.mockResolvedValueOnce({ data: [2, 3] }); // following IDs
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 2, caption: 'test post' }] }); // posts
      
      axios.post.mockImplementation((url, data) => {
          if (url.includes('users-info')) return Promise.resolve({ data: { 2: { username: 'user2' } } });
          if (url.includes('bulk-counts')) return Promise.resolve({ data: { 10: { likeCount: 5, commentCount: 2 } } });
          return Promise.reject(new Error('Unknown URL'));
      });

      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, media_url: '/img.jpg', media_type: 'image' }] }); // media

      const res = await request(app)
        .get('/posts/timeline');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].username).toBe('user2');
      expect(res.body[0].like_count).toBe(5);
    });
  });

  describe('GET /posts/:id', () => {
    it('should return single post info', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 2, caption: 'test' }] }); // post
      axios.get.mockResolvedValueOnce({ data: { canView: true } }); // access check
      pool.query.mockResolvedValueOnce({ rows: [] }); // media
      axios.get.mockResolvedValueOnce({ data: { username: 'user2' } }); // user info
      axios.get.mockResolvedValueOnce({ data: { likeCount: 1 } }); // interaction

      const res = await request(app).get('/posts/10');

      expect(res.statusCode).toEqual(200);
      expect(res.body.username).toBe('user2');
    });

    it('should return 403 if account is private', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 2, caption: 'test' }] });
      axios.get.mockResolvedValueOnce({ data: { canView: false } });

      const res = await request(app).get('/posts/10');
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update a post caption', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); // ownership check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 10, caption: 'new caption' }] }); // update

      const res = await request(app)
        .put('/posts/10')
        .send({ caption: 'new caption' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.caption).toBe('new caption');
    });

    it('should return 403 if user does not own the post', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 2 }] });

      const res = await request(app)
        .put('/posts/10')
        .send({ caption: 'new caption' });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete a post', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); // ownership check
      pool.query.mockResolvedValueOnce({}); // delete media
      pool.query.mockResolvedValueOnce({}); // delete post
      axios.delete.mockResolvedValueOnce({}); // interaction cleanup

      const res = await request(app).delete('/posts/10');

      expect(res.statusCode).toEqual(200);
      expect(res.body.msg).toBe('Post deleted');
    });
  });

  describe('GET /posts/internal/user/:userId', () => {
    it('should return posts for a user', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 2, caption: 'test' }] });
        pool.query.mockResolvedValueOnce({ rows: [] }); // media
        axios.get.mockResolvedValueOnce({ data: { likeCount: 5 } }); // interaction

        const res = await request(app).get('/posts/internal/user/2');
        expect(res.statusCode).toEqual(200);
        expect(res.body[0].like_count).toBe(5);
    });
  });

  describe('POST /posts/internal/bulk-posts', () => {
    it('should return bulk post info', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 2 }] });
        const res = await request(app).post('/posts/internal/bulk-posts').send({ postIds: [10] });
        expect(res.statusCode).toEqual(200);
        expect(res.body['10'].user_id).toBe(2);
    });
  });

  describe('DELETE /posts/:id/media/:mediaId', () => {
    it('should delete media if authorized', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); // post ownership
        pool.query.mockResolvedValueOnce({ rows: [{ media_url: '/uploads/img.jpg' }] }); // media
        pool.query.mockResolvedValueOnce({}); // delete media

        const res = await request(app).delete('/posts/10/media/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toBe('Media deleted');
    });
  });

  describe('GET /internal/posts/:id', () => {
    it('should return basic post info', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 2 }] });
        const res = await request(app).get('/internal/posts/10');
        expect(res.statusCode).toEqual(200);
        expect(res.body.user_id).toBe(2);
    });
  });
});
