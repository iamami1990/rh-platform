const http = require('http');

function postRequest(path, data, token) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        if (token) options.headers['Authorization'] = 'Bearer ' + token;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await postRequest('/api/auth/login', { email: 'admin@test.com', password: 'password123' });
        console.log('Login Status:', loginRes.status);

        if (loginRes.status !== 200) {
            console.log('Login failed:', loginRes.data);
            return;
        }

        const token = JSON.parse(loginRes.data).token;
        console.log('Generating payroll...');

        const payRes = await postRequest('/api/payroll/generate', { month: '2026-09' }, token);
        console.log('Payroll Status:', payRes.status);
        if (payRes.status !== 201) {
            console.log('Payroll Failed:', payRes.data);
        } else {
            console.log('Payroll Success');
        }

    } catch (e) {
        console.error('Script Error:', e.message);
    }
}
run();
