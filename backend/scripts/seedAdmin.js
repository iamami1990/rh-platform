/**
 * Script to seed the admin user in Firestore
 * Run: node scripts/seedAdmin.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Initialize Firebase
let credential;
try {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
    console.log('✓ Firebase Admin SDK loaded');
} catch (error) {
    console.error('❌ Could not load service account:', error.message);
    process.exit(1);
}

admin.initializeApp({
    credential: credential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'tp22-64555'
});

const db = admin.firestore();

async function seedAdmin() {
    try {
        console.log('\n🔧 Seeding Admin User...\n');

        // Admin user data
        const adminEmail = 'admin@olympia-hr.com';
        const adminPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Check if admin already exists
        const existingUser = await db.collection('users')
            .where('email', '==', adminEmail)
            .limit(1)
            .get();

        if (!existingUser.empty) {
            console.log('⚠️  Admin user already exists. Updating password...');
            const userDoc = existingUser.docs[0];
            await db.collection('users').doc(userDoc.id).update({
                password: hashedPassword,
                updated_at: new Date()
            });
            console.log('✓ Admin password updated!');
        } else {
            // Create new admin user
            const userId = 'admin-' + Date.now();
            await db.collection('users').doc(userId).set({
                user_id: userId,
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                employee_id: null,
                created_at: new Date(),
                last_login: null
            });
            console.log('✓ Admin user created!');
        }

        console.log('\n========================================');
        console.log('Admin Credentials:');
        console.log('  Email:    ' + adminEmail);
        console.log('  Password: ' + adminPassword);
        console.log('========================================\n');

        console.log('✅ Seed complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
}

seedAdmin();
