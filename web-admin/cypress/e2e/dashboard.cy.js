describe('Olympia HR - Dashboard', () => {
    beforeEach(() => {
        // Login first
        cy.visit('http://localhost:3000/login');
        cy.get('input[name="email"]').type('admin@olympia.com');
        cy.get('input[name="password"]').type('Admin123!');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/dashboard');
    });

    it('should display all KPI cards', () => {
        cy.contains('Employés').should('be.visible');
        cy.contains('Présence Aujourd\'hui').should('be.visible');
        cy.contains('Masse Salariale').should('be.visible');
        cy.contains('Sentiment IA').should('be.visible');
    });

    it('should show employee count', () => {
        cy.contains('Employés').parent().within(() => {
            cy.get('[class*="MuiTypography-h3"]').should('exist');
        });
    });

    it('should navigate to employees from sidebar', () => {
        cy.contains('Employés').click();
        cy.url().should('include', '/employees');
        cy.contains('Gestion des Employés').should('be.visible');
    });

    it('should navigate to attendance', () => {
        cy.contains('Présence').click();
        cy.url().should('include', '/attendance');
        cy.contains('Suivi de Présence').should('be.visible');
    });

    it('should navigate to leaves', () => {
        cy.contains('Congés').click();
        cy.url().should('include', '/leaves');
        cy.contains('Gestion des Congés').should('be.visible');
    });

    it('should navigate to payroll', () => {
        cy.contains('Paie').click();
        cy.url().should('include', '/payroll');
        cy.contains('Gestion de Paie').should('be.visible');
    });

    it('should navigate to sentiment', () => {
        cy.contains('Sentiment IA').click();
        cy.url().should('include', '/sentiment');
        cy.contains('Analyse IA - Sentiment').should('be.visible');
    });

    it('should logout', () => {
        cy.get('button[aria-label="account of current user"]').click();
        cy.contains('Déconnexion').click();
        cy.url().should('include', '/login');
    });
});
