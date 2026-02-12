const request = require('supertest');
const express = require('express');
const users = require('./users');

const app = express();
app.use(express.json());

// Mock auth middleware
const auth = (req, res, next) => {
    req.user = { id: 1 }; // Mock user ID
    next();
};

// We need to inject the auth middleware mock into the router
// This is a bit tricky, we can use a little trick to replace the middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
    if(req.headers['x-auth-token']){
        const token = req.headers['x-auth-token'];
        const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        req.user = user.user;
    }
    next();
});

const router = require('./users');
app.use('/users', router);


describe('Users API', () => {

    it('should remove a follower', async () => {
        // Login as user1 to get a token
        const res = await request(app)
            .post('/users/auth/login')
            .send({
                email: 'user1@example.com',
                password: 'password'
            });

        const token = res.body.token;

        // user1 (id:1) removes user2 (id:2) from followers
        const removeRes = await request(app)
            .delete('/users/1/followers/2')
            .set('x-auth-token', token);
        
        expect(removeRes.statusCode).toEqual(200);
        expect(removeRes.body.msg).toBe('Follower removed successfully');

        // Check if user2 is still a follower of user1
        const followersRes = await request(app)
            .get('/users/1/followers')
            .set('x-auth-token', token);
        
        expect(followersRes.statusCode).toEqual(200);
        expect(followersRes.body).not.toContain(expect.objectContaining({ id: 2 }));
    });
});
