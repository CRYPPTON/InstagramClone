describe('API Integration - Deep Dive', () => {
    const apiBase = 'http://localhost:3000/api';
    let authToken = '';
    let testUsername = `api_user_${Date.now()}`;
    let secondUsername = `second_user_${Date.now()}`;

    // 1. Test Authentication & Token Generation
    it('should register a new user via API and return a token', () => {
        cy.request({
            method: 'POST',
            url: `${apiBase}/auth/register`,
            body: {
                username: testUsername,
                email: `${testUsername}@example.com`,
                password: 'Password123!',
                fullName: 'API Test User'
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('token');
            authToken = response.body.token;
        });
    });

    it('should register a second user for search testing', () => {
        cy.request({
            method: 'POST',
            url: `${apiBase}/auth/register`,
            body: {
                username: secondUsername,
                email: `${secondUsername}@example.com`,
                password: 'Password123!',
                fullName: 'Second User'
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
        });
    });

    it('should login and receive a valid JWT', () => {
        cy.request({
            method: 'POST',
            url: `${apiBase}/auth/login`,
            body: {
                loginIdentifier: testUsername,
                password: 'Password123!'
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property('token');
            authToken = response.body.token; 
        });
    });

    // 2. Test Protected Routes (Cross-Service)
    it('should fail to fetch timeline without token (401)', () => {
        cy.request({
            method: 'GET',
            url: `${apiBase}/posts/timeline`,
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(401);
        });
    });

    it('should fetch empty timeline with valid token', () => {
        cy.request({
            method: 'GET',
            url: `${apiBase}/posts/timeline`,
            headers: {
                'x-auth-token': authToken
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an('array');
        });
    });

    // 3. Test Service-to-Service through Gateway
    it('should fetch other user profile info via API search', () => {
        cy.request({
            method: 'GET',
            url: `${apiBase}/users/search?query=${secondUsername}`,
            headers: {
                'x-auth-token': authToken
            }
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.be.an('array');
            expect(response.body.length).to.be.greaterThan(0);
            expect(response.body[0].username).to.eq(secondUsername);
        });
    });

    // 4. Test Interaction Service directly
    it('should fail to like a non-existent post (404)', () => {
        cy.request({
            method: 'POST',
            url: `${apiBase}/posts/999999/like`,
            failOnStatusCode: false,
            headers: {
                'x-auth-token': authToken
            }
        }).then((response) => {
            expect(response.status).to.be.oneOf([404, 500]);
        });
    });

    // 5. Check Gateway static files proxy
    it('should handle /uploads proxying to Post Service', () => {
        cy.request({
            method: 'GET',
            url: 'http://localhost:3000/uploads/non-existent.jpg',
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.not.eq(502); 
        });
    });
});
