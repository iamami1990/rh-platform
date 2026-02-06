# Olympia HR Intelligent Platform

**Version:** 1.0.0  
**Status:** ✅ Production Ready (Backend + Frontend) | 🟡 Mobile Beta

Plateforme complète de gestion des ressources humaines avec intelligence artificielle pour la gestion de présence par reconnaissance faciale, analyse comportementale des employés, et automatisation de la paie.

---

## 🎯 Fonctionnalités Principales

### ✅ Gestion des Employés
- CRUD complet avec interface Material-UI
- Recherche et filtrage avancés
- Upload documents/photos
- Archivage soft delete

### ✅ Présence Intelligente
- Check-in/Check-out biométrique
- Détection automatique des retards
- Géolocalisation
- Historique complet

### ✅ Paie Automatisée 💰
- Salaire brut + primes tunisiennes
- Déductions (CNSS, IR progressif)
- Génération PDF bulletins professionnels

### ✅ Analyse IA Sentiment 🤖
- Scoring comportemental 0-100
- Détection employés à risque

---

## 🏗️ Architecture Technique

```
Olympia HR Platform
│
├── Backend API (Node.js + Express + MongoDB)
│   ├── 40+ Endpoints REST
│   ├── JWT Authentication
│   ├── PDF Generation (PDFKit)
│   └── Mongoose Models
│
├── Web Admin (React + Redux + Material-UI)
│   ├── Dashboard avec KPIs réels
│   └── 6 Modules de gestion
│
└── Mobile App (React Native + Expo)
    ├── Check-in biométrique
    └── Dashboard employé
```

**Stack:**
- **Backend:** Node.js, Express, MongoDB
- **Frontend:** React, Material-UI, Redux Toolkit
- **Mobile:** React Native, Expo
- **Database:** MongoDB (Local ou Atlas)

---

## 🚀 Installation & Démarrage (Équipe)

### 1. Prérequis
- Node.js 18+
- MongoDB installé localement (ou URI Atlas)

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Mettre à jour MONGO_URI dans .env
npm run dev
```
**API:** http://localhost:5000

### 3. Création du compte Admin (Premier démarrage)
```bash
cd backend
node setup_admin.js
```

### 4. Web Admin
```bash
cd web-admin
npm install
npm run dev
```
**Interface:** http://localhost:3000

### 5. Mobile App
```bash
cd mobile-app
npm install
npx expo start
```

---

## 🔐 Identifiants de Connexion (Test/Dev)

Utilisez ces identifiants pour vous connecter à tous les services après avoir lancé le script `setup_admin.js` :

| Rôle | Email | Mot de Passe |
|------|-------|--------------|
| **Administrateur** | `admin@test.com` | `password123` |

---

## 📚 Documentation Technique

- **Backend API:** [backend/README.md](./backend/README.md)
- **Mobile Guide:** [mobile-app/DEVELOPMENT_GUIDE.md](./mobile-app/DEVELOPMENT_GUIDE.md)

---

## 🤝 Collaboration (Workflow Git)

1. Toujours travailler sur une branche séparée : `git checkout -b nom-ma-feature`
2. Faire un Push vers GitHub.
3. Créer une Pull Request (PR) pour fusionner vers `main`.

---

## 📄 License
Proprietary - Olympia HR Platform © 2026

