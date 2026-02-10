process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/rh_platform_test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

describe('Attendance API Tests', () => {
    let adminToken;
    let employeeToken;
    let employeeId;
    let userId;

    beforeAll(async () => {
        await mongoose.connection.dropDatabase();

        // Create Admin
        const adminPass = await bcrypt.hash('Admin123!', 10);
        await User.create({ email: 'admin-att@test.tn', password: adminPass, role: 'admin' });
        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin-att@test.tn', password: 'Admin123!' });
        adminToken = adminLogin.body.token;

        // Create Employee
        const emp = await Employee.create({
            firstName: 'Att',
            lastName: 'Endance',
            email: 'att.endance@test.tn',
            department: 'IT',
            position: 'Tester',
            contract_type: 'CDI',
            hireDate: new Date(),
            salary_brut: 1500,
            work_start_time: '08:00'
        });
        employeeId = emp._id.toString();

        // Create User for Employee
        const userPass = await bcrypt.hash('User123!', 10);
        const user = await User.create({
            email: 'att.user@test.tn',
            password: userPass,
            role: 'employee',
            employee: employeeId,
            employee_id: employeeId
        });
        userId = user._id;

        const userLogin = await request(app).post('/api/auth/login').send({ email: 'att.user@test.tn', password: 'User123!' });
        employeeToken = userLogin.body.token;
    });

    describe('POST /api/attendance/check-in', () => {
        it('should allow employee to check in', async () => {
            const res = await request(app)
                .post('/api/attendance/check-in')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    liveness_score: 0.95,
                    location: { lat: 36.8, lng: 10.1 } // Arbitrary, no geofence set on emp
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.attendance).toHaveProperty('check_in_time');
            expect(res.body.attendance.status).toMatch(/present|late/);
        });

        it('should prevent duplicate check-in', async () => {
            const res = await request(app)
                .post('/api/attendance/check-in')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({ liveness_score: 0.9 });

            expect(res.statusCode).toBe(400); // Already checked in
            expect(res.body.message).toMatch(/Already checked in/);
        });
    });

    describe('POST /api/attendance/check-out', () => {
        it('should allow employee to check out', async () => {
            const res = await request(app)
                .post('/api/attendance/check-out')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({});

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should prevent double check-out', async () => {
            const res = await request(app)
                .post('/api/attendance/check-out')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({});

            expect(res.statusCode).toBe(400); // Already checked out (or similar logic)
        });
    });

    describe('GET /api/attendance', () => {
        it('should allow admin to list attendance', async () => {
            const res = await request(app)
                .get('/api/attendance')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.count).toBeGreaterThan(0);
        });

        it('should deny employee access to full list', async () => {
            const res = await request(app)
                .get('/api/attendance')
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
