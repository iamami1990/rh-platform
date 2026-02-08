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

        const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://127.0.0.1:27017/rh_platform

# JWT Configuration
JWT_SECRET=change-me-in-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Email (SMTP) - Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=test@example.com
SMTP_PASS=password
EMAIL_FROM=noreply@olympia-hr.tn

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

console.log('\n🚀 Environment setup complete!');
console.log('You can now run: npm run dev');
