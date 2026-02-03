# 🚀 DÉMARRAGE RAPIDE - PLATEFORME RH OLYMPIA

Ce guide vous permet de démarrer la plateforme en **5 minutes**.

---

## ⚡ Installation Express (3 commandes)

### 1️⃣ Backend (Terminal 1)
```bash
cd backend
npm install
cp .env.example .env
# ⚠️ IMPORTANT: Éditer .env avec vos credentials Firebase
npm run dev
```
✅ **API disponible:** http://localhost:5000  
✅ **Swagger Docs:** http://localhost:5000/api-docs

### 2️⃣ Web Admin (Terminal 2)
```bash
cd web-admin
npm install
npm start
```
✅ **Interface:** http://localhost:3000

### 3️⃣ Service ML (Terminal 3 - Optionnel)
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
✅ **ML API:** http://localhost:5001

---

## ⚙️ Configuration Minimale

### Firebase (Obligatoire)
1. Créer projet sur https://console.firebase.google.com
2. Télécharger clé service (Settings → Service Accounts)
3. Copier dans `backend/serviceAccountKey.json`
4. Dans `.env`:
```env
FIREBASE_PROJECT_ID=votre-project-id
FIREBASE_STORAGE_BUCKET=votre-bucket.firebasestorage.app
```

### Email SMTP (Optionnel mais recommandé)
**Option Gmail (Plus facile):**
1. Activer validation 2 étapes: https://myaccount.google.com/security
2. Générer mot de passe app: https://myaccount.google.com/apppasswords
3. Dans `.env`:
```env
SMTP_USER=votre-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
```

---

## 👤 Compte Admin Par Défaut

Après premier démarrage, créer admin via Swagger:
1. Ouvrir http://localhost:5000/api-docs
2. POST `/api/auth/register`:
```json
{
  "email": "admin@olympia-hr.tn",
  "password": "Admin123!",
  "firstName": "Admin",
  "lastName": "Olympia",
  "role": "admin"
}
```

---

## ✅ Vérification Installation

### Backend OK?
```bash
curl http://localhost:5000/api/health
```
Réponse:
```json
{"status":"OK","message":"Olympia HR API is running"}
```

### Web OK?
Ouvrir http://localhost:3000 → Page login visible

---

## 📚 Prochaines Étapes

1. **Lire:** `GUIDE_UTILISATEUR.md` - Toutes les fonctionnalités
2. **Configurer:** `CONFIG_GUIDE.md` - Configuration avancée
3. **Tester:** Swagger http://localhost:5000/api-docs

---

## 🆘 Problèmes Fréquents

**Erreur "Firebase not initialized":**
→ Vérifier `serviceAccountKey.json` et variables `.env`

**Erreur port 5000 déjà utilisé:**
→ Changer PORT dans `.env`

**Email ne fonctionne pas:**
→ Normal si SMTP non configuré. Voir CONFIG_GUIDE.md

---

**⏱️ Temps total:** 5 minutes  
**🎯 Résultat:** Plateforme opérationnelle
