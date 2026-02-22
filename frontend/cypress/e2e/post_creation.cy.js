describe('Post and Interactions', () => {
    beforeEach(() => {
        // Create user and login
        const username = `postuser_${Date.now()}`;
        const email = `post_${Date.now()}@example.com`;
        
        cy.visit('/register');
        cy.get('input[placeholder="Email"]').type(email);
        cy.get('input[placeholder="Full Name"]').type('Post User');
        cy.get('input[placeholder="Username"]').type(username);
        cy.get('input[placeholder="Password"]').type('password123');
        cy.get('button[type="submit"]').click();
        
        cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should create a new post and verify it on home page', () => {
        cy.intercept('POST', '**/api/posts').as('createPost');
        cy.intercept('GET', '**/api/posts/timeline').as('getTimeline');

        cy.contains('Create').click();
        
        cy.get('input[type="file"]').selectFile('cypress/fixtures/noImage.jpg', { force: true });
        cy.get('textarea[placeholder="Write a caption..."]').type('Cypress Test Caption');
        cy.get('button[type="submit"]').click();

        // Wait for API calls to complete
        cy.wait('@createPost');
        cy.wait('@getTimeline');

        // Should redirect back home and see the new post
        cy.url().should('eq', Cypress.config().baseUrl + '/');
        cy.contains('Cypress Test Caption').should('be.visible');
    });

    it('should interact with a post (like and comment)', () => {
        cy.intercept('POST', '**/api/posts').as('createPost');
        cy.intercept('GET', '**/api/posts/timeline').as('getTimeline');

        // First create a post to interact with
        cy.contains('Create').click();
        cy.get('input[type="file"]').selectFile('cypress/fixtures/noImage.jpg', { force: true });
        cy.get('textarea[placeholder="Write a caption..."]').type('Interactions post');
        cy.get('button[type="submit"]').click();

        cy.wait('@createPost');
        cy.wait('@getTimeline');

        // Like the post
        cy.get('.post-actions', { timeout: 10000 }).first().within(() => {
          cy.get('button').first().click(); 
        });
        
        // Verify like count
        cy.contains('1 likes').should('be.visible');

        // Comment on the post
        cy.get('input[placeholder="Add a comment..."]').type('Cypress Comment{enter}');
        cy.contains('Cypress Comment').should('be.visible');
    });
});
