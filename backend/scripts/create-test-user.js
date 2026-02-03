/**
 * Script pour créer un utilisateur de test dans Firebase
 * Usage: node scripts/create-test-user.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin (utilise les credentials du projet)
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

async function createTestUser() {
    try {
        const email = 'employe@olympia.com';
        const password = 'olympia123';
        const employeeId = 'EMP_TEST_001';

        console.log('🔄 Création de l\'utilisateur de test...');

        // 1. Créer l'utilisateur Firebase Auth
        let userRecord;
        try {
            userRecord = await admin.auth().createUser({
                email: email,
                password: password,
                emailVerified: true,
                displayName: 'Employé Test'
            });
            console.log('✅ Utilisateur Firebase Auth créé:', userRecord.uid);
        } catch (error) {
            if (error.code === 'auth/email-already-exists') {
                console.log('⚠️  Utilisateur existe déjà dans Firebase Auth, récupération...');
                userRecord = await admin.auth().getUserByEmail(email);
            } else {
                throw error;
            }
        }

        // 2. Hash password pour Firestore
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Créer document utilisateur dans Firestore
        await db.collection('users').doc(userRecord.uid).set({
            user_id: userRecord.uid,
            email: email,
            password: hashedPassword,
            role: 'employee',
            employee_id: employeeId,
            created_at: new Date(),
            last_login: null
        });
        console.log('✅ Document utilisateur créé dans Firestore');

        // 4. Créer l'employé correspondant
        await db.collection('employees').doc(employeeId).set({
            employee_id: employeeId,
            first_name: 'Employé',
            last_name: 'Test',
            email: email,
            phone: '+216 12 345 678',
            department: 'Test',
            position: 'Employé Test',
            hire_date: new Date().toISOString().split('T')[0],
            status: 'active',
            created_at: new Date()
        });
        console.log('✅ Employé créé dans Firestore');

        console.log('\n🎉 SUCCÈS! Utilisateur de test créé:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', email);
        console.log('🔑 Mot de passe:', password);
        console.log('👤 Employee ID:', employeeId);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✨ Vous pouvez maintenant vous connecter dans l\'app mobile!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la création:', error.message);
        process.exit(1);
    }
}

createTestUser();
