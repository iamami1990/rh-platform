const request = require('supertest');
const app = require('../server');

describe('Integration Tests - Complete API Flows', () => {
    let authToken;
    let testEmployeeId;

    beforeAll(async () => {
        // Login to get auth token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@olympia.com',
                password: 'Admin123!'
            });

        authToken = loginResponse.body.token;
    });

    describe('Employee Lifecycle', () => {
        test('Create new employee → Get employee → Update → Delete', async () => {
            // 1. Create employee
            const createResponse = await request(app)
                .post('/api/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'Test',
                    lastName: 'Employee',
                    email: 'test.employee@olympia.com',
                    phone: '+216 12 345 678',
                    department: 'IT',
                    position: 'Developer',
                    hireDate: '2025-01-01',
                    salary_brut: 2000,
                    contract_type: 'CDI'
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.employee).toHaveProperty('employee_id');
            testEmployeeId = createResponse.body.employee.employee_id;

            // 2. Get employee
            const getResponse = await request(app)
                .get(`/api/employees/${testEmployeeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.employee.email).toBe('test.employee@olympia.com');

            // 3. Update employee
            const updateResponse = await request(app)
                .put(`/api/employees/${testEmployeeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    salary_brut: 2500
                });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.employee.salary_brut).toBe(2500);

            // 4. Soft delete employee
            const deleteResponse = await request(app)
                .delete(`/api/employees/${testEmployeeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(deleteResponse.status).toBe(200);
        });
    });

    describe('Attendance Flow', () => {
        test('Check-in → Check-out → Get history', async () => {
            // 1. Check-in
            const checkInResponse = await request(app)
                .post('/api/attendance/check-in')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    employee_id: testEmployeeId,
                    location: { lat: 36.8065, lng: 10.1815 }
                });

            expect(checkInResponse.status).toBe(201);
            const attendanceId = checkInResponse.body.attendance.attendance_id;

            // 2. Check-out
            const checkOutResponse = await request(app)
                .post('/api/attendance/check-out')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    employee_id: testEmployeeId
                });

            expect(checkOutResponse.status).toBe(200);

            // 3. Get history
            const historyResponse = await request(app)
                .get(`/api/attendance/employee/${testEmployeeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(historyResponse.status).toBe(200);
            expect(Array.isArray(historyResponse.body.attendance)).toBe(true);
        });
    });

    describe('Leave Request Flow', () => {
        test('Request leave → Approve → Check balance', async () => {
            // 1. Request leave
            const leaveResponse = await request(app)
                .post('/api/leaves')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    employee_id: testEmployeeId,
                    leave_type: 'annual',
                    start_date: '2025-02-01',
                    end_date: '2025-02-05',
                    reason: 'Vacances familiales'
                });

            expect(leaveResponse.status).toBe(201);
            const leaveId = leaveResponse.body.leave.leave_id;

            // 2. Approve leave
            const approveResponse = await request(app)
                .put(`/api/leaves/${leaveId}/approve`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(approveResponse.status).toBe(200);
            expect(approveResponse.body.leave.status).toBe('approved');

            // 3. Check balance
            const balanceResponse = await request(app)
                .get(`/api/leaves/balance/${testEmployeeId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(balanceResponse.status).toBe(200);
            expect(balanceResponse.body.balance).toHaveProperty('annual');
        });
    });

    describe('Payroll Generation Flow', () => {
        test('Generate payroll → Get payroll → Verify calculations', async () => {
            const month = '2025-01';

            // 1. Generate payroll
            const generateResponse = await request(app)
                .post('/api/payroll/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ month });

            expect(generateResponse.status).toBe(201);

            // 2. Get payroll report
            const reportResponse = await request(app)
                .get('/api/payroll/report')
                .query({ month })
                .set('Authorization', `Bearer ${authToken}`);

            expect(reportResponse.status).toBe(200);
            expect(reportResponse.body.report).toHaveProperty('total_gross');
            expect(reportResponse.body.report).toHaveProperty('total_net');

            // 3. Verify calculations (net = gross - deductions)
            const { total_gross, total_deductions, total_net } = reportResponse.body.report;
            expect(Math.abs(total_net - (total_gross - total_deductions))).toBeLessThan(0.01);
        });
    });

    describe('Sentiment Analysis Flow', () => {
        test('Generate sentiment → Get alerts → Verify scoring', async () => {
            const month = '2025-01';

            // 1. Generate sentiment analysis
            const generateResponse = await request(app)
                .post('/api/sentiment/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ month });

            expect(generateResponse.status).toBe(201);

            // 2. Get sentiment alerts
            const alertsResponse = await request(app)
                .get('/api/sentiment/alerts')
                .set('Authorization', `Bearer ${authToken}`);

            expect(alertsResponse.status).toBe(200);
            expect(Array.isArray(alertsResponse.body.alerts)).toBe(true);

            // 3. Verify scoring logic
            if (alertsResponse.body.alerts.length > 0) {
                const alert = alertsResponse.body.alerts[0];
                expect(alert.overall_score).toBeLessThan(50); // High risk threshold
                expect(alert.risk_level).toBe('high');
            }
        });
    });

    describe('Dashboard Integration', () => {
        test('Admin dashboard returns all KPIs', async () => {
            const response = await request(app)
                .get('/api/dashboard/admin')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.dashboard).toHaveProperty('employees');
            expect(response.body.dashboard).toHaveProperty('attendance');
            expect(response.body.dashboard).toHaveProperty('payroll');
            expect(response.body.dashboard).toHaveProperty('sentiment');
        });
    });

    describe('Error Handling', () => {
        test('Returns 401 for unauthorized requests', async () => {
            const response = await request(app).get('/api/employees');
            expect(response.status).toBe(401);
        });

        test('Returns 400 for invalid data', async () => {
            const response = await request(app)
                .post('/api/employees')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    firstName: 'Test'
                    // Missing required fields
                });

            expect(response.status).toBe(400);
        });

        test('Returns 404 for non-existent resources', async () => {
            const response = await request(app)
                .get('/api/employees/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });
});
