// Test login endpoint using native fetch
async function testLogin() {
    console.log('🧪 Testing login endpoint...\n');

    const credentials = {
        email: 'admin@olympia-hr.com',
        password: 'Admin123!'
    };

    console.log('Testing with:');
    console.log('  Email:', credentials.email);
    console.log('  Password:', credentials.password);
    console.log('  Endpoint: http://localhost:5000/api/auth/login');
    console.log('');

    try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ LOGIN SUCCESSFUL!\n');
            console.log('Status:', response.status);
            console.log('Response:', JSON.stringify(data, null, 2));

            if (data.token) {
                console.log('\n🎉 Token received!');
                console.log('User:', data.user);
                console.log('\n✅ The login works perfectly!');
                console.log('You can now login on http://localhost:3000/login');
            }
        } else {
            console.log('❌ LOGIN FAILED\n');
            console.log('Status:', response.status);
            console.log('Error:', JSON.stringify(data, null, 2));

            if (response.status === 401) {
                console.log('\n🔍 401 Unauthorized - Possible reasons:');
                console.log('1. Password hash doesn\'t match');
                console.log('2. User not found in Firestore "users" collection');
                console.log('3. Document ID doesn\'t match Firebase Auth UID');
            } else if (response.status === 500) {
                console.log('\n🔍 500 Server Error - Check backend logs');
            }
        }

    } catch (error) {
        console.log('❌ CONNECTION ERROR\n');
        console.log('Error:', error.message);
        console.log('\n🔍 Make sure backend is running on port 5000');
    }
}

testLogin();
