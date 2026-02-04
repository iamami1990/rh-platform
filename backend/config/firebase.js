const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK
// Try to use service account file, fallback to mock mode for development
let credential;
let useMockMode = false;

try {
    // Try to load service account key file (production)
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
    console.log('✓ Firebase initialized with service account key file');
} catch (error) {
    // Fallback to development mode without service account
    console.log('⚠️  Service account key not found, using MOCK development mode');
    console.log('   For full functionality, download serviceAccountKey.json from Firebase Console');
    useMockMode = true;
}

// Only initialize Firebase if we have valid credentials
if (!useMockMode) {
    admin.initializeApp({
        credential: credential,
        projectId: process.env.FIREBASE_PROJECT_ID || 'tp22-64555',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'tp22-64555.firebasestorage.app'
    });
    console.log('✓ Firebase Admin SDK initialized');
    console.log('  Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('  Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET);
} else {
    console.log('✓ Running in MOCK mode - Firebase operations will be simulated');
}

// Create real or mock Firebase services
const db = useMockMode ? createMockFirestore() : admin.firestore();
const auth = useMockMode ? createMockAuth() : admin.auth();
const storage = useMockMode ? createMockStorage() : admin.storage();
const bucket = useMockMode ? createMockBucket() : storage.bucket();

// Mock Firestore for development
function createMockFirestore() {
    // Pre-seed mock data with a test admin user
    // Password: admin123 (bcrypt hash)
    const mockData = {
        'users/admin_user_001': {
            user_id: 'admin_user_001',
            email: 'admin@olympia.hr',
            // Hash for 'admin123'
            password: '$2a$10$ea2LcSxnZYC4Lho4rDsSSeqkyJUWJvYrRZuN4Qcq09OI4NIe62X.O',
            role: 'admin',
            employee_id: null,
            created_at: new Date(),
            last_login: null
        },
        'users/manager_user_001': {
            user_id: 'manager_user_001',
            email: 'manager@olympia.hr',
            // Hash for 'admin123'
            password: '$2a$10$ea2LcSxnZYC4Lho4rDsSSeqkyJUWJvYrRZuN4Qcq09OI4NIe62X.O',
            role: 'manager',
            employee_id: 'emp_001',
            created_at: new Date(),
            last_login: null
        },
        'employees/emp_001': {
            employee_id: 'emp_001',
            firstName: 'Test',
            lastName: 'Manager',
            email: 'manager@olympia.hr',
            department: 'RH',
            position: 'Manager RH',
            status: 'active',
            hireDate: '2020-01-15',
            salary_brut: 5000,
            contract_type: 'CDI'
        }
    };
    console.log('✓ Mock database seeded with test users:');
    console.log('  - admin@olympia.hr / admin123 (Admin)');
    console.log('  - manager@olympia.hr / admin123 (Manager)');

    const createDocRef = (collectionPath, docId) => ({
        id: docId,
        get: async () => ({
            exists: !!mockData[`${collectionPath}/${docId}`],
            id: docId,
            data: () => mockData[`${collectionPath}/${docId}`] || null
        }),
        set: async (data, options) => {
            mockData[`${collectionPath}/${docId}`] = { ...mockData[`${collectionPath}/${docId}`], ...data };
            return { writeTime: new Date() };
        },
        update: async (data) => {
            mockData[`${collectionPath}/${docId}`] = { ...mockData[`${collectionPath}/${docId}`], ...data };
            return { writeTime: new Date() };
        },
        delete: async () => {
            delete mockData[`${collectionPath}/${docId}`];
            return { writeTime: new Date() };
        }
    });

    const createCollectionRef = (collectionPath, filters = []) => {
        const applyFilters = (docs) => {
            let result = docs;
            for (const filter of filters) {
                result = result.filter(([key, data]) => {
                    const value = data[filter.field];
                    switch (filter.op) {
                        case '==': return value === filter.value;
                        case '!=': return value !== filter.value;
                        case '>': return value > filter.value;
                        case '<': return value < filter.value;
                        case '>=': return value >= filter.value;
                        case '<=': return value <= filter.value;
                        default: return true;
                    }
                });
            }
            return result;
        };

        return {
            doc: (docId) => createDocRef(collectionPath, docId || `mock_${Date.now()}`),
            add: async (data) => {
                const docId = `mock_${Date.now()}`;
                mockData[`${collectionPath}/${docId}`] = data;
                return createDocRef(collectionPath, docId);
            },
            get: async () => {
                const allDocs = Object.entries(mockData)
                    .filter(([key]) => key.startsWith(collectionPath + '/'));
                const filteredDocs = applyFilters(allDocs);
                return {
                    docs: filteredDocs.map(([key, data]) => ({
                        id: key.split('/').pop(),
                        data: () => data,
                        exists: true
                    })),
                    empty: filteredDocs.length === 0,
                    size: filteredDocs.length
                };
            },
            where: (field, op, value) => createCollectionRef(collectionPath, [...filters, { field, op, value }]),
            orderBy: () => createCollectionRef(collectionPath, filters),
            limit: (n) => createCollectionRef(collectionPath, filters)
        };
    };

    return {
        collection: (name) => createCollectionRef(name),
        settings: () => { },
        batch: () => ({
            set: () => { },
            update: () => { },
            delete: () => { },
            commit: async () => []
        })
    };
}

// Mock Auth for development
function createMockAuth() {
    return {
        createUser: async (props) => ({ uid: `mock_${Date.now()}`, ...props }),
        getUser: async (uid) => ({ uid, email: 'mock@example.com' }),
        getUserByEmail: async (email) => ({ uid: `mock_${Date.now()}`, email }),
        updateUser: async (uid, props) => ({ uid, ...props }),
        deleteUser: async () => { },
        verifyIdToken: async () => ({ uid: 'mock_user', email: 'mock@example.com' }),
        createCustomToken: async (uid) => `mock_token_${uid}`
    };
}

// Mock Storage for development
function createMockStorage() {
    return {
        bucket: () => createMockBucket()
    };
}

// Mock Bucket for development
function createMockBucket() {
    return {
        file: (name) => ({
            save: async () => { },
            download: async () => [Buffer.from('mock file content')],
            delete: async () => { },
            getSignedUrl: async () => ['https://mock-url.example.com/file']
        }),
        upload: async () => [{ name: 'mock-file' }]
    };
}

// Firestore settings (only for real Firebase, not mock)
if (!useMockMode) {
    db.settings({
        timestampsInSnapshots: true,
        ignoreUndefinedProperties: true
    });
}

module.exports = {
    admin,
    db,
    auth,
    storage,
    bucket
};
