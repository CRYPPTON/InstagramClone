describe('Post Lifecycle (Edit/Delete)', () => {
    beforeEach(() => {
        const username = `lifecycle_${Date.now()}`;
        cy.visit('/register');
        cy.get('input[placeholder="Email"]').type(`${username}@example.com`);
        cy.get('input[placeholder="Full Name"]').type('Lifecycle User');
        cy.get('input[placeholder="Username"]').type(username);
        cy.get('input[placeholder="Password"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('should create, edit and then delete a post', () => {
        // 1. Create
        cy.intercept('POST', '**/api/posts').as('createPost');
        cy.contains('Create').click();
        cy.get('input[type="file"]').selectFile('cypress/fixtures/noImage.jpg', { force: true });
        cy.get('textarea[placeholder="Write a caption..."]').type('Original Caption');
        cy.get('button[type="submit"]').click();
        cy.wait('@createPost');

        // 2. Edit
        cy.contains('Original Caption').should('be.visible');
        cy.contains('Edit').click();
        cy.get('textarea').clear().type('Updated Caption');
        cy.contains('Save').click();
        cy.contains('Updated Caption').should('be.visible');
        cy.contains('Original Caption').should('not.exist');

        // 3. Delete
        cy.contains('Delete').click();
        // Handle Confirmation Modal
        cy.contains('Are you sure').should('be.visible');
        cy.get('.confirmation-modal-actions').contains('Confirm').click();
        
        cy.contains('Updated Caption').should('not.exist');
    });
});
