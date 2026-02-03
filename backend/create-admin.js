// Create admin user directly in Firestore
const { db, auth } = require('./config/firebase');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@olympia-hr.com';
const ADMIN_PASSWORD = 'Admin123!';

async function createAdminUser() {
    try {
        console.log('🔧 Creating admin user in Firestore...\n');

        // Get Firebase Auth UID
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
            console.log('✓ Found user in Authentication');
            console.log(`  UID: ${userRecord.uid}`);
        } catch (error) {
            console.log('❌ User not found in Firebase Authentication!');
            console.log('Please create the user in Firebase Console first:');
            console.log(`1. Go to: https://console.firebase.google.com/project/tp22-64555/authentication/users`);
            console.log(`2. Add user: ${ADMIN_EMAIL}`);
            console.log(`3. Password: ${ADMIN_PASSWORD}`);
            process.exit(1);
        }

        // Generate password hash
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Create user document in Firestore
        const userData = {
            email: ADMIN_EMAIL,
            password: passwordHash,
            firstName: 'Admin',
            lastName: 'Olympia',
            role: 'admin',
            status: 'active',
            created_at: new Date(),
            last_login: null,
            employee_id: null
        };

        await db.collection('users').doc(userRecord.uid).set(userData);

        console.log('\n✅ User created successfully in Firestore!');
        console.log(`   Collection: users/${userRecord.uid}`);
        console.log('\nUser data:');
        console.log(JSON.stringify(userData, null, 2));

        console.log('\n🎉 Setup complete!');
        console.log('\nYou can now login with:');
        console.log(`  Email: ${ADMIN_EMAIL}`);
        console.log(`  Password: ${ADMIN_PASSWORD}`);
        console.log('\nGo to: http://localhost:3000/login');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createAdminUser();
