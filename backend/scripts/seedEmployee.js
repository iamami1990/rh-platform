/**
 * Script to seed a test employee user in Firestore
 * Run: node scripts/seedEmployee.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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

async function seedEmployee() {
    try {
        console.log('\n🔧 Seeding Test Employee...\n');

        const employeeId = 'EMP_' + uuidv4().substring(0, 8).toUpperCase();
        const userEmail = 'employe@olympia-hr.com';
        const userPassword = 'employe123';
        const hashedPassword = await bcrypt.hash(userPassword, 10);

        // 1. Create Employee record
        const employeeData = {
            employee_id: employeeId,
            first_name: 'Jean',
            last_name: 'Dupont',
            email: userEmail,
            phone: '+33 6 12 34 56 78',
            department: 'Développement',
            position: 'Développeur',
            hire_date: new Date('2024-01-15'),
            status: 'active',
            work_start_time: '09:00',
            work_end_time: '18:00',
            workplace_location: null, // No geo-fencing for test
            created_at: new Date(),
            updated_at: new Date()
        };

        await db.collection('employees').doc(employeeId).set(employeeData);
        console.log('✓ Employee created:', employeeId);

        // 2. Check if user already exists
        const existingUser = await db.collection('users')
            .where('email', '==', userEmail)
            .limit(1)
            .get();

        if (!existingUser.empty) {
            console.log('⚠️  User already exists. Updating...');
            const userDoc = existingUser.docs[0];
            await db.collection('users').doc(userDoc.id).update({
                password: hashedPassword,
                employee_id: employeeId,
                updated_at: new Date()
            });
            console.log('✓ User updated with new employee_id');
        } else {
            // Create new user
            const userId = 'user-' + Date.now();
            await db.collection('users').doc(userId).set({
                user_id: userId,
                email: userEmail,
                password: hashedPassword,
                role: 'employee',
                employee_id: employeeId,
                created_at: new Date(),
                last_login: null
            });
            console.log('✓ User created');
        }

        console.log('\n========================================');
        console.log('Employee Test Credentials:');
        console.log('  Email:       ' + userEmail);
        console.log('  Password:    ' + userPassword);
        console.log('  Employee ID: ' + employeeId);
        console.log('  Name:        Jean Dupont');
        console.log('  Department:  Développement');
        console.log('========================================\n');

        console.log('✅ Seed complete! You can now login on the mobile app.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
}

seedEmployee();
