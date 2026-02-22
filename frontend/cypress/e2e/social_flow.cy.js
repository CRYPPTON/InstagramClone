describe('Social Interactions', () => {
    let userA = `user_a_${Date.now()}`;
    let userB = `user_b_${Date.now()}`;

    it('should allow User A to follow User B', () => {
        // 1. Create User B (Target)
        cy.visit('/register');
        cy.get('input[placeholder="Email"]').type(`${userB}@example.com`);
        cy.get('input[placeholder="Full Name"]').type('Target User');
        cy.get('input[placeholder="Username"]').type(userB);
        cy.get('input[placeholder="Password"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.contains('Logout').click();

        // 2. Create User A and search for User B
        cy.visit('/register');
        cy.get('input[placeholder="Email"]').type(`${userA}@example.com`);
        cy.get('input[placeholder="Full Name"]').type('Searcher User');
        cy.get('input[placeholder="Username"]').type(userA);
        cy.get('input[placeholder="Password"]').type('password123');
        cy.get('button[type="submit"]').click();

        cy.contains('Search').click();
        cy.get('input[placeholder="Search by username or full name..."]').type(userB);
        
        // Wait for search results and click on User B
        cy.contains(userB, { timeout: 10000 }).click();
        
        // 3. Follow
        cy.url().should('include', `/profile/${userB}`);
        cy.get('button').contains('Follow').click();
        
        // Verify state change (Using regex to support both 'Unfollow' or 'Requested')
        cy.get('button').contains(/Unfollow|Requested/);
    });
});
