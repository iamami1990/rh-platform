# Development Setup Guide

Step-by-step guide to set up the Olympia HR Platform development environment.

---

## Prerequisites

### Required Software
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Firebase Account** ([Sign up](https://firebase.google.com/))
- **Code Editor** (VS Code recommended)

### Optional
- **Postman** or **Insomnia** (API testing)
- **MongoDB Compass** (if using MongoDB as backup)

---

## Step 1: Clone the Repository

```bash
cd Desktop
git clone <repository-url> RH
cd RH
```

---

## Step 2: Firebase Project Setup

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `olympia-hr-platform`
4. Enable Google Analytics (optional)
5. Create project

### 2.2 Enable Firestore Database
1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **Production mode**
4. Choose location (closest to your users)

### 2.3 Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider

### 2.4 Enable Storage
1. Go to **Storage**
2. Click "Get started"
3. Use default security rules for now

### 2.5 Get Service Account Credentials
1. Go to **Project Settings** (gear icon) → **Service accounts**
2. Click "Generate new private key"
3. Download JSON file
4. **Keep this file secure** - never commit to Git!

### 2.6 Get Web App Credentials
1. Go to **Project Settings** → **General**
2. Scroll to "Your apps"
3. Click **Web app** icon (</>)
4. Register app name: `olympia-hr-web`
5. Copy the config object (apiKey, authDomain, etc.)

---

## Step 3: Backend Setup

### 3.1 Navigate to Backend

```bash
cd backend
```

### 3.2 Install Dependencies

```bash
npm install
```

This installs:
- express (server framework)
- firebase-admin (backend Firebase SDK)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)
- And more...

### 3.3 Configure Environment Variables

Create `.env` file in `backend/` directory:

```bash
cp ../.env.example .env
```

Edit `.env` with your Firebase credentials:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=your-client-cert-url

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=24h

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3.4 Start Backend Server

```bash
npm run dev
```

Expected output:
```
🚀 Olympia HR API running on port 5000
📊 Environment: development
🔗 Health check: http://localhost:5000/api/health
```

### 3.5 Test API Health

Open browser or use curl:

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "OK",
  "message": "Olympia HR API is running",
  "timestamp": "2025-12-22T10:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Step 4: Web Admin Setup (Phase 2)

### 4.1 Navigate to Web Admin

```bash
cd ../web-admin
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Configure Environment

Create `.env.local` in `web-admin/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 4.4 Start Web App

```bash
npm start
```

Runs on: `http://localhost:3000`

---

## Step 5: Mobile App Setup (Phase 4)

### 5.1 Navigate to Mobile App

```bash
cd ../mobile-app
```

### 5.2 Install Dependencies

```bash
npm install
```

### 5.3 Setup React Native Environment

#### For Android:
- Install Android Studio
- Setup Android SDK
- Create virtual device (AVD)

#### For iOS (macOS only):
- Install Xcode
- Install CocoaPods: `sudo gem install cocoapods`
- Run: `cd ios && pod install`

### 5.4 Run Mobile App

**Android:**
```bash
npx react-native run-android
```

**iOS:**
```bash
npx react-native run-ios
```

---

## Step 6: Create First Admin User

Use Postman or curl to create first admin:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@olympia-hr.com",
    "password": "Admin@123456",
    "role": "admin"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "user_id": "abc-123-def",
    "email": "admin@olympia-hr.com",
    "role": "admin"
  }
}
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@olympia-hr.com",
    "password": "Admin@123456"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Save this token** - you'll need it for authenticated requests!

---

## Step 7: Test API Endpoints

### Set Token Header

All protected endpoints need:
```
Authorization: Bearer <your-token-here>
```

### Create Employee

```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "firstName": "Ahmed",
    "lastName": "Ben Ali",
    "email": "ahmed@olympia-hr.com",
    "phone": "+216 98 123 456",
    "department": "IT",
    "position": "Developer",
    "hireDate": "2024-01-15",
    "salary_brut": 2500,
    "contract_type": "CDI"
  }'
```

---

## Step 8: Firestore Security Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy security rules from `docs/DATABASE_SCHEMA.md`
3. Paste and **Publish**

---

## Common Issues & Troubleshooting

### Issue: "Firebase Admin SDK Error"
**Solution:** Check `.env` file - ensure FIREBASE_PRIVATE_KEY has correct format with `\n` newlines

### Issue: "Port 5000 already in use"
**Solution:** 
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Change PORT in .env
PORT=5001
```

### Issue: "CORS Error"
**Solution:** Add your web app URL to `CORS_ORIGIN` in `.env`:
```
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
```

### Issue: "Module not found"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

### Daily Workflow
1. Start backend: `cd backend && npm run dev`
2. Start web app: `cd web-admin && npm start`
3. Start mobile (optional): `cd mobile-app && npx react-native start`

### Before Committing
1. Run tests: `npm test`
2. Check linting: `npm run lint`
3. Review changes: `git diff`

---

## Useful Commands

### Backend
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production
npm test         # Run tests
npm run lint     # Check code quality
```

### Web Admin
```bash
npm start        # Development server
npm build        # Production build
npm test         # Run tests
```

### Mobile App
```bash
npm start        # Metro bundler
npm run android  # Run on Android
npm run ios      # Run on iOS
```

---

## Next Steps

1. ✅ Complete Phase 1 setup
2. 📝 Read [API Documentation](./API_DOCUMENTATION.md)
3. 📚 Review [Database Schema](./DATABASE_SCHEMA.md)
4. 🚀 Start Phase 2: Frontend Development

---

## Support & Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Express.js:** https://expressjs.com/
- **React:** https://react.dev/
- **React Native:** https://reactnative.dev/

---

**Last Updated:** December 2025  
**Version:** 1.0
