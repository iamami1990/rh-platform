# 🚢 GUIDE DÉPLOIEMENT PRODUCTION

Guide complet pour déployer la plateforme RH Olympia en production.

---

## 📋 Pré-Déploiement Checklist

### ✅ Sécurité
- [ ] Changer `JWT_SECRET` (32+ caractères aléatoires)
- [ ] Activer HTTPS uniquement
- [ ] Configurer CORS avec domaines production
- [ ] Activer rate limiting strict
- [ ] Configurer Firebase rules production
- [ ] Activer audit logs complets

### ✅ Configuration
- [ ] Variables `.env` production validées
- [ ] SMTP credentials production configurés
- [ ] Firebase project production créé
- [ ] ML service déployé séparément
- [ ] Backup automatique activé

### ✅ Tests
- [ ] Tests unitaires passent (backend)
- [ ] Tests intégration OK
- [ ] Tests charge effectués
- [ ] Tests sécurité OWASP

---

## 🌍 Options Déploiement

### Option 1: Heroku (Recommandé - Facile)

#### Backend
```bash
cd backend
heroku login
heroku create olympia-hr-api
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=votre-secret-32-chars
# Ajouter toutes variables .env
git push heroku main
```

#### Web Admin
```bash
cd web-admin
# Build production
npm run build

# Déployer sur Netlify/Vercel
netlify deploy --prod --dir=build
# OU
vercel --prod
```

---

### Option 2: Google Cloud Platform

#### Backend (Cloud Run)
```bash
# Dockerfile backend
gcloud builds submit --tag gcr.io/PROJECT-ID/olympia-hr-api
gcloud run deploy olympia-hr-api \
  --image gcr.io/PROJECT-ID/olympia-hr-api \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated
```

#### ML Service (Cloud Run)
```bash
cd ml-service
gcloud builds submit --tag gcr.io/PROJECT-ID/olympia-ml
gcloud run deploy olympia-ml \
  --image gcr.io/PROJECT-ID/olympia-ml \
  --platform managed
```

---

### Option 3: AWS (Avancé)

#### Backend (Elastic Beanstalk)
```bash
eb init olympia-hr-api --platform node.js
eb create production-env
eb deploy
```

#### ML Service (Lambda + API Gateway)
Utiliser Serverless Framework ou SAM

---

## 🔧 Configuration Production

### Backend `.env` Production
```env
NODE_ENV=production
PORT=5000

# JWT
JWT_SECRET=GENERER-SECRET-ALEATOIRE-32-CHARS-MINIMUM
JWT_EXPIRE=24h

# Firebase
FIREBASE_PROJECT_ID=olympia-hr-prod
FIREBASE_STORAGE_BUCKET=olympia-hr-prod.appspot.com

# SMTP (SendGrid recommandé en prod)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx

# ML Service
ML_SERVICE_URL=https://ml-service-url.com

# CORS (domaines production uniquement)
CORS_ORIGIN=https://admin.olympia-hr.tn,https://app.olympia-hr.tn

# Rate Limiting (strict en prod)
RATE_LIMIT_MAX_REQUESTS=50
```

### Web Admin
Créer `.env.production`:
```env
REACT_APP_API_URL=https://api.olympia-hr.tn
REACT_APP_ENV=production
```

---

## 🛡️ Sécurité Production

### 1. HTTPS Obligatoire
```javascript
// backend/server.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}
```

### 2. Headers Sécurité
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. Firebase Rules
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null && auth.token.role == 'admin'"
  }
}
```

---

## 📊 Monitoring

### Logs
- **Backend:** Winston + Loggly/Papertrail
- **Erreurs:** Sentry
- **Performance:** New Relic/Datadog

### Alertes
- CPU > 80%
- Mémoire > 85%
- Erreurs > 10/min
- Temps réponse > 2s

---

## 💾 Backup

### Firestore Backup Automatique
```bash
# GCP Cloud Scheduler
gcloud firestore export gs://olympia-hr-backups/$(date +%Y%m%d)
```

### Fréquence
- Backup quotidien (nuit)
- Rétention 30 jours
- Tests restauration mensuel

---

## 🚀 Script Déploiement Complet

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement Olympia HR Production"

# 1. Tests
echo "📝 Exécution tests..."
cd backend && npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests échoués"
  exit 1
fi

# 2. Build frontend
echo "🏗️ Build frontend..."
cd ../web-admin
npm run build

# 3. Deploy backend
echo "🔧 Déploiement backend..."
cd ../backend
git push heroku main

# 4. Deploy frontend
echo "💻 Déploiement frontend..."
cd ../web-admin
netlify deploy --prod --dir=build

# 5. Deploy ML service
echo "🤖 Déploiement ML..."
cd ../ml-service
gcloud run deploy olympia-ml --image gcr.io/PROJECT/olympia-ml

echo "✅ Déploiement terminé!"
echo "🌐 API: https://api.olympia-hr.tn"
echo "🌐 Web: https://admin.olympia-hr.tn"
```

---

## 📱 Mobile App

### Build Production
```bash
cd mobile-app
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Publication
- **Android:** Google Play Console
- **iOS:** Apple App Store Connect

---

## ✅ Post-Déploiement

1. ✅ Vérifier health check: `https://api.olympia-hr.tn/api/health`
2. ✅ Tester login admin
3. ✅ Vérifier Swagger: `https://api.olympia-hr.tn/api-docs`
4. ✅ Tester création employé
5. ✅ Vérifier emails SMTP
6. ✅ Tester génération paie
7. ✅ Monitoring actif

---

## 🆘 Rollback

```bash
# Heroku
heroku releases
heroku rollback v123

# GCP Cloud Run
gcloud run services update-traffic olympia-hr-api \
  --to-revisions=olympia-hr-api-00123-abc=100
```

---

## 📞 Support Production

**Monitoring:** https://status.olympia-hr.tn  
**Logs:** Dashboard admin  
**Alertes:** Email + SMS

**Contact Urgence:** +216 XX XXX XXX

---

**Dernière mise à jour:** 30 Décembre 2025  
**Version:** 1.0.0
