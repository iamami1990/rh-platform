const axios = require('axios');
async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@test.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Token acquired. Generating payroll for 2026-06...');

        try {
            const res = await axios.post('http://localhost:5000/api/payroll/generate', {
                month: '2026-06'
            }, {
                headers: { Authorization: 'Bearer ' + token }
            });
            console.log('Payroll Success:', res.status);
            console.log(JSON.stringify(res.data, null, 2));
        } catch (err) {
            console.log('Payroll Failed Status:', err.response?.status);
            console.log('Payroll Failed Data:', err.response?.data);
        }
    } catch (e) {
        console.error('Login Failed', e.message);
        if (e.response) console.error(e.response.data);
    }
}
run();
