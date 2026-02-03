const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK
// Try to use service account file, fallback to environment variables for development
let credential;

try {
    // Try to load service account key file (production)
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
    console.log('✓ Firebase initialized with service account key file');
} catch (error) {
    // Fallback to development mode without service account
    console.log('⚠️  Service account key not found, using development mode');
    console.log('   For full functionality, download serviceAccountKey.json from Firebase Console');

    // Use mock credentials for development
    if (process.env.FIREBASE_PROJECT_ID) {
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: `firebase-adminsdk@${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
            privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_DEVELOPMENT\n-----END PRIVATE KEY-----\n'
        });
        console.log('✓ Using mock credentials for development mode');
    } else {
        console.error('❌ FIREBASE_PROJECT_ID not set in .env file');
        process.exit(1);
    }
}

admin.initializeApp({
    credential: credential,
    projectId: process.env.FIREBASE_PROJECT_ID || 'tp22-64555',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'tp22-64555.firebasestorage.app'
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const bucket = storage.bucket();

// Firestore settings
db.settings({
    timestampsInSnapshots: true,
    ignoreUndefinedProperties: true
});

console.log('✓ Firebase Admin SDK initialized');
console.log('  Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('  Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET);

module.exports = {
    admin,
    db,
    auth,
    storage,
    bucket
};
