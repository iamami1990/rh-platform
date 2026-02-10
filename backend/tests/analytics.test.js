process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/rh_platform_test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');

describe('Analytics API Tests', () => {
    let adminToken;

    beforeAll(async () => {
        const connectDB = require('../config/db');
        await connectDB();
        await mongoose.connection.dropDatabase();

        const adminPass = await bcrypt.hash('Admin123!', 10);
        await User.create({ email: 'admin-ana@test.tn', password: adminPass, role: 'admin' });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin-ana@test.tn', password: 'Admin123!' });
        adminToken = adminLogin.body.token;

        // Create some employees for stats
        await Employee.create({
            firstName: 'Ana', lastName: 'Lytics', email: 'ana.lytics@test.tn',
            department: 'Data', position: 'Analyst', contract_type: 'CDI',
            hireDate: new Date('2025-01-01'), salary_brut: 2500, status: 'active', gender: 'female'
        });
        await Employee.create({
            firstName: 'Bob', lastName: 'Builder', email: 'bob.builder@test.tn',
            department: 'Construction', position: 'Worker', contract_type: 'CDD',
            hireDate: new Date('2025-02-01'), salary_brut: 1500, status: 'active', gender: 'male'
        });
    });

    describe('GET /api/analytics/behavioral-patterns', () => {
        it('should return behavioral patterns', async () => {
            const res = await request(app)
                .get('/api/analytics/behavioral-patterns')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('patterns');
            expect(res.body.patterns).toHaveProperty('check_in_clusters');
        });
    });

    describe('GET /api/analytics/team-dynamics', () => {
        it('should return team statistics', async () => {
            const res = await request(app)
                .get('/api/analytics/team-dynamics')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.dynamics.total_employees).toBe(2);
            expect(res.body.dynamics.diversity.female).toBe(1);
            expect(res.body.dynamics.diversity.male).toBe(1);
        });
    });

    describe('GET /api/analytics/turnover-prediction', () => {
        it('should return turnover predictions', async () => {
            const res = await request(app)
                .get('/api/analytics/turnover-prediction')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.predictions)).toBe(true);
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });
});
