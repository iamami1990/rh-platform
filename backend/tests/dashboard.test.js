process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/rh_platform_test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');

describe('Dashboard API Tests', () => {
    let adminToken;
    let employeeToken;
    let employeeId;

    beforeAll(async () => {
        await mongoose.connection.dropDatabase();

        // Create Admin
        const adminPass = await bcrypt.hash('Admin123!', 10);
        await User.create({ email: 'admin-dash@test.tn', password: adminPass, role: 'admin' });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin-dash@test.tn', password: 'Admin123!' });
        adminToken = adminLogin.body.token;

        // Create Employee
        const emp = await Employee.create({
            firstName: 'Dash',
            lastName: 'Board',
            email: 'dash.board@test.tn',
            department: 'Executive',
            position: 'Director',
            contract_type: 'CDI',
            hireDate: new Date(),
            salary_brut: 5000,
            status: 'active'
        });
        employeeId = emp._id.toString();

        // Create User for Employee
        const userPass = await bcrypt.hash('User123!', 10);
        await User.create({
            email: 'dash.user@test.tn',
            password: userPass,
            role: 'employee',
            employee: employeeId,
            employee_id: employeeId
        });
        const userLogin = await request(app).post('/api/auth/login').send({ email: 'dash.user@test.tn', password: 'User123!' });
        employeeToken = userLogin.body.token;
    });

    describe('GET /api/dashboard/admin', () => {
        it('should return admin dashboard stats', async () => {
            const res = await request(app)
                .get('/api/dashboard/admin')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.dashboard).toHaveProperty('employees');
            expect(res.body.dashboard.employees.active).toBeGreaterThanOrEqual(1);
        });

        it('should deny employee access', async () => {
            const res = await request(app)
                .get('/api/dashboard/admin')
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.statusCode).toBe(403);
        });
    });

    describe('GET /api/dashboard/employee', () => {
        it('should return employee dashboard stats', async () => {
            const res = await request(app)
                .get('/api/dashboard/employee')
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.dashboard).toHaveProperty('leave_balance');
            expect(res.body.dashboard.leave_balance).toHaveProperty('annual');
        });
    });
});
