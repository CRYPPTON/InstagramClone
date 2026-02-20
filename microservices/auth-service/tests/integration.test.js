const request = require('supertest');
// Set the DATABASE_URL to use the test database before requiring app
process.env.DATABASE_URL = 'postgres://enterwait_user:enterwait_dev_2024@localhost:5433/instagram_clone_db_test';
const app = require('../app');
const { Pool } = require('pg');

describe('Auth Service - API Integration Test', () => {
  let pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Cleanup users before tests
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('User registration and login flow with real DB', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        username: 'realuser',
        email: 'real@example.com',
        password: 'password123',
        fullName: 'Real User'
      });

    expect(registerRes.statusCode).toEqual(200);
    expect(registerRes.body).toHaveProperty('token');

    // 2. Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        loginIdentifier: 'realuser',
        password: 'password123'
      });

    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body).toHaveProperty('token');

    // 3. Register another user
    await request(app)
      .post('/auth/register')
      .send({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123',
        fullName: 'Another User'
      });

    // 4. Search for the other user
    const searchRes = await request(app)
      .get('/users/search?query=anotheruser')
      .set('x-auth-token', loginRes.body.token);

    expect(searchRes.statusCode).toEqual(200);
    expect(searchRes.body.length).toBeGreaterThan(0);
    expect(searchRes.body[0].username).toBe('anotheruser');
  });
});
