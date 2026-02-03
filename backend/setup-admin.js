// Complete admin user setup - creates in both Authentication and Firestore
const { admin, db } = require('./config/firebase');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@olympia-hr.com';
const ADMIN_PASSWORD = 'Admin123!';

async function setupAdminUser() {
    try {
        console.log('🚀 Setting up admin user...\n');

        // Step 1: Create or get user from Firebase Authentication
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
            console.log('✓ User already exists in Authentication');
            console.log(`  UID: ${userRecord.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('Creating user in Firebase Authentication...');
                userRecord = await admin.auth().createUser({
                    email: ADMIN_EMAIL,
                    password: ADMIN_PASSWORD,
                    emailVerified: true,
                    displayName: 'Admin Olympia'
                });
                console.log('✅ User created in Authentication');
                console.log(`   UID: ${userRecord.uid}`);
            } else {
                throw error;
            }
        }

        // Step 2: Generate password hash for Firestore
        console.log('\nGenerating password hash...');
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        console.log('✓ Password hash generated');

        // Step 3: Create user document in Firestore
        console.log('\nCreating user document in Firestore...');
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
        console.log('✅ User document created in Firestore');
        console.log(`   Path: users/${userRecord.uid}`);

        // Step 4: Verify
        console.log('\nVerifying setup...');
        const doc = await db.collection('users').doc(userRecord.uid).get();
        if (doc.exists) {
            console.log('✅ User document verified in Firestore');
        }

        console.log('\n🎉 SETUP COMPLETE!\n');
        console.log('You can now login with:');
        console.log(`  Email:    ${ADMIN_EMAIL}`);
        console.log(`  Password: ${ADMIN_PASSWORD}`);
        console.log('\nGo to: http://localhost:3000/login');
        console.log('\nThe login should work immediately!');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error during setup:');
        console.error(error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        process.exit(1);
    }
}

setupAdminUser();
