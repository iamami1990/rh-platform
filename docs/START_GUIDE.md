# 🚀 Guide de Démarrage - Olympia HR Platform

## ⚡ Démarrage Rapide (3 étapes)

### Étape 1: Ouvrir 2 Terminaux

Ouvrez **2 terminaux** (Command Prompt ou PowerShell) dans le dossier du projet.

### Étape 2: Terminal 1 - Backend

```bash
cd c:\Users\ismai\Desktop\RH\backend
npm install
npm run dev
```

✅ Le backend démarrera sur **http://localhost:5000**

### Étape 3: Terminal 2 - Web Admin

```bash
cd c:\Users\ismai\Desktop\RH\web-admin
npm install
npm start
```

✅ Le frontend s'ouvrira automatiquement sur **http://localhost:3000**

---

## 📝 Première Connexion

### Créer un utilisateur admin dans Firebase

Avant de vous connecter, vous devez créer un utilisateur admin :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez le projet **tp22-64555**
3. Allez dans **Authentication** → **Users** → **Add User**
4. Créez un utilisateur:
   - Email: `admin@olympia-hr.com`
   - Password: `Admin123!`

5. Ensuite dans **Firestore Database** → **Start collection**:
   - Collection ID: `users`
   - Document ID: [utilisez l'UID généré automatiquement]
   - Champs:
     ```json
     {
       "email": "admin@olympia-hr.com",
       "role": "admin",
       "firstName": "Admin",
       "lastName": "Olympia",
       "status": "active",
       "createdAt": [Timestamp - now]
     }
     ```

### Se Connecter

1. Allez sur **http://localhost:3000**
2. Email: `admin@olympia-hr.com`
3. Password: `Admin123!`

---

## 🔍 Vérification

### Backend
- URL: http://localhost:5000
- Test: http://localhost:5000/api/health
- Devrait retourner: `{"status":"ok"}`

### Frontend
- URL: http://localhost:3000
- Page de login visible

---

## 🛑 Arrêter l'Application

Appuyez sur **Ctrl+C** dans chaque terminal pour arrêter les serveurs.

---

## ⚠️ Service Account Key Requis

**IMPORTANT**: Pour que le backend fonctionne complètement, vous devez:

1. Télécharger le Service Account Key depuis Firebase Console
2. Le placer dans `c:\Users\ismai\Desktop\RH\backend\serviceAccountKey.json`

**Comment l'obtenir**:
- Firebase Console → ⚙️ Project Settings → Service Accounts
- "Generate New Private Key" → Télécharger
- Renommer en `serviceAccountKey.json`
- Placer dans le dossier `backend/`

---

## 📱 Mobile App (Optionnel)

```bash
cd c:\Users\ismai\Desktop\RH\mobile-app
npm install
npx react-native run-android
```

---

## 🎯 Fonctionnalités Disponibles

Une fois connecté en tant qu'admin, vous pouvez:

✅ **Dashboard** - Vue d'ensemble KPIs
✅ **Employés** - Gestion CRUD complète
✅ **Présence** - Suivi check-in/check-out
✅ **Congés** - Workflow d'approbation
✅ **Paie** - Génération automatique
✅ **Sentiment IA** - Analyse comportementale
✅ **Analytics** - Prédictions turnover

---

## 🔧 Dépannage

### Port déjà utilisé
```bash
# Tuer le processus sur le port 5000
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F

# Tuer le processus sur le port 3000
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### Erreur "Cannot find module"
```bash
# Réinstaller les dépendances
cd backend
rmdir /s /q node_modules
npm install

cd ..\web-admin
rmdir /s /q node_modules
npm install
```

### Firebase Permission Denied
→ Configurez les Security Rules dans Firebase Console (voir FIREBASE_SETUP.md)

---

**🎉 Bon développement !**
