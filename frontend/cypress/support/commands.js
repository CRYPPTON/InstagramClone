Cypress.Commands.add('login', (loginIdentifier, password) => {
  cy.visit('/login');
  cy.get('input[placeholder="Username or Email"]').type(loginIdentifier);
  cy.get('input[placeholder="Password"]').type(password);
  cy.get('button[type="submit"]').click();
});
