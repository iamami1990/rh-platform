# 🎯 Guide de Première Connexion - Olympia HR

## ✅ Serveurs Actifs

- **Backend**: http://localhost:5000 ✅
- **Web Admin**: http://localhost:3000 🔄 (compilation en cours...)

## 📋 Étapes pour la Première Connexion

### Étape 1: Attendre la Compilation Web Admin

Le web admin est en cours de compilation. Vous verrez bientôt:
```
Compiled successfully!
You can now view olympia-hr-web-admin in the browser.
```

### Étape 2: Créer un Utilisateur Admin

**Allez sur Firebase Console:**
https://console.firebase.google.com/u/0/project/tp22-64555

#### A. Créer l'utilisateur dans Authentication

1. Cliquez sur **Authentication** dans le menu
2. Cliquez sur **Users**
3. Cliquez sur **Add User**
4. Remplissez:
   - **Email**: `admin@olympia-hr.com`
   - **Password**: `Admin123!`
5. Cliquez sur **Add User**
6. **IMPORTANT**: Copiez l'**UID** qui apparaît (ex: `Kh3Gs7x...`)

#### B. Créer le profil dans Firestore

1. Cliquez sur **Firestore Database** dans le menu
2. Si demandé, créez la base de données en mode **Test**
3. Cliquez sur **Start Collection**
4. Collection ID: `users`
5. Cliquez sur **Next**
6. **Document ID**: Collez l'**UID** copié à l'étape A.6
7. Ajoutez les champs suivants:

| Field | Type | Value |
|-------|------|-------|
| `email` | string | `admin@olympia-hr.com` |
| `role` | string | `admin` |
| `firstName` | string | `Admin` |
| `lastName` | string | `Olympia` |
| `status` | string | `active` |
| `createdAt` | timestamp | [Cliquez sur l'horloge pour NOW] |

8. Cliquez sur **Save**

### Étape 3: Se Connecter

1. Ouvrez http://localhost:3000
2. Vous verrez la page de login
3. Connectez-vous avec:
   - **Email**: `admin@olympia-hr.com`
   - **Password**: `Admin123!`

### Étape 4: Explorer la Plateforme

Une fois connecté, vous accédez au Dashboard avec:

- 📊 **Dashboard** - Vue d'ensemble KPIs
- 👥 **Employés** - Gestion CRUD
- ⏰ **Présence** - Suivi check-in/check-out
- 🏖️ **Congés** - Demandes et approbations
- 💰 **Paie** - Génération bulletins
- 🧠 **Sentiment IA** - Analyse comportementale
- 📈 **Analytics** - Prédictions turnover

---

## 🔐 Configuration Firebase Security Rules (Important!)

Pour que tout fonctionne correctement, configurez les règles de sécurité Firestore:

1. Firebase Console → **Firestore Database** → **Rules**
2. Remplacez le contenu par:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Cliquez sur **Publish**

---

## ❓ Dépannage

### Le web admin ne compile pas
- Vérifiez qu'il n'y a pas d'autres processus sur le port 3000
- Redémarrez le terminal: Ctrl+C puis `npm start`

### Erreur "Cannot connect to backend"
- Vérifiez que le backend tourne sur http://localhost:5000
- Testez: http://localhost:5000/api/health

### Erreur de connexion Firebase
- Vérifiez que l'utilisateur existe dans Authentication
- Vérifiez que le document existe dans Firestore collection `users`
- Vérifiez que l'UID correspond entre Authentication et Firestore

---

**🎉 Bon développement avec Olympia HR !**
