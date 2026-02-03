# Guide de Configuration - Olympia HR Platform

**Version:** 1.0.0  
**Dernière mise à jour:** 22 décembre 2025

---

## 🚀 Guide Rapide de Démarrage

### Prérequis

**Outils requis:**
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 9+ (inclus avec Node.js)
- Git ([git-scm.com](https://git-scm.com))
- Compte Firebase ([firebase.google.com](https://firebase.google.com))
- Éditeur de code (VS Code recommandé)

**Pour mobile (optionnel):**
- React Native CLI
- Android Studio / Xcode
- Java JDK 11+

---

## 📦 Installation Backend

### 1. Configuration Firebase

1. **Créer un projet Firebase:**
   - Aller sur [console.firebase.google.com](https://console.firebase.google.com)
   - Cliquer sur "Ajouter un projet"
   - Nom: `olympia-hr-platform`
   - Activer Google Analytics (optionnel)

2. **Activer Firestore:**
   - Dans le menu, aller à "Firestore Database"
   - Cliquer "Créer une base de données"
   - Mode: Production
   - Région: `europe-west` (ou proche)

3. **Activer Storage:**
   - Menu "Storage"
   - Cliquer "Commencer"
   - Mode: Production

4. **Générer clé Service Account:**
   - Menu "Paramètres du projet" (⚙️)
   - Onglet "Comptes de service"
   - Cliquer "Générer une nouvelle clé privée"
   - Télécharger le fichier JSON

5. **Activer Authentication:**
   - Menu "Authentication"
   - Onglet "Sign-in method"
   - Activer "Email/Password"

### 2. Configuration Backend

```bash
# Naviguer vers le backend
cd c:\Users\ismai\Desktop\RH\backend

# Installer les dépendances
npm install

# Copier le template .env
copy ..\.env.example .env

# Éditez le fichier .env avec vos credentials Firebase
notepad .env
```

**Configuration .env:**
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=olympia-hr-platform
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@olympia-hr-platform.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=olympia-hr-platform.appspot.com

# JWT Configuration
JWT_SECRET=votre-secret-tres-complexe-ici-minimum-32-caracteres
JWT_EXPIRATION=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password

# Company Info
COMPANY_NAME=Olympia HR
```

**⚠️ Important pour FIREBASE_PRIVATE_KEY:**
- Remplacer les `\n` par de vrais retours à la ligne, OU
- Garder comme string et remplacer `\\n` par `\n` dans le code

### 3. Démarrer le Backend

```bash
# Mode développement (avec hot reload)
npm run dev

# Mode production
npm start
```

**Vérification:** Ouvrir [http://localhost:5000/api/health](http://localhost:5000/api/health)

Réponse attendue:
```json
{
  "status": "OK",
  "message": "Olympia HR API is running",
  "timestamp": "2025-12-22T10:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 🎨 Installation Web Admin

### 1. Configuration

```bash
# Naviguer vers web-admin
cd c:\Users\ismai\Desktop\RH\web-admin

# Installer les dépendances
npm install

# Créer fichier .env.local
echo REACT_APP_API_URL=http://localhost:5000/api > .env.local
```

### 2. Configuration Firebase (Web)

1. Dans Firebase Console:
   - Paramètres projet → Onglet "Général"
   - Descendre à "Vos applications"
   - Cliquer sur l'icône Web `</>`
   - Nom: `olympia-web-admin`
   - Copier la configuration

2. Ajouter à `.env.local`:
```env
REACT_APP_API_URL=http://localhost:5000/api

REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=olympia-hr-platform.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=olympia-hr-platform
REACT_APP_FIREBASE_STORAGE_BUCKET=olympia-hr-platform.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
```

### 3. Démarrer Web Admin

```bash
npm start
```

L'application s'ouvre automatiquement sur [http://localhost:3000](http://localhost:3000)

**Connexion test:**
- Créer un utilisateur admin via API (voir section suivante)

---

## 📱 Installation Mobile App

### 1. Prérequis Mobile

**Android:**
```bash
# Installer Android Studio
# Configurer ANDROID_HOME dans les variables d'environnement
```

**iOS (Mac uniquement):**
```bash
brew install cocoapods
```

### 2. Configuration

```bash
cd c:\Users\ismai\Desktop\RH\mobile-app

# Installer dépendances
npm install

# Android uniquement
cd android
./gradlew clean
cd ..

# iOS uniquement (Mac)
cd ios
pod install
cd ..
```

### 3. Démarrer Mobile App

**Android:**
```bash
npx react-native run-android
```

**iOS (Mac):**
```bash
npx react-native run-ios
```

---

## 👤 Créer le Premier Admin

### Option 1: Via API (Postman/cURL)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@olympia.com",
    "password": "Admin123!",
    "role": "admin",
    "employee_id": ""
  }'
```

**⚠️ Note:** La première inscription doit être faite manuellement pour sécurité.

### Option 2: Via Firestore Console

1. Aller dans Firestore Console
2. Collection `users` → Ajouter un document
3. Données:
```json
{
  "email": "admin@olympia.com",
  "password": "$2a$10$hashedpassword", // Générer avec bcrypt
  "role": "admin",
  "created_at": "2025-12-22T10:00:00.000Z",
  "last_login": null
}
```

### Connexion Web Admin

1. Ouvrir [http://localhost:3000/login](http://localhost:3000/login)
2. Email: `admin@olympia.com`
3. Mot de passe: `Admin123!`

---

## 🔧 Scripts Utiles

### Backend

```bash
# Développement avec hot reload
npm run dev

# Production
npm start

# Tests (à implémenter)
npm test
```

### Web Admin

```bash
# Développement
npm start

# Build production
npm run build

# Tests
npm test
```

### Mobile

```bash
# Démarrer Metro bundler
npx react-native start

# Android
npx react-native run-android

# iOS
npx react-native run-ios

# Logs
npx react-native log-android
npx react-native log-ios
```

---

## 🐛 Dépannage

### Backend ne démarre pas

**Erreur: Firebase credentials invalid**
- Vérifier le fichier JSON Firebase
- Vérifier les variables d'environnement
- S'assurer que les `\n` sont correctement échappés

**Erreur: Port 5000 already in use**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Ou changer le port dans .env
PORT=5001
```

### Web Admin ne se connecte pas

**CORS Error**
- Vérifier `CORS_ORIGIN` dans .env backend
- Doit correspondre à l'URL du frontend

**Network Error**
- Backend doit être démarré
- Vérifier `REACT_APP_API_URL` dans .env.local

### Mobile App

**Android Build Failed**
```bash
cd android
./gradlew clean
cd ..
npm start --reset-cache
```

**Metro Bundler Error**
```bash
npx react-native start --reset-cache
```

---

## 📊 Tests Rapides

### Test Santé API

```bash
curl http://localhost:5000/api/health
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@olympia.com",
    "password": "Admin123!"
  }'
```

Copier le `token` de la réponse pour les requêtes suivantes.

### Test Employés (avec token)

```bash
curl http://localhost:5000/api/employees \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

---

## 🚀 Déploiement Production

### Backend

**Recommandations:**
- Heroku / Railway / Render
- Firebase Cloud Functions
- AWS EC2 / Google Cloud Run

**Variables d'environnement à configurer:**
- `NODE_ENV=production`
- `CORS_ORIGIN=https://votre-domaine.com`
- Toutes les variables Firebase
- JWT_SECRET complexe

### Frontend Web

**Build:**
```bash
npm run build
```

**Hébergement:**
- Firebase Hosting
- Vercel
- Netlify
- AWS S3 + CloudFront

### Mobile

**Android:**
1. Générer keystore
2. Configurer `android/app/build.gradle`
3. Build APK: `./gradlew assembleRelease`
4. Publier sur Google Play Store

**iOS:**
1. Configurer certificats Apple
2. Build dans Xcode
3. Archive et upload sur App Store Connect

---

## 📚 Ressources

- [Documentation API](./API_DOCUMENTATION.md)
- [Schéma Base de Données](./DATABASE_SCHEMA.md)
- [README Principal](../README.md)
- [Résumé Projet](../PROJECT_SUMMARY.md)

---

## 🆘 Support

Pour toute question ou problème:
1. Consulter la documentation
2. Vérifier les logs backend/frontend
3. Vérifier Firestore Console pour les données
4. Vérifier les variables d'environnement

---

**Bonne configuration ! 🎉**
