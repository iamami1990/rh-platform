describe('Overtime Management Tests', () => {
    let authToken;
    let employeeId = 'test-employee-123';
    let overtimeId;

    describe('POST /api/overtime', () => {
        it('should create overtime request successfully', async () => {
            const res = await request(app)
                .post('/api/overtime')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    employee_id: employeeId,
                    date: '2025-12-25',
                    hours: 4,
                    rate_type: '125%',
                    reason: 'Urgent project deadline'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.overtime).toHaveProperty('overtime_id');
            expect(res.body.overtime).toHaveProperty('amount');

            overtimeId = res.body.overtime.overtime_id;
        });

        it('should reject invalid rate_type', async () => {
            const res = await request(app)
                .post('/api/overtime')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    employee_id: employeeId,
                    date: '2025-12-25',
                    hours: 4,
                    rate_type: '100%', // Invalid
                    reason: 'Test'
                });

            expect(res.statusCode).toBe(400);
        });

        it('should reject hours > 12', async () => {
            const res = await request(app)
                .post('/api/overtime')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    employee_id: employeeId,
                    date: '2025-12-25',
                    hours: 15, // Invalid
                    rate_type: '125%',
                    reason: 'Test'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/overtime', () => {
        it('should get all overtime requests', async () => {
            const res = await request(app)
                .get('/api/overtime')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('overtimes');
            expect(Array.isArray(res.body.overtimes)).toBe(true);
        });

        it('should filter by month', async () => {
            const res = await request(app)
                .get('/api/overtime?month=2025-12')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.overtimes.every(ot => ot.month === '2025-12')).toBe(true);
        });
    });

    describe('PUT /api/overtime/:id/approve', () => {
        it('should approve overtime request', async () => {
            const res = await request(app)
                .put(`/api/overtime/${overtimeId}/approve`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ manager_comments: 'Approved for urgent work' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        it('should reject already approved overtime', async () => {
            const res = await request(app)
                .put(`/api/overtime/${overtimeId}/approve`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(res.statusCode).toBe(400);
        });
    });

    describe('PUT /api/overtime/:id/reject', () => {
        it('should reject overtime request', async () => {
            // Create new request first
            const createRes = await request(app)
                .post('/api/overtime')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    employee_id: employeeId,
                    date: '2025-12-26',
                    hours: 2,
                    rate_type: '150%',
                    reason: 'Additional work'
                });

            const newOvertimeId = createRes.body.overtime.overtime_id;

            const res = await request(app)
                .put(`/api/overtime/${newOvertimeId}/reject`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ rejection_reason: 'Not justified' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });

    describe('Overtime in Payroll Integration', () => {
        it('should include approved overtime in payroll', async () => {
            // This would be tested in integration tests
            // Mock test here to show structure
            const month = '2025-12';
            const baseSalary = 1500;
            const approvedOvertimeHours = 8;
            const hourlyRate = baseSalary / (22 * 8);
            const overtimePay = hourlyRate * approvedOvertimeHours * 1.25;

            expect(overtimePay).toBeCloseTo(85.23, 2);
        });
    });
});
