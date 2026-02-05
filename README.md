# Olympia HR Intelligent Platform

**Version:** 1.0.0 (Release PFE)
**Status:** ✅ Production Ready | 🛡️ Audited & Cleaned | � MongoDB Unified

Plateforme complète de gestion des ressources humaines unifiée sur une architecture **MERN (MongoDB, Express, React, Node)**.

> "Une phase complète d’audit, de nettoyage et de refactorisation a été réalisée afin d’unifier l’utilisation de MongoDB, supprimer les dépendances obsolètes et garantir la stabilité globale de la plateforme."

---

## 🎯 Objectifs Atteints (PFE)

✅ **Unification Base de Données :** Migration totale vers MongoDB (suppression définitive de Firebase/Firestore).
✅ **Architecture Propre :** Séparation claire Backend (API) / Mobile (Expo) / Web (Admin).
✅ **Sécurité Renforcée :** Authentification JWT unifiée, gestion des rôles, protection des routes.
✅ **Performance :** Optimisation des requêtes Mongoose et suppression du code mort.

---

## 🏗️ Architecture Technique (Validée)

```mermaid
graph TD
    Client_Mobile[Mobile App (React Native)] -->|REST API| API_Gateway
    Client_Web[Web Admin (React)] -->|REST API| API_Gateway
    API_Gateway[Backend API (Express/Node.js)] -->|Mongoose| PROD_DB[(MongoDB Primary)]
    API_Gateway -->|Face Recog| IA_Service[Interne/IA Service]
    API_Gateway -->|Notification| Notif_System[MongoDB Polling]
```

**Stack Unifiée :**
- **Backend:** Node.js, Express, Mongoose (ODM)
- **Base de Données:** MongoDB (Unique source of truth)
- **Frontend Admin:** React.js, Redux, Material-UI
- **Mobile Employé:** React Native, Expo
- **Authentification:** JWT (Stateless)
- **Stockage:** Local Uploads (Filesystem)

---

## 🚀 Instructions de Démarrage (Clean Start)

### 1. Backend (Serveur Central)
```bash
cd backend
npm install
# Vérifier que .env est configuré (MONGODB_URI, JWT_SECRET)
npm run dev
# Le serveur démarre sur le port 5000 et se connecte à MongoDB
```

### 2. Web Admin (Tableau de Bord RH)
```bash
cd web-admin
npm install
npm start
# Accès : http://localhost:3000
```

### 3. Mobile App (Kiosque Employé)
```bash
cd mobile-app
npm install
npx expo start
# Scanner le QR code avec Expo Go
```

---

## 📊 État d'Avancement PFE

| Module | Statut | Validation |
|--------|--------|------------|
| **Backend API** | ✅ Complet | 100% Audit Validé |
| **MongoDB Schema** | ✅ Unifié | 100% Validé |
| **Web Admin** | ✅ Fonctionnel | 100% Connecté API |
| **Mobile App** | ✅ Fonctionnel | 100% Connecté API |
| **Sécurité (JWT)** | ✅ Implémenté | Testé |
| **Nettoyage Code** | ✅ Effectué | Plus de code mort/obsolète |

---

## 🤝 Workflow Git & Contribution

Le projet suit un workflow strict pour garantir la qualité du code PFE :

1. **Branche Principale :** `dev` (Développement stable)
2. **Branche Nettoyage :** `platform-cleanup-mongodb` (Branche actuelle de refonte)
3. **Commits :** Conventionnels et atomiques.

---

## � Contact

**Équipe PFE - Olympia HR**
**Dernière Mise à Jour:** Février 2026
**Version:** 1.0.0-Stable
