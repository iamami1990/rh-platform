# 👥 Guide de Développement - Olympia HR Mobile

**Guide pour la collaboration en équipe avec GitHub**

---

## 🚀 Installation pour Nouveaux Développeurs

### Prérequis

- Node.js 18+
- npm 9+
- Compte Expo (gratuit) → [expo.dev](https://expo.dev)

### 1️⃣ Cloner le projet

```bash
git clone <votre-repo>
cd RH/mobile-app
npm install
```

### 2️⃣ Installer l'APK de développement

**⚠️ IMPORTANT : N'utilisez PAS Expo Go !**

Cette application utilise des modules natifs (`expo-face-detector`, `expo-camera`) qui ne fonctionnent pas avec Expo Go.

**Téléchargez l'APK de développement :**

**Lien direct APK :** https://expo.dev/artifacts/eas/6zX1UWLpcmevCR53ZAqoxz.apk

1. Ouvrez ce lien sur votre téléphone Android
2. Téléchargez l'APK (~191 MB)
3. Installez-le (autorisez les sources inconnues si demandé)
4. Lancez l'application **Olympia HR**

### 3️⃣ Lancer le serveur de développement

```bash
npm start
# ou
npx expo start
```

### 4️⃣ Connecter votre téléphone

1. Ouvrez l'app **Olympia HR** sur votre téléphone
2. Scannez le QR code affiché dans le terminal
3. **C'est tout !** ✅

---

## 🔄 Workflow de Développement Quotidien

### Développer avec Hot Reload

```bash
# Démarrer le serveur
npm start

# Éditez votre code
# Les modifications apparaissent INSTANTANÉMENT sur le téléphone
# Pas besoin de rebuild ! 🔥
```

### Commandes utiles

```bash
# Démarrer avec cache vide
npx expo start --clear

# Mode tunnel (si problème de réseau)
npx expo start --tunnel

# Voir les logs
# Appuyez sur 'j' dans le terminal
```

---

## 📱 Quand Rebuilder l'APK ?

### ❌ PAS besoin de rebuild pour :

- ✅ Modifications du code JavaScript/TypeScript
- ✅ Changements de style CSS
- ✅ Nouveaux composants React
- ✅ Modifications de logique métier
- ✅ **99% de votre développement quotidien**

### ✅ Rebuild UNIQUEMENT si :

- 🔧 Ajout/suppression d'un module natif
- 🔧 Modification de `app.json` ou `eas.json`
- 🔧 Changement des permissions Android/iOS
- 🔧 Mise à jour Expo SDK

### Comment rebuilder

```bash
# 1. Se connecter à Expo (première fois)
npx eas-cli login

# 2. Lancer le build
npx eas-cli build --profile development --platform android

# 3. Attendre 10-15 minutes
# 4. Télécharger le nouvel APK depuis expo.dev
# 5. Partager le lien avec l'équipe
```

---

## 👥 Collaboration GitHub

### Workflow recommandé

```bash
# 1. Créer une branche
git checkout -b feature/ma-feature

# 2. Développer avec hot reload
npm start

# 3. Tester sur votre téléphone

# 4. Commiter
git add .
git commit -m "feat: description"
git push origin feature/ma-feature

# 5. Créer une Pull Request
```

### Nomenclature des commits

```bash
feat: nouvelle fonctionnalité
fix: correction de bug
refactor: refactoring
style: formatage CSS
docs: documentation
test: tests
chore: maintenance
```

### Avant de Pusher

```bash
# S'assurer que le code fonctionne
npm start

# Si vous avez ajouté des dépendances
npm install

# Vérifier les fichiers modifiés
git status
```

---

## 📂 Fichiers à Committer

### ✅ À committer

- `package.json` et `package-lock.json`
- `app.json` et `eas.json`
- Tout le code source
- `README.md`

### ❌ Ne JAMAIS committer

- `node_modules/`
- `.expo/`
- `dist/`
- `.env` (s'il contient des secrets)

---

## 🔄 Synchroniser avec main

```bash
# 1. Sauvegarder votre travail
git add .
git commit -m "WIP: travail en cours"

# 2. Récupérer les modifications
git checkout main
git pull origin main

# 3. Retourner sur votre branche
git checkout feature/ma-feature

# 4. Merger main dans votre branche
git merge main

# 5. Résoudre les conflits si nécessaire

# 6. Installer les nouvelles dépendances
npm install

# 7. Tester que tout fonctionne
npm start
```

---

## 🐛 Problèmes Courants

### L'app ne se connecte pas au serveur

```bash
# Vérifier que téléphone et PC sont sur le même WiFi
# Ou utiliser le mode tunnel :
npx expo start --tunnel
```

### Erreur "Cannot find native module"

→ Vous utilisez Expo Go au lieu de l'APK de développement  
→ **Solution :** Installez l'APK personnalisé (voir section Installation)

### L'app ne se met pas à jour

```bash
# Dans le terminal, appuyez sur 'r' pour recharger
# Ou secouez votre téléphone → "Reload"

# Si ça ne marche pas :
npx expo start --clear
```

### Problème de dépendances

```bash
# Sur Linux/Mac
rm -rf node_modules package-lock.json
npm install

# Sur Windows
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

## 📦 Structure du Projet

```
mobile-app/
├── App.js              # Point d'entrée
├── app.json            # Config Expo
├── eas.json            # Config builds
├── package.json        # Dépendances
├── assets/             # Images, fonts
├── components/         # Composants
├── screens/            # Écrans
├── navigation/         # Navigation
├── services/           # API
└── utils/              # Utilitaires
```

---

## 🔧 Configuration API

### Créer `services/api.js`

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api'; // Changez selon environnement

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter token automatiquement
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

### Utilisation

```javascript
import api from './services/api';

// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Check-in
const checkIn = async (employeeId) => {
  const response = await api.post('/attendance/check-in', { employeeId });
  return response.data;
};
```

---

## 📸 Modules Natifs Installés

Cette app utilise :

- `expo-camera` : Caméra
- `expo-face-detector` : Détection faciale
- `@react-native-async-storage/async-storage` : Stockage
- `@react-native-community/datetimepicker` : Date picker
- `expo-constants` : Configuration

**C'est pourquoi un development build est nécessaire !**

---

## 🆘 Commandes Utiles

```bash
# Lister les builds
npx eas-cli build:list

# Voir un build spécifique
npx eas-cli build:view [BUILD_ID]

# Se connecter à Expo
npx eas-cli login

# Voir qui est connecté
npx eas-cli whoami

# Vider le cache Metro
npx expo start --clear
```

---

## ⚡ Quick Start (Résumé)

**Pour commencer en 5 étapes :**

1. `git clone <repo>`
2. `npm install`
3. Télécharger APK → https://expo.dev/artifacts/eas/6zX1UWLpcmevCR53ZAqoxz.apk
4. `npm start`
5. Scanner QR code avec l'app

**🚀 C'est parti !**

---

## 📚 Ressources

- [Expo Docs](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native](https://reactnative.dev/)

---

**Questions ?** Contactez l'équipe sur GitHub Issues ou Slack.

*Guide créé le 05/02/2026*
