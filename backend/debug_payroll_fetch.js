async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Token acquired. Generating payroll for 2026-07...');

        const res = await fetch('http://localhost:5000/api/payroll/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ month: '2026-07' })
        });

        if (!res.ok) {
            console.log('Payroll Failed Status:', res.status);
            const text = await res.text();
            console.log('Payroll Failed Body:', text);
        } else {
            console.log('Payroll Success:', res.status);
            const data = await res.json();
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error('Script Error:', e.message);
    }
}
run();
