process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/rh_platform_test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');

describe('Employee Management Tests', () => {
    let authToken;
    let employeeId;

    beforeAll(async () => {
        await mongoose.connection.dropDatabase();
        const hashed = await bcrypt.hash('Admin123!', 10);
        await User.create({ email: 'admin-emp@test.tn', password: hashed, role: 'admin' });

        const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin-emp@test.tn', password: 'Admin123!' });
        authToken = loginRes.body.token;
    });

    describe('POST /api/employees', () => {
        it('should create a new employee', async () => {
            const res = await request(app)
                .post('/api/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'New',
                    lastName: 'Employee',
                    email: 'new.emp@test.tn',
                    department: 'Sales',
                    position: 'Manager',
                    contract_type: 'CDI',
                    hireDate: new Date(),
                    salary_brut: 3000
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.employee).toHaveProperty('_id');
            employeeId = res.body.employee._id;
        });

        it('should validate required fields', async () => {
            const res = await request(app)
                .post('/api/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'Incomplete'
                });

            expect(res.statusCode).toBe(500); // Mongoose validation error usually 500 in this setup
        });
    });

    describe('GET /api/employees', () => {
        it('should get all employees', async () => {
            const res = await request(app)
                .get('/api/employees')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.count).toBeGreaterThan(0);
        });

        it('should get employee by ID', async () => {
            const res = await request(app)
                .get(`/api/employees/${employeeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.employee).toHaveProperty('email', 'new.emp@test.tn');
        });
    });

    describe('PUT /api/employees/:id', () => {
        it('should update employee details', async () => {
            const res = await request(app)
                .put(`/api/employees/${employeeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    position: 'Senior Manager',
                    salary_brut: 3500
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.employee).toHaveProperty('position', 'Senior Manager');
            expect(res.body.employee).toHaveProperty('salary_brut', 3500);
        });
    });

    describe('PUT /api/employees/:id/pin', () => {
        it('should set kiosk PIN', async () => {
            // Need a user linked to this employee first
            await User.create({
                email: 'linked.user@test.tn',
                password: 'password',
                role: 'employee',
                employee: employeeId,
                employee_id: employeeId
            });

            const res = await request(app)
                .put(`/api/employees/${employeeId}/pin`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ pin: '1234' });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toContain('PIN updated');
        });

        it('should reject short PIN', async () => {
            const res = await request(app)
                .put(`/api/employees/${employeeId}/pin`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ pin: '12' });

            expect(res.statusCode).toBe(400); // Validation error handled correctly
        });
    });

    describe('DELETE /api/employees/:id', () => {
        it('should soft-delete employee', async () => {
            const res = await request(app)
                .delete(`/api/employees/${employeeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);

            // Verify status is inactive
            const check = await request(app)
                .get(`/api/employees/${employeeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(check.body.employee.status).toBe('inactive');
        });
    });
});
