const request = require('supertest');
const app = require('../app');
const { Pool } = require('pg');
const axios = require('axios');

process.env.POST_SERVICE_URL = 'http://post-service';
process.env.AUTH_SERVICE_URL = 'http://auth-service';

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

describe('Interaction Service - Interactions Routes', () => {
  let pool;
  beforeEach(() => {
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe('GET /interactions/counts/:postId', () => {
    it('should return like and comment counts', async () => {
      axios.get.mockImplementation((url) => {
          if (url.includes('http://post-service')) return Promise.resolve({ data: { user_id: 2 } });
          if (url.includes('http://auth-service')) return Promise.resolve({ data: [] }); // blocked IDs
          return Promise.reject(new Error(`Unknown URL: ${url}`));
      });

      pool.query.mockResolvedValueOnce({ rows: [{ count: '5' }] }); // likes
      pool.query.mockResolvedValueOnce({ rows: [{ count: '2' }] }); // comments

      const res = await request(app).get('/interactions/counts/10');

      expect(res.statusCode).toEqual(200);
      expect(res.body.likeCount).toBe(5);
      expect(res.body.commentCount).toBe(2);
    });
  });

  describe('POST /interactions/posts/:id/like', () => {
    it('should like a post if accessible', async () => {
      axios.get.mockImplementation((url) => {
          if (url.includes('http://post-service')) return Promise.resolve({ data: { user_id: 2 } });
          if (url.includes('http://auth-service/internal/check-access')) return Promise.resolve({ data: { canView: true } });
          return Promise.reject(new Error(`Unknown URL: ${url}`));
      });

      pool.query.mockResolvedValueOnce({ rows: [] }); // existing like check
      pool.query.mockResolvedValueOnce({}); // insert

      const res = await request(app).post('/interactions/posts/10/like');

      expect(res.statusCode).toEqual(200);
      expect(res.body.msg).toBe('Liked');
    });

    it('should return 403 if access is denied', async () => {
      axios.get.mockImplementation((url) => {
          if (url.includes('http://post-service')) return Promise.resolve({ data: { user_id: 2 } });
          if (url.includes('http://auth-service/internal/check-access')) return Promise.resolve({ data: { canView: false } });
          return Promise.reject(new Error(`Unknown URL: ${url}`));
      });

      const res = await request(app).post('/interactions/posts/10/like');
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /interactions/posts/:id/comments', () => {
    it('should return comments for a post', async () => {
      axios.get.mockImplementation((url) => {
          if (url.includes('http://post-service')) return Promise.resolve({ data: { user_id: 2 } });
          if (url.includes('http://auth-service/internal/blocked-ids')) return Promise.resolve({ data: [] });
          if (url.includes('http://auth-service/internal/user-info')) return Promise.resolve({ data: { username: 'user1' } });
          return Promise.reject(new Error(`Unknown URL: ${url}`));
      });

      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, content: 'comment1' }] });

      const res = await request(app).get('/interactions/posts/10/comments');

      expect(res.statusCode).toEqual(200);
      expect(res.body[0].username).toBe('user1');
    });
  });

  describe('DELETE /interactions/cleanup/:postId', () => {
    it('should cleanup after post deletion', async () => {
        pool.query.mockResolvedValueOnce({}); // delete likes
        pool.query.mockResolvedValueOnce({}); // delete comments

        const res = await request(app).delete('/internal/cleanup/10');
        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toBe('Cleanup done');
    });
  });

  describe('POST /internal/bulk-counts', () => {
    it('should return bulk counts for multiple posts', async () => {
        axios.post.mockImplementation((url) => {
            if (url.includes('http://post-service/internal/bulk-posts')) return Promise.resolve({ data: { 10: { user_id: 2 } } });
            if (url.includes('http://auth-service/internal/bulk-blocked-ids')) return Promise.resolve({ data: { 2: [] } });
            return Promise.reject(new Error(`Unknown URL: ${url}`));
        });

        pool.query.mockResolvedValueOnce({ rows: [{ post_id: 10, user_id: 3 }] }); // likes
        pool.query.mockResolvedValueOnce({ rows: [] }); // comments

        const res = await request(app).post('/internal/bulk-counts').send({ postIds: [10] });

        expect(res.statusCode).toEqual(200);
        expect(res.body['10'].likeCount).toBe(1);
    });
  });

  describe('PUT /interactions/posts/:postId/comments/:commentId', () => {
    it('should update a comment', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); // ownership check
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, content: 'updated' }] }); // update

        const res = await request(app)
            .put('/interactions/posts/10/comments/1')
            .send({ content: 'updated' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.content).toBe('updated');
    });
  });

  describe('DELETE /interactions/posts/:postId/comments/:commentId', () => {
    it('should delete a comment if authorized', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); // comment ownership
        axios.get.mockResolvedValueOnce({ data: { user_id: 2 } }); // post ownership
        pool.query.mockResolvedValueOnce({}); // delete

        const res = await request(app).delete('/interactions/posts/10/comments/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toBe('Comment deleted');
    });
  });

  describe('DELETE /interactions/posts/:id/like', () => {
    it('should unlike a post', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // delete returning
        const res = await request(app).delete('/interactions/posts/10/like');
        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toBe('Unliked');
    });
  });
});
