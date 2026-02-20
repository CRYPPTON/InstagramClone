const request = require('supertest');
const app = require('../app');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Auth Service - Auth Routes', () => {
  let pool;
  beforeEach(() => {
    pool = new Pool();
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] }); // userExists check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'testuser' }] }); // newUser insert

      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 if user already exists', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.msg).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, username: 'testuser', password: hashedPassword }]
      });

      const res = await request(app)
        .post('/auth/login')
        .send({
          loginIdentifier: 'testuser',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 for invalid credentials', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/auth/login')
        .send({
          loginIdentifier: 'wronguser',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });
  });
});
