# Guide de Déploiement - Olympia HR Platform

**Version:** 1.0.0  
**Date:** 22 décembre 2025

---

## 🚀 Déploiement Production

### Prérequis

- Compte Firebase activé
- Domaine personnalisé (optionnel)
- Serveur Node.js ou service cloud
- Certificat SSL/TLS

---

## 📦 Backend API

### Option 1: Heroku

**Étapes:**

1. **Installer Heroku CLI**
```bash
# Windows
choco install heroku-cli

# Mac
brew tap heroku/brew && brew install heroku
```

2. **Créer application Heroku**
```bash
cd backend
heroku login
heroku create olympia-hr-api
```

3. **Configurer variables d'environnement**
```bash
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=olympia-hr-platform
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
heroku config:set FIREBASE_CLIENT_EMAIL=firebase-adminsdk@olympia-hr.iam.gserviceaccount.com
heroku config:set FIREBASE_STORAGE_BUCKET=olympia-hr-platform.appspot.com
heroku config:set JWT_SECRET=votre-secret-production-tres-complexe
heroku config:set JWT_EXPIRATION=24h
heroku config:set CORS_ORIGIN=https://votre-domaine.com
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=votre-email@gmail.com
heroku config:set SMTP_PASS=votre-app-password
```

4. **Déployer**
```bash
git add .
git commit -m "Production deployment"
git push heroku main
```

5. **Vérifier**
```bash
heroku logs --tail
heroku open
```

**URL:** `https://olympia-hr-api.herokuapp.com`

### Option 2: Railway

