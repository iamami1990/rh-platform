process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/rh_platform_test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

describe('RBAC Tests', () => {
    let adminToken;
    let employeeToken;
    let employeeA;
    let employeeB;

    beforeAll(async () => {
        await mongoose.connection.dropDatabase();

        employeeA = await Employee.create({
            firstName: 'Alice',
            lastName: 'Test',
            email: 'alice@test.tn',
            department: 'IT',
            position: 'Dev',
            contract_type: 'CDI',
            hireDate: new Date(),
            salary_brut: 1000
        });

        employeeB = await Employee.create({
            firstName: 'Bob',
            lastName: 'Test',
            email: 'bob@test.tn',
            department: 'IT',
            position: 'Dev',
            contract_type: 'CDI',
            hireDate: new Date(),
            salary_brut: 1000
        });

        const adminPass = await bcrypt.hash('Admin123!', 10);
        await User.create({ email: 'admin@test.tn', password: adminPass, role: 'admin' });

        const empPass = await bcrypt.hash('Emp123!', 10);
        await User.create({ email: 'emp@test.tn', password: empPass, role: 'employee', employee: employeeA._id, employee_id: employeeA._id });

        const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.tn', password: 'Admin123!' });
        adminToken = adminLogin.body.token;

        const empLogin = await request(app).post('/api/auth/login').send({ email: 'emp@test.tn', password: 'Emp123!' });
        employeeToken = empLogin.body.token;
    });

    it('employee cannot read other employee attendance', async () => {
        await Attendance.create({
            employee: employeeB._id,
            employee_id: employeeB._id,
            date: '2026-02-08',
            status: 'present',
            check_in_time: new Date()
        });

        const res = await request(app)
            .get(`/api/attendance/employee/${employeeB._id}`)
            .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.statusCode).toBe(403);
    });

    it('admin can list attendance', async () => {
        const res = await request(app)
            .get('/api/attendance')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
    });
});
