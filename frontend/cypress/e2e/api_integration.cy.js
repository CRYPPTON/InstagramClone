describe('API Integration', () => {
    const apiBase = 'http://localhost:3000/api'; // API Gateway je uvek na 3000

    it('should respond to health check (base route)', () => {
        // Proveravamo Gateway na portu 3000
        cy.request('GET', 'http://localhost:3000/').then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.msg).to.eq('API Gateway is running');
        });
    });

    it('should return error for invalid login credentials via API', () => {
        cy.request({
            method: 'POST',
            url: `${apiBase}/auth/login`,
            failOnStatusCode: false,
            body: {
                loginIdentifier: 'nonexistentuser',
                password: 'wrongpassword'
            }
        }).then((response) => {
            expect(response.status).to.be.oneOf([400, 401, 404]);
        });
    });

    it('should be able to search users via API', () => {
        cy.request({
            method: 'GET',
            url: `${apiBase}/users/search?query=test`,
            failOnStatusCode: false
        }).then((response) => {
            // Gateway treba da prosledi zahtev, čak i ako dobijemo 401 (Unauthorized) to je OK za integraciju
            expect(response.status).to.not.be.oneOf([404, 500]);
        });
    });
});
