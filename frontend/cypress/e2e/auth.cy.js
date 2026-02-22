describe('Authentication flow', () => {
  beforeEach(() => {
    // Clear localStorage to ensure fresh state
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('should redirect to login when accessing protected route unauthenticated', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
    cy.get('h1').should('contain', 'Instagram');
  });

  it('should successfully register a new user', () => {
    const username = `testuser_${Date.now()}`;
    const email = `test_${Date.now()}@example.com`;

    cy.visit('/register');
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Full Name"]').type('Test User');
    cy.get('input[placeholder="Username"]').type(username);
    cy.get('input[placeholder="Password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // After registration it should redirect to home or login (depending on app logic)
    // Most likely home as many apps auto-login after register
    cy.url().should('not.include', '/register');
  });

  it('should show error on login failure', () => {
    cy.visit('/login');
    cy.get('input[placeholder="Username or Email"]').type('wronguser');
    cy.get('input[placeholder="Password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.get('.alert-danger').should('be.visible');
  });
});
