process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/rh_platform_test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');

describe('Leave Management Tests', () => {
    let adminToken;
    let employeeToken;
    let employeeId;
    let leaveId;

    beforeAll(async () => {
        await mongoose.connection.dropDatabase();

        // Create Admin
        const adminPass = await bcrypt.hash('Admin123!', 10);
        await User.create({ email: 'admin-leaf@test.tn', password: adminPass, role: 'admin' });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin-leaf@test.tn', password: 'Admin123!' });
        adminToken = adminLogin.body.token;

        // Create Employee
        const emp = await Employee.create({
            firstName: 'Leaf',
            lastName: 'Taker',
            email: 'leaf.taker@test.tn',
            department: 'HR',
            position: 'Assistant',
            contract_type: 'CDI',
            hireDate: new Date(),
            salary_brut: 1800
        });
        employeeId = emp._id.toString();

        // Create User for Employee
        const userPass = await bcrypt.hash('User123!', 10);
        await User.create({
            email: 'leaf.user@test.tn',
            password: userPass,
            role: 'employee',
            employee: employeeId,
            employee_id: employeeId
        });
        const userLogin = await request(app).post('/api/auth/login').send({ email: 'leaf.user@test.tn', password: 'User123!' });
        employeeToken = userLogin.body.token;
    });

    describe('POST /api/leaves', () => {
        it('should create a leave request', async () => {
            const res = await request(app)
                .post('/api/leaves')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    leave_type: 'annual',
                    start_date: '2026-06-01',
                    end_date: '2026-06-05',
                    reason: 'Summer vacation'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.leave).toHaveProperty('_id');
            expect(res.body.leave.days_requested).toBe(5);
            leaveId = res.body.leave._id;
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/leaves')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    leave_type: 'annual'
                });

            expect(res.statusCode).toBe(500); // Validation error
        });
    });

    describe('PUT /api/leaves/:id/approve', () => {
        it('should approve leave request (admin)', async () => {
            const res = await request(app)
                .put(`/api/leaves/${leaveId}/approve`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toMatch(/approved/);

            const updated = await Leave.findById(leaveId);
            expect(updated.status).toBe('approved');
        });

        it('should deny employee from approving', async () => {
            const res = await request(app)
                .put(`/api/leaves/${leaveId}/approve`)
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.statusCode).toBe(403);
        });
    });

    describe('GET /api/leaves/balance/:id', () => {
        it('should calculate balance correctly', async () => {
            const res = await request(app)
                .get(`/api/leaves/balance/${employeeId}`)
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.balance.annual.used).toBe(5); // 5 days approved
            expect(res.body.balance.annual.remaining).toBe(25 - 5);
        });
    });
});
