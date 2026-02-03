const ADMIN_EMAIL = 'admin@olympia-hr.com';
const ADMIN_PASSWORD = 'Admin123!';
const BASE_URL = 'http://localhost:5000/api';

async function diagnose() {
    try {
        console.log('--- Logging in ---');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${loginData.message}`);

        const token = loginData.token;
        console.log('✓ Login successful');

        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('\n--- Testing /api/leaves?status=pending ---');
        const leavesRes = await fetch(`${BASE_URL}/leaves?status=pending`, { headers });
        const leavesData = await leavesRes.json();
        if (leavesRes.ok) {
            console.log('✓ Leaves fetched successfully:', leavesData.count);
        } else {
            console.error('❌ Leaves failed:', leavesData);
        }

        console.log('\n--- Testing /api/payroll?month=2025-12 ---');
        const payrollRes = await fetch(`${BASE_URL}/payroll?month=2025-12`, { headers });
        const payrollData = await payrollRes.json();
        if (payrollRes.ok) {
            console.log('✓ Payroll fetched successfully:', payrollData.count);
        } else {
            console.error('❌ Payroll failed:', payrollData);
        }

    } catch (error) {
        console.error('Global Error:', error.message);
    }
}

diagnose();