1. **Créer compte sur [railway.app](https://railway.app)**

2. **Nouveau projet**
   - Connecter GitHub
   - Sélectionner repository
   - Railway détecte automatiquement Node.js

3. **Variables d'environnement**
   - Settings → Variables
   - Ajouter toutes les variables .env

4. **Déploiement automatique**
   - Chaque push sur `main` déclenche un déploiement

### Option 3: Google Cloud Run

1. **Installer gcloud CLI**

2. **Créer Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

3. **Déployer**
```bash
gcloud run deploy olympia-hr-api \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated
```

---

## 🌐 Frontend Web Admin

### Option 1: Firebase Hosting

**Étapes:**

1. **Build production**
```bash
cd web-admin
npm run build
```

2. **Installer Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
```

3. **Initialiser Firebase Hosting**
```bash
firebase init hosting
# Select your Firebase project
# Public directory: build
# Single-page app: Yes
# Automatic builds: No
```

4. **Déployer**
```bash
firebase deploy --only hosting
```

**URL:** `https://olympia-hr-platform.web.app`

**Domaine personnalisé:**
```bash
firebase hosting:channel:deploy production --expires never
# Puis configurer dans Firebase Console
```

### Option 2: Vercel

1. **Installer Vercel CLI**
```bash
npm i -g vercel
```

2. **Déployer**
```bash
cd web-admin
vercel
# Follow prompts
```

3. **Production**
```bash
vercel --prod
```

**Configuration automatique:**
- Push sur `main` → déploiement auto
- Pull requests → preview deployments

### Option 3: Netlify

1. **Créer `netlify.toml`**
```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Déployer via CLI**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**OU** connecter GitHub pour déploiement continu.

---

## 📱 Mobile App

### Android (Google Play Store)

**Préparation:**

1. **Générer keystore**
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore olympia-release-key.keystore -alias olympia-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configurer `android/gradle.properties`**
```properties
OLYMPIA_RELEASE_STORE_FILE=olympia-release-key.keystore
OLYMPIA_RELEASE_KEY_ALIAS=olympia-key-alias
OLYMPIA_RELEASE_STORE_PASSWORD=votre-password
OLYMPIA_RELEASE_KEY_PASSWORD=votre-password
```

3. **Modifier `android/app/build.gradle`**
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file(OLYMPIA_RELEASE_STORE_FILE)
            storePassword OLYMPIA_RELEASE_STORE_PASSWORD
            keyAlias OLYMPIA_RELEASE_KEY_ALIAS
            keyPassword OLYMPIA_RELEASE_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

4. **Build APK/AAB**
```bash
cd android
./gradlew bundleRelease  # Pour AAB (recommandé)
# OU
./gradlew assembleRelease  # Pour APK
```

**Fichier généré:** `android/app/build/outputs/bundle/release/app-release.aab`

5. **Publier sur Google Play Console**
   - Créer application
   - Upload AAB
   - Remplir informations (description, screenshots)
   - Soumettre pour review

### iOS (App Store)

**Prérequis:**
- MacOS
- Apple Developer Account ($99/an)
- Xcode installé

**Étapes:**

1. **Ouvrir dans Xcode**
```bash
cd ios
open OlympiaHR.xcworkspace
```

2. **Configurer Signing**
   - Sélectionner projet
   - Signing & Capabilities
   - Team: Votre compte Apple Developer
   - Bundle ID: `com.olympiahr.app`

3. **Build**
   - Product → Archive
   - Validate App
   - Distribute App
   - Upload to App Store Connect

4. **App Store Connect**
   - Créer nouvelle app
   - Remplir informations
   - Upload screenshots
   - Soumettre pour review

---

## 🔒 Sécurité Production

### Backend

**Variables d'environnement:**
```bash
NODE_ENV=production
JWT_SECRET=generer-secret-complexe-minimum-64-caracteres
CORS_ORIGIN=https://votre-domaine.com
```

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    // Autres règles...
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /employees/{employeeId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.token.role == 'admin';
    }
  }
}
```

### Frontend

**Variables .env.production:**
```env
REACT_APP_API_URL=https://api.olympia-hr.com/api
REACT_APP_FIREBASE_API_KEY=production-api-key
```

**Optimisations:**
- Minification automatique (Create React App)
- Code splitting
- Lazy loading components
- Service Worker (PWA)

---

## 🔄 CI/CD (Déploiement Continu)

### GitHub Actions

**Créer `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run tests
        run: cd backend && npm test
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.14
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "olympia-hr-api"
          heroku_email: "your-email@example.com"
          appdir: "backend"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd web-admin && npm ci
      - name: Build
        run: cd web-admin && npm run build
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: olympia-hr-platform
```

---

## 📊 Monitoring Production

### Backend Monitoring

**Heroku:**
```bash
heroku addons:create papertrail  # Logs
heroku addons:create newrelic    # Performance
```

**Google Cloud:**
- Cloud Logging
- Cloud Monitoring
- Error Reporting

### Frontend Monitoring

**Google Analytics:**
```javascript
// web-admin/src/index.js
import ReactGA from 'react-ga4';
ReactGA.initialize('G-XXXXXXXXXX');
```

**Sentry (Error Tracking):**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxxxx@sentry.io/xxxxx",
  environment: process.env.NODE_ENV,
});
```

---

## 🔧 Maintenance

### Backups Firebase

**Firestore:**
```bash
gcloud firestore export gs://olympia-hr-backups/$(date +%Y%m%d)
```

**Planifier avec Cloud Scheduler:**
- Tous les jours à 2h du matin
- Rétention 30 jours

### Mises à jour

**Backend:**
```bash
npm outdated
npm update
npm audit fix
```

**Frontend:**
```bash
cd web-admin
npm outdated
npm update
```

---

## ✅ Checklist Déploiement

**Avant déploiement:**
- [ ] Tests passent (backend)
- [ ] Build production réussit (frontend)
- [ ] Variables d'environnement configurées
- [ ] Firebase rules configurées
- [ ] Domaine SSL configuré
- [ ] SMTP configuré pour emails
- [ ] Backup automatique activé

**Après déploiement:**
- [ ] Health check API: `/api/health`
- [ ] Test login web admin
- [ ] Test login mobile app
- [ ] Vérifier emails fonctionnent
- [ ] Vérifier upload fichiers
- [ ] Tester génération PDF
- [ ] Vérifier dashboards affichent données

---

## 🆘 Rollback

**Heroku:**
```bash
heroku releases
heroku rollback v123
```

**Firebase Hosting:**
```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

**Vercel/Netlify:**
- Interface web → Deployments → Rollback

---

## 📞 Support Production

**Surveillance:**
- Logs: Vérifier quotidiennement
- Alertes: Configurer pour erreurs critiques
- Uptime: Monitoring 24/7 (UptimeRobot, Pingdom)

**Incidents:**
1. Identifier le problème (logs)
2. Rollback si critique
3. Fix + déploiement
4. Post-mortem

---

**Déploiement réussi ! 🎉**
