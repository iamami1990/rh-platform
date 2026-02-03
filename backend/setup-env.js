// Setup environment variables for backend
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Check if .env exists
if (!fs.existsSync(envPath)) {
    console.log('Creating .env file from .env.example...');

    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✓ .env file created successfully!');
        console.log('Please review and update the .env file if needed.');
    } else {
        console.log('⚠️  .env.example not found, creating new .env file...');

        const envContent = `PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=tp22-64555
FIREBASE_STORAGE_BUCKET=tp22-64555.firebasestorage.app

# JWT Configuration
JWT_SECRET=olympia-hr-super-secret-jwt-key-2024-change-in-production
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@olympia-hr.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=noreply@olympia-hr.com

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
`;

        fs.writeFileSync(envPath, envContent);
        console.log('✓ .env file created with default values!');
    }
} else {
    console.log('✓ .env file already exists.');
}

// Check if service account key exists
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.log('\n⚠️  WARNING: serviceAccountKey.json not found!');
    console.log('Firebase will run in development mode with mock credentials.');
    console.log('For full functionality, download serviceAccountKey.json from Firebase Console.');
    console.log('See FIREBASE_SETUP.md for instructions.\n');
} else {
    console.log('✓ serviceAccountKey.json found.');
}

console.log('\n🚀 Environment setup complete!');
console.log('You can now run: npm run dev');
