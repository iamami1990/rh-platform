const http = require('http');

const loginData = JSON.stringify({
    email: 'employe@olympia-hr.com',
    password: 'employe123'
});

const loginOptions = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const req = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const response = JSON.parse(data);
        if (response.success) {
            console.log('Login successful');
            const token = response.token;
            const employeeId = response.user.employee_id;
            console.log('Token:', token.substring(0, 10) + '...');
            console.log('Employee ID:', employeeId);

            testEndpoint(token, `/api/attendance/employee/invalid-id`, 'Attendance');
            testEndpoint(token, `/api/leaves/balance/invalid-id`, 'Leaves');
            testEndpoint(token, `/api/payroll/broken`, 'Payroll');
        } else {
            console.error('Login failed:', response.message);
        }
    });
});

req.on('error', (error) => console.error('Login Error:', error.message));
req.write(loginData);
req.end();

function testEndpoint(token, path, name) {
    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: path,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        console.log(`Testing ${name} (${path}): Status ${res.statusCode}`);
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                console.log(`${name} response:`, JSON.stringify(response).substring(0, 200));
            } catch (e) {
                console.log(`${name} raw response:`, data.substring(0, 200));
            }
        });
    });

    req.on('error', (error) => console.error(`${name} Error:`, error.message));
    req.end();
}
