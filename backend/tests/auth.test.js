process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/rh_platform_test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');

describe('Authentication Tests', () => {
    let authToken;
    let refreshToken;
    const testUser = {
        email: 'test.admin@olympia-hr.tn',
        password: 'TestPassword123!',
        role: 'admin'
    };

    beforeAll(async () => {
        await mongoose.connection.dropDatabase();
        const hashed = await bcrypt.hash(testUser.password, 10);
        await User.create({ email: testUser.email, password: hashed, role: testUser.role });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user).toHaveProperty('email', testUser.email);

            // Store tokens for subsequent tests
            authToken = res.body.token;
            refreshToken = res.body.refreshToken;
        });

        it('should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });

        it('should reject missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    describe('POST /api/auth/refresh-token', () => {
        it('should refresh token with valid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('refreshToken');

            // Update tokens
            authToken = res.body.token;
            refreshToken = res.body.refreshToken;
        });

        it('should reject invalid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh-token')
                .send({ refreshToken: 'invalid-token' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should get current user with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.user).toHaveProperty('email');
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ refreshToken });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });
});
