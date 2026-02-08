# RH Platform (Olympia HR)

Plateforme complète de gestion des ressources humaines avec authentification JWT, modules RH, KIOSK partagé et base de données **MongoDB uniquement**.

**The platform was fully audited, refactored and completed to meet professional software engineering standards, ensuring maintainability, scalability and academic validity.**

---

## ✅ Modules

1. Authentification & rôles (Admin, RH, Manager, Employee)
2. Gestion des employés (CRUD, documents)
3. Présence (KIOSK, reconnaissance faciale, retards)
4. Congés (demande + workflow d’approbation)
5. Paie (base version, PDF bulletin)
6. Notifications internes (lu/non lu)
7. Dashboards & analytics

---

## 🏗️ Architecture

```
RH Platform
│
├── backend/       Node.js + Express + MongoDB (Mongoose)
├── web-admin/     React + Redux + MUI
└── mobile-app/    React Native (Expo) + KIOSK mode
```

---

## 🚀 Installation Rapide

### 1) Backend
```bash
cd backend
npm install
cp .env.example .env
# Mettre à jour MONGO_URI, JWT_SECRET, SMTP_*
set ADMIN_EMAIL=admin@olympia-hr.tn
set ADMIN_PASSWORD=ChangeMe123!
npm run seed:admin
npm run dev
```
API: `http://localhost:5000`

### 2) Web Admin
```bash
cd web-admin
npm install
set REACT_APP_API_URL=http://localhost:5000/api
npm run dev
```
UI: `http://localhost:3000`

### 3) Mobile App
```bash
cd mobile-app
npm install
# Modifier mobile-app/app.json:
# extra.API_BASE_URL = "http://<IP>:5000/api"
# extra.KIOSK_MODE = true|false
npx expo start
```

---

## 🧩 KIOSK Mode

Activez `KIOSK_MODE=true` dans `mobile-app/app.json`. Le KIOSK supporte:
- Check-in / Check-out
- Demande de congé
- Bulletin de paie
- PIN fallback si la reconnaissance faciale échoue

---

## 🧪 Migration MongoDB (Offline)

Voir `docs/MIGRATION_GUIDE.md` pour importer `users.json` et `employees.json` via:
```bash
cd backend
npm run import:legacy
```

---

## 📚 Documentation

- `docs/SETUP.md`
- `docs/ARCHITECTURE.md`
- `docs/MIGRATION_GUIDE.md`

---

## ✅ Git Workflow

1. Créer une branche dédiée
2. Push sur GitHub
3. PR vers `dev`

---

## 📄 License
Proprietary - Olympia HR Platform © 2026

