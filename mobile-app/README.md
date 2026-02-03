# Olympia HR Mobile App

**Version:** 1.0.0 Beta  
**Platform:** iOS & Android (React Native)

---

## 📱 Application Mobile Employé

Application mobile pour les employés permettant :
- ✅ Pointage Check-in/Check-out
- ✅ Consultation bulletin de paie
- ✅ Solde congés
- ✅ Statistiques personnelles
- 🟡 Reconnaissance faciale (à venir)
- 🟡 Demande de congés (à venir)

---

## 🚀 Installation Développement

### Prérequis

**Général:**
- Node.js 18+
- npm 9+
- React Native CLI

**Android:**
- Android Studio
- JDK 11+
- Android SDK (API 30+)
- ANDROID_HOME configuré

**iOS (Mac uniquement):**
- Xcode 14+
- CocoaPods
- iOS Simulator

### Installation

```bash
cd mobile-app

# Installer dépendances
npm install

# iOS uniquement
cd ios
pod install
cd ..
```

### Lancer l'App

**Android:**
```bash
# Démarrer émulateur Android
# Puis:
npx react-native run-android
```

**iOS:**
```bash
npx react-native run-ios
```

**Metro Bundler:**
```bash
npx react-native start
```

---

## 🏗️ Architecture

```
mobile-app/
├── App.js                    # Point d'entrée principal
├── android/                  # Projet Android natif
├── ios/                      # Projet iOS natif
├── package.json              # Dépendances Node
└── app.json                  # Configuration app
```

---

## 🎨 Fonctionnalités Actuelles

### 1. Écran de Connexion
- Interface moderne avec gradient
- Connexion sécurisée (préparé pour API)
- Design responsive

### 2. Dashboard Employé
**Sections:**
- **Pointage:** Boutons Check-in/Check-out
- **Stats du mois:** Jours présents, retards, absences
- **Solde congés:** Disponibles/utilisés
- **Dernière paie:** Consultation rapide
- **Score engagement:** Affichage score IA

### 3. UI/UX
- **Design:** Cards Material avec ombres
- **Couleurs:** Palette cohérente avec web admin
- **Navigation:** SafeAreaView pour notch iPhone
- **Performance:** React Native optimisé

---

## 🔄 Intégration Backend (À faire)

### Configuration API

**Créer `config/api.js`:**
```javascript
import axios from 'axios';

const API_BASE_URL = 'https://api.olympia-hr.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter token
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

### Exemples API Calls

**Login:**
```javascript
import api from './config/api';

const handleLogin = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

**Check-in:**
```javascript
const handleCheckIn = async () => {
  try {
    const response = await api.post('/attendance/check-in', {
      employee_id: user.employee_id,
      location: { lat: 36.8065, lng: 10.1815 },
      device_info: { model: 'iPhone 14', os: 'iOS 16' }
    });
    
    Alert.alert('Succès', 'Check-in enregistré');
  } catch (error) {
    Alert.alert('Erreur', error.response?.data?.message);
  }
};
```

---

## 📸 Reconnaissance Faciale (Phase suivante)

### Dépendances
```bash
npm install react-native-camera
npm install @tensorflow/tfjs
npm install @tensorflow/tfjs-react-native
```

### Implémentation Basique

**Composant Camera:**
```javascript
import { RNCamera } from 'react-native-camera';

const FaceRecognitionScreen = () => {
  const handleFacesDetected = ({ faces }) => {
    if (faces.length > 0) {
      // Capture face
      // Send to backend for verification
    }
  };

  return (
    <RNCamera
      style={styles.camera}
      type={RNCamera.Constants.Type.front}
      onFacesDetected={handleFacesDetected}
      faceDetectionMode={RNCamera.Constants.FaceDetection.Mode.accurate}
    />
  );
};
```

---

## 📦 Build Production

### Android APK

```bash
cd android
./gradlew assembleRelease

# APK: android/app/build/outputs/apk/release/app-release.apk
```

### Android AAB (Google Play)

```bash
cd android
./gradlew bundleRelease

# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS (Xcode)

1. Ouvrir `ios/OlympiaHR.xcworkspace` dans Xcode
2. Product → Archive
3. Distribute App → App Store Connect

---

## 🔧 Configuration

### App Name & Bundle ID

**Android (`android/app/build.gradle`):**
```gradle
defaultConfig {
    applicationId "com.olympiahr.mobile"
    versionCode 1
    versionName "1.0.0"
}
```

**iOS (`ios/OlympiaHR/Info.plist`):**
```xml
<key>CFBundleDisplayName</key>
<string>Olympia HR</string>
<key>CFBundleIdentifier</key>
<string>com.olympiahr.mobile</string>
```

### Permissions

**Android (`android/app/src/main/AndroidManifest.xml`):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**iOS (`ios/OlympiaHR/Info.plist`):**
```xml
<key>NSCameraUsageDescription</key>
<string>Olympia HR a besoin de la caméra pour le pointage facial</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Olympia HR utilise la localisation pour vérifier le pointage</string>
```

---

## 🐛 Dépannage

### Build Failed (Android)

```bash
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
```

### Metro Bundler Errors

```bash
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### iOS Podfile Issues

```bash
cd ios
pod deintegrate
pod install
cd ..
```

---

## 📊 Roadmap Mobile

### v1.1 (Prochaine version)
- [ ] Intégration API backend complète
- [ ] Reconnaissance faciale fonctionnelle
- [ ] Demandes de congés
- [ ] Notifications push
- [ ] Mode offline

### v1.2
- [ ] Dark mode
- [ ] Multilingue (FR/AR/EN)
- [ ] Historique détaillé présence
- [ ] Chat avec RH
- [ ] Biométrie locale (Touch ID/Face ID)

### v2.0
- [ ] Progressive Web App (PWA)
- [ ] Widget iOS/Android
- [ ] Apple Watch companion
- [ ] Réalité augmentée (plan bureau)

---

## 📝 Notes

**État actuel:** Beta fonctionnelle
- UI complète et moderne
- Prêt pour intégration backend
- Structure extensible

**Production:** Tests requis avant déploiement
- Tests unitaires composants
- Tests intégration API
- Tests utilisateurs (UAT)

---

## 🆘 Support

**Problèmes communs:**
- Check logs: `npx react-native log-android` ou `log-ios`
- Metro bundler: Toujours démarrer avec `npx react-native start`
- Permissions: Désinstaller/réinstaller app après modification

**Documentation:**
- [React Native Docs](https://reactnative.dev/)
- [React Native Camera](https://github.com/react-native-camera/react-native-camera)

---

**Développé pour Olympia HR** 📱
