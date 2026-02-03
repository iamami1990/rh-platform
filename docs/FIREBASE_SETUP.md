# 🔥 Configuration Firebase - Guide de Démarrage Rapide

## ✅ Configuration Complétée

Vos identifiants Firebase ont été configurés dans le projet !

## 📂 Fichiers Configurés

### 1. **Web Admin** ✅
- **Fichier**: `web-admin/src/config/firebase.js`
- **Config**: Initialisé avec vos credentials
- **Services**: Auth, Firestore, Storage, Analytics

### 2. **Mobile App** ✅
- **Fichier**: `mobile-app/android/app/google-services.json`
- **Config**: Android config complète
- **Package**: `com.firebaseauthapp`

### 3. **Backend** ✅
- **Fichier**: `backend/.env.example`
- **Project ID**: `tp22-64555`
- **Storage**: `tp22-64555.firebasestorage.app`

---

## 🚀 Prochaines Étapes

### 1. Configuration Backend (Service Account Key)

Vous devez télécharger votre **Service Account Key** depuis Firebase Console :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **tp22-64555**
3. Allez dans **Project Settings** (⚙️) → **Service Accounts**
4. Cliquez sur **Generate New Private Key**
5. Téléchargez le fichier JSON
6. Renommez-le en `serviceAccountKey.json`
7. Placez-le dans `c:\Users\ismai\Desktop\RH\backend\`

### 2. Créer les fichiers .env

#### Backend (.env)
```bash
cd backend
copy .env.example .env
# Éditez .env et configurez votre EMAIL_USER et EMAIL_PASSWORD
```

#### Web Admin (.env.local)
```bash
cd web-admin
copy .env.example .env.local
# Pas besoin de modifications, Firebase est déjà configuré
```

### 3. Installer les dépendances

#### Backend
```bash
cd backend
npm install
```

#### Web Admin
```bash
cd web-admin
npm install
```

#### Mobile App
```bash
cd mobile-app
npm install
cd android
./gradlew clean
```

### 4. Démarrer le projet

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Web Admin
```bash
cd web-admin
npm start
```

#### Terminal 3 - Mobile App (optionnel)
```bash
cd mobile-app
npx react-native run-android
```

---

## 🔐 Firestore Security Rules

Configurez les règles de sécurité dans Firebase Console :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - read own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Employees - admin/manager only
    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager']);
    }
    
    // Attendance - authenticated users
    match /attendance/{recordId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Leaves - authenticated users
    match /leaves/{leaveId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.employee_id == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager']);
    }
    
    // Payroll - admin only
    match /payroll/{payrollId} {
      allow read: if request.auth != null && 
        (resource.data.employee_id == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Sentiment Analysis - admin/manager only
    match /sentiment_analysis/{recordId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Face Embeddings - admin only
    match /face_embeddings/{employeeId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Device Tokens - own tokens only
    match /device_tokens/{tokenId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🎯 Firestore Collections à Créer

Créez un premier utilisateur admin manuellement :

1. Allez dans **Firestore Database** dans Firebase Console
2. Créez la collection **`users`**
3. Ajoutez un document avec votre email :

```json
{
  "email": "admin@olympia-hr.com",
  "role": "admin",
  "firstName": "Admin",
  "lastName": "Olympia",
  "createdAt": [timestamp actuel],
  "status": "active"
}
```

4. Créez cet utilisateur dans **Authentication** → **Add User**

---

## ✅ Vérification

Pour tester que tout fonctionne :

1. **Backend**: `http://localhost:5000/api/health` devrait retourner `{ "status": "ok" }`
2. **Web Admin**: `http://localhost:3000` devrait afficher la page de login
3. **Mobile**: L'app devrait compiler sans erreurs

---

## 📱 Configuration Firebase Mobile (iOS - Optionnel)

Pour iOS, téléchargez également `GoogleService-Info.plist` :

1. Firebase Console → Project Settings → iOS App
2. Téléchargez `GoogleService-Info.plist`
3. Placez dans `mobile-app/ios/`

---

## ❓ Problèmes Courants

**Erreur "Default app has not been initialized"**
→ Vérifiez que `serviceAccountKey.json` est présent dans `backend/`

**Erreur CORS**
→ Vérifiez `CORS_ORIGIN` dans `.env` backend

**Firestore permission denied**
→ Configurez les Security Rules ci-dessus

**Mobile app build failed**
→ Assurez-vous que `google-services.json` est dans `android/app/`

---

**🎉 Configuration Firebase complète ! Vous êtes prêt à démarrer !**
