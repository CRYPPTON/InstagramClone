describe('Profile Management', () => {
    let testUsername;

    beforeEach(() => {
        testUsername = `profile_${Date.now()}`;
        cy.visit('/register');
        cy.get('input[placeholder="Email"]').type(`${testUsername}@example.com`);
        cy.get('input[placeholder="Full Name"]').type('Initial Name');
        cy.get('input[placeholder="Username"]').type(testUsername);
        cy.get('input[placeholder="Password"]').type('password123');
        cy.get('button[type="submit"]').click();
    });

    it('should edit user profile info', () => {
        cy.contains('Profile').click();
        cy.contains('Edit Profile').click();

        cy.get('input[name="full_name"]').clear().type('Updated Full Name');
        cy.get('textarea[name="bio"]').clear().type('This is my new bio');
        cy.get('button[type="submit"]').click();

        // Redirects to profile page
        cy.url().should('include', `/profile/${testUsername}`);
        
        // Verify changes on profile page
        cy.contains('Updated Full Name').should('be.visible');
        cy.contains('This is my new bio').should('be.visible');
    });

    it('should logout successfully', () => {
        cy.contains('Logout').click();
        cy.url().should('include', '/login');
        // Try to go back to home
        cy.visit('/');
        cy.url().should('include', '/login');
    });
});
