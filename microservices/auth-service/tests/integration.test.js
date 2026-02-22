const request = require('supertest');
const { Pool } = require('pg');

// Set a default test DATABASE_URL if not already set, but don't force it to localhost:5433 if we're in CI and it's not provided
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://enterwait_user:enterwait_dev_2024@localhost:5433/instagram_clone_db_test';
}

const app = require('../app');

describe('Auth Service - API Integration Test', () => {
  let pool;
  let dbConnected = false;

  beforeAll(async () => {
    pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 2000 // Short timeout for CI
    });
    
    try {
        // Test connection
        await pool.query('SELECT 1');
        dbConnected = true;
        // Cleanup users before tests
        await pool.query('DELETE FROM users');
    } catch (err) {
        console.warn('Skipping integration tests: Database not available.', err.message);
        dbConnected = false;
    }
  });

  afterAll(async () => {
    if (pool) {
        await pool.end();
    }
  });

  test('User registration and login flow with real DB', async () => {
    if (!dbConnected) {
        console.log('Test skipped due to missing database connection');
        return;
    }

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
