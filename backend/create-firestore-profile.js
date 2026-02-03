// Create Firestore user profile with specific UID
const { db } = require('./config/firebase');
const bcrypt = require('bcryptjs');

const USER_UID = 'HF4KLOVY5VVd8FLJ8K9MyUIDGFR2';
const ADMIN_EMAIL = 'admin@olympia-hr.com';
const ADMIN_PASSWORD = 'Admin123!';

async function createFirestoreProfile() {
    try {
        console.log('🔧 Creating Firestore profile...\n');

        // Generate password hash
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        // Create user document
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

        console.log(`Creating document with ID: ${USER_UID}`);
        console.log(`Email: ${ADMIN_EMAIL}\n`);

        await db.collection('users').doc(USER_UID).set(userData);

        console.log('✅ User profile created in Firestore!');
        console.log(`   Path: users/${USER_UID}`);

        // Verify
        const doc = await db.collection('users').doc(USER_UID).get();
        if (doc.exists) {
            console.log('\n✅ Verification: Document exists!');
            console.log('\nDocument data:');
            console.log(JSON.stringify(doc.data(), null, 2));
        }

        console.log('\n🎉 SETUP COMPLETE!\n');
        console.log('You can now login with:');
        console.log(`  Email:    ${ADMIN_EMAIL}`);
        console.log(`  Password: ${ADMIN_PASSWORD}`);
        console.log('\nGo to: http://localhost:3000/login');
        console.log('\nThe login will work immediately!');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createFirestoreProfile();
