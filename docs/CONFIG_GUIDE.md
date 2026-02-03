# GUIDE CONFIGURATION - OLYMPIA HR PLATFORM

## 📧 Configuration Email (SMTP)

### Gmail (Recommandé pour test)

1. **Activer l'accès application tierce:**
   - Aller sur https://myaccount.google.com/security
   - Activer "Validation en deux étapes"
   - Générer "Mot de passe d'application"

2. **Modifier `.env`:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app-16-caracteres
EMAIL_FROM=noreply@olympia-hr.tn
```

### Autres Providers

**SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre-api-key-sendgrid
```

**Mailtrap (Développement uniquement):**
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=votre-username-mailtrap
SMTP_PASS=votre-password-mailtrap
```

---

## 🔥 Configuration Firebase

Déjà configuré dans `backend/serviceAccountKey.json`.

Si vous changez de projet Firebase:
1. Télécharger nouveau clé depuis Firebase Console
2. Remplacer `backend/serviceAccountKey.json`
3. Mettre à jour `.env`:
```bash
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_STORAGE_BUCKET=votre-bucket.appspot.com
```

---

## 🚀 Démarrage Rapide

### Backend
```bash
cd backend
npm install
npm run dev  # Port 5000
```

### Web Admin
```bash
cd web-admin
npm install
npm start    # Port 3000
```

### Mobile App
```bash
cd mobile-app
npm install
npx expo start
```

---

## ✅ Vérification Configuration

### Test Email
```bash
node backend/test-email.js
```

### Test API Backend
```
GET http://localhost:5000/api/health
```

Réponse attendue:
```json
{
  "status": "OK",
  "message": "Olympia HR API is running",
  "version": "1.0.0"
}
```

---

## 🔐 Sécurité Production

1. **Changer JWT_SECRET:**
```bash
JWT_SECRET=generer-un-secret-tres-long-minimum-32-caracteres-aleatoires
```

2. **CORS:**
```bash
CORS_ORIGIN=https://votre-domaine.com,https://app.votre-domaine.com
```

3. **HTTPS:** Obligatoire en production

---

## 📞 Support

En cas de problème:
1. Vérifier logs: `backend/logs/`
2. Tester connexion Firebase
3. Vérifier credentials SMTP

**Variables d'environnement requises:**
- ✅ FIREBASE_PROJECT_ID
- ✅ JWT_SECRET
- ✅ SMTP_HOST
- ✅ SMTP_USER
- ✅ SMTP_PASS
