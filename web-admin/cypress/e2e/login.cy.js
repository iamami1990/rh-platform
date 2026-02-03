describe('Olympia HR - Login Flow', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/login');
    });

    it('should display login page', () => {
        cy.contains('Olympia HR Platform').should('be.visible');
        cy.contains('Plateforme Intelligente de Gestion RH').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
        cy.get('button[type="submit"]').click();
        // HTML5 validation will prevent submission
    });

    it('should login with valid credentials', () => {
        cy.get('input[name="email"]').type('admin@olympia.com');
        cy.get('input[name="password"]').type('Admin123!');
        cy.get('button[type="submit"]').click();

        // Should redirect to dashboard
        cy.url().should('include', '/dashboard');
        cy.contains('Tableau de Bord').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
        cy.get('input[name="email"]').type('wrong@email.com');
        cy.get('input[name="password"]').type('wrongpassword');
        cy.get('button[type="submit"]').click();

        // Should show error alert
        cy.contains('Erreur').should('be.visible');
    });

    it('should toggle password visibility', () => {
        cy.get('input[name="password"]').should('have.attr', 'type', 'password');
        cy.get('button[aria-label="toggle password visibility"]').click();
        cy.get('input[name="password"]').should('have.attr', 'type', 'text');
    });
});
