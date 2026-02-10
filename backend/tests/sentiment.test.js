process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/rh_platform_test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Sentiment = require('../models/Sentiment');

describe('Sentiment Analysis Tests', () => {
    let adminToken;
    let employeeId;

    beforeAll(async () => {
        await mongoose.connection.dropDatabase();

        const adminPass = await bcrypt.hash('Admin123!', 10);
        await User.create({ email: 'admin-sent@test.tn', password: adminPass, role: 'admin' });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin-sent@test.tn', password: 'Admin123!' });
        adminToken = adminLogin.body.token;

        const emp = await Employee.create({
            firstName: 'Sent',
            lastName: 'Iment',
            email: 'sent.iment@test.tn',
            department: 'IT',
            position: 'Dev',
            contract_type: 'CDI',
            hireDate: new Date(),
            salary_brut: 2000,
            status: 'active'
        });
        employeeId = emp._id.toString();
    });

    describe('POST /api/sentiment/generate', () => {
        it('should generate sentiment for a month', async () => {
            // Mock some data if needed, but service handles empty data with 0s
            const res = await request(app)
                .post('/api/sentiment/generate')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ month: '2026-01' });

            expect(res.statusCode).toBe(201);
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0]).toHaveProperty('overall_score');

            // Score should be low/neutral because strict logic (0 present days = 0 attendance score)
            // attendance_rate = 0 -> score 0
            // punctuality_rate = 0 -> score 10 (0/0 treated as 0 late rate?)
            // wait, (0/0) is NaN. 
            // In service: present_days > 0 ? (late_days / present_days) : 0;
            // So if 0 present, late rate is 0. Punctuality score = 10.
            // Assiduity: absence_rate (0/22) = 0. Score 10.
            // Workload: leave_rate (0/22) = 0. Score 8.
            // Overall: (0*30 + 10*25 + 10*25 + 8*20) / 10 = (0 + 250 + 250 + 160) / 10 = 660/10 = 66.

            expect(res.body.results[0].overall_score).toBeGreaterThan(60);
        });
    });

    describe('GET /api/sentiment', () => {
        it('should list sentiments', async () => {
            const res = await request(app)
                .get('/api/sentiment?month=2026-01')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.sentiments).toHaveLength(1);
        });
    });
});
