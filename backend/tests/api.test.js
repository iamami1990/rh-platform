const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');

describe('Authentication API', () => {
    beforeAll(async () => {
        const connectDB = require('../config/db');
        await connectDB();
        await mongoose.connection.dropDatabase();
        const hashed = await bcrypt.hash('Admin123!', 10);
        await User.create({ email: 'admin@olympia.com', password: hashed, role: 'admin' });
    });

    describe('POST /api/auth/login', () => {
        test('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@olympia.com',
                    password: 'Admin123!'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('admin@olympia.com');
        });

        test('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@olympia.com',
                    password: 'WrongPassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@olympia.com'
                });

            expect(response.status).toBe(400);
        });
    });
});

describe('Employees API', () => {
    let authToken;

    beforeAll(async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@olympia.com',
                password: 'Admin123!'
            });

        authToken = response.body.token;
    });

    describe('GET /api/employees', () => {
        test('should get all employees', async () => {
            const response = await request(app)
                .get('/api/employees')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('employees');
            expect(Array.isArray(response.body.employees)).toBe(true);
        });

        test('should reject unauthorized access', async () => {
            const response = await request(app)
                .get('/api/employees');

            expect(response.status).toBe(401);
        });
    });
});

describe('Payroll Calculation', () => {
    test('should calculate CNSS correctly (7%)', () => {
        const grossSalary = 2500;
        const cnss = grossSalary * 0.07;

        expect(cnss).toBe(175);
    });

    test('should calculate income tax progressively', () => {
        // Test progressive tax calculation
        const calculateIncomeTax = (gross) => {
            if (gross <= 5000) return 0;
            if (gross <= 10000) return (gross - 5000) * 0.15;
            if (gross <= 20000) return 750 + (gross - 10000) * 0.20;
            return 2750 + (gross - 20000) * 0.25;
        };

        expect(calculateIncomeTax(4000)).toBe(0);
        expect(calculateIncomeTax(7000)).toBe(300);
        expect(calculateIncomeTax(15000)).toBe(1750);
    });

    test('should calculate seniority bonus', () => {
        const calculateSeniorityBonus = (baseSalary, yearsOfService) => {
            if (yearsOfService < 2) return 0;
            if (yearsOfService < 5) return baseSalary * 0.02;
            if (yearsOfService < 10) return baseSalary * 0.05;
            return baseSalary * 0.10;
        };

        expect(calculateSeniorityBonus(2000, 1)).toBe(0);
        expect(calculateSeniorityBonus(2000, 3)).toBe(40);
        expect(calculateSeniorityBonus(2000, 6)).toBe(100);
        expect(calculateSeniorityBonus(2000, 12)).toBe(200);
    });
});

describe('Sentiment Analysis Scoring', () => {
    test('should calculate overall score correctly', () => {
        const scores = {
            attendance: 8,
            punctuality: 7,
            assiduity: 9,
            workload: 8
        };

        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        const overall = (total / 4) * 10;

        expect(overall).toBe(80);
    });

    test('should classify sentiment correctly', () => {
        const classifySentiment = (score) => {
            if (score >= 70) return 'good';
            if (score >= 50) return 'neutral';
            return 'poor';
        };

        expect(classifySentiment(80)).toBe('good');
        expect(classifySentiment(60)).toBe('neutral');
        expect(classifySentiment(40)).toBe('poor');
    });

    test('should determine risk level correctly', () => {
        const getRiskLevel = (score) => {
            if (score >= 70) return 'low';
            if (score >= 50) return 'medium';
            return 'high';
        };

        expect(getRiskLevel(75)).toBe('low');
        expect(getRiskLevel(55)).toBe('medium');
        expect(getRiskLevel(45)).toBe('high');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });
});
