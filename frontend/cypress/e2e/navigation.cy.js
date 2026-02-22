describe('Main Navigation', () => {
    let testUsername;

    beforeEach(() => {
        // Register and login a fresh user for navigation tests
        testUsername = `navuser_${Date.now()}`;
        const email = `nav_${Date.now()}@example.com`;
        
        cy.visit('/register');
        cy.get('input[placeholder="Email"]').type(email);
        cy.get('input[placeholder="Full Name"]').type('Nav User');
        cy.get('input[placeholder="Username"]').type(testUsername);
        cy.get('input[placeholder="Password"]').type('password123');
        cy.get('button[type="submit"]').click();
        
        // Wait for redirect to home
        cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should navigate to search page from sidebar', () => {
        cy.contains('Search').click();
        cy.url().should('include', '/search');
        // Correct placeholder from SearchPage.js
        cy.get('input[placeholder="Search by username or full name..."]').should('exist');
    });

    it('should navigate to create post page from sidebar', () => {
        cy.contains('Create').click();
        cy.url().should('include', '/create-post');
        cy.get('textarea[placeholder="Write a caption..."]').should('exist');
    });

    it('should navigate to profile page from sidebar', () => {
        // Sidebar uses /profile/username
        cy.contains('Profile').click();
        cy.url().should('include', `/profile/${testUsername}`);
        cy.contains('Nav User').should('exist');
    });

    it('should navigate to follow requests page from sidebar', () => {
        cy.contains('Follow requests').click();
        cy.url().should('include', '/follow-requests');
        cy.contains('Follow Requests').should('exist');
    });
});
