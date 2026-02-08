const request = require('supertest');
const app = require('../server');

describe('Kiosk API', () => {
    it('should reject verify without image or pin', async () => {
        const res = await request(app).post('/api/kiosk/verify').send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
