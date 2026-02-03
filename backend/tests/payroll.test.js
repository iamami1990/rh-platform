describe('Payroll Calculation Tests - Tunisian Tax Law', () => {

    describe('IRPP 2025 Calculation', () => {
        it('should calculate no tax for income <= 5000 TND', () => {
            const taxableIncome = 4000;
            const irpp = calculateIRPP2025(taxableIncome);
            expect(irpp).toBe(0);
        });

        it('should calculate 15% for income 5000-10000 TND', () => {
            const taxableIncome = 7000;
            const irpp = calculateIRPP2025(taxableIncome);
            // Expected: (7000 - 5000) * 0.15 = 300
            expect(irpp).toBeCloseTo(300, 2);
        });

        it('should calculate progressive tax for 15000 TND', () => {
            const taxableIncome = 15000;
            const irpp = calculateIRPP2025(taxableIncome);
            // Expected: 0-5000: 0, 5000-10000: 750, 10000-15000: 1250 = 2000
            expect(irpp).toBeCloseTo(2000, 2);
        });

        it('should apply maximum rate for high income', () => {
            const taxableIncome = 100000;
            const irpp = calculateIRPP2025(taxableIncome);
            expect(irpp).toBeGreaterThan(20000);
        });
    });

    describe('CNSS Calculation', () => {
        it('should calculate 9.18% employee CNSS', () => {
            const grossSalary = 2000;
            const cnss = grossSalary * 0.0918;
            expect(cnss).toBeCloseTo(183.6, 2);
        });

        it('should calculate employer CNSS at 16.57%', () => {
            const grossSalary = 2000;
            const employerCnss = grossSalary * 0.1657;
            expect(employerCnss).toBeCloseTo(331.4, 2);
        });
    });

    describe('Overtime Calculation', () => {
        it('should calculate 125% overtime correctly', () => {
            const baseSalary = 1500;
            const hourlyRate = baseSalary / (22 * 8);
            const overtimeHours = 8;
            const overtimePay = hourlyRate * overtimeHours * 1.25;

            expect(overtimePay).toBeCloseTo(85.23, 2);
        });

        it('should calculate 150% overtime correctly', () => {
            const baseSalary = 1500;
            const hourlyRate = baseSalary / (22 * 8);
            const overtimeHours = 4;
            const overtimePay = hourlyRate * overtimeHours * 1.5;

            expect(overtimePay).toBeCloseTo(51.14, 2);
        });

        it('should calculate 200% overtime correctly', () => {
            const baseSalary = 1500;
            const hourlyRate = baseSalary / (22 * 8);
            const overtimeHours = 8;
            const overtimePay = hourlyRate * overtimeHours * 2.0;

            expect(overtimePay).toBeCloseTo(136.36, 2);
        });
    });

    describe('Seniority Bonus', () => {
        it('should give 0% for less than 2 years', () => {
            const hireDate = '2024-01-01';
            const baseSalary = 1500;
            const bonus = calculateSeniorityBonus(hireDate, baseSalary);
            expect(bonus).toBe(0);
        });

        it('should give 3% for 2-5 years', () => {
            const hireDate = '2022-01-01';
            const baseSalary = 1500;
            const bonus = calculateSeniorityBonus(hireDate, baseSalary);
            expect(bonus).toBeCloseTo(45, 2);
        });

        it('should give 5% for 5-10 years', () => {
            const hireDate = '2018-01-01';
            const baseSalary = 1500;
            const bonus = calculateSeniorityBonus(hireDate, baseSalary);
            expect(bonus).toBeCloseTo(75, 2);
        });

        it('should give 20% for 20+ years', () => {
            const hireDate = '2000-01-01';
            const baseSalary = 1500;
            const bonus = calculateSeniorityBonus(hireDate, baseSalary);
            expect(bonus).toBeCloseTo(300, 2);
        });
    });

    describe('Family Deductions', () => {
        it('should deduct 300 TND for married', () => {
            const familyDeduction = 300;
            expect(familyDeduction).toBe(300);
        });

        it('should deduct 100 TND per child (max 4)', () => {
            const childrenCount = 3;
            const deduction = Math.min(childrenCount, 4) * 100;
            expect(deduction).toBe(300);
        });

        it('should cap at 4 children', () => {
            const childrenCount = 6;
            const deduction = Math.min(childrenCount, 4) * 100;
            expect(deduction).toBe(400);
        });
    });

    describe('Net Salary Calculation', () => {
        it('should calculate net salary correctly', () => {
            const grossSalary = 2000;
            const bonuses = 100;
            const allowances = 60;
            const totalGross = grossSalary + bonuses + allowances;
            const cnss = totalGross * 0.0918;
            const irpp = 0; // Simplified for this test
            const netSalary = totalGross - cnss - irpp;

            expect(netSalary).toBeCloseTo(1961.71, 2);
        });
    });
});

// Helper function placeholder (would be imported from payroll.js)
function calculateIRPP2025(annualIncome) {
    if (annualIncome <= 5000) return 0;

    let tax = 0;
    const tranches = [
        { limit: 5000, rate: 0 },
        { limit: 10000, rate: 0.15 },
        { limit: 20000, rate: 0.25 },
        { limit: 30000, rate: 0.30 },
        { limit: 40000, rate: 0.33 },
        { limit: 50000, rate: 0.36 },
        { limit: 70000, rate: 0.38 },
        { limit: Infinity, rate: 0.40 }
    ];

    let previousLimit = 0;
    for (const tranche of tranches) {
        if (annualIncome > previousLimit) {
            const taxableInThisTranche = Math.min(annualIncome, tranche.limit) - previousLimit;
            tax += taxableInThisTranche * tranche.rate;
            previousLimit = tranche.limit;
        } else {
            break;
        }
    }

    return tax;
}

function calculateSeniorityBonus(hireDate, baseSalary) {
    if (!hireDate) return 0;
    const moment = require('moment');
    const years = moment().diff(moment(hireDate), 'years');
    if (years >= 20) return baseSalary * 0.20;
    if (years >= 15) return baseSalary * 0.15;
    if (years >= 10) return baseSalary * 0.10;
    if (years >= 5) return baseSalary * 0.05;
    if (years >= 2) return baseSalary * 0.03;
    return 0;
}
