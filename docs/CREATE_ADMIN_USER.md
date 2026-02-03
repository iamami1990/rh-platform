# 🔐 Créer votre Premier Utilisateur Admin

## 📸 Votre Login Fonctionne !

![Login Page](file:///C:/Users/ismai/.gemini/antigravity/brain/56dad69e-7e87-4a47-a157-c080879d5f03/uploaded_image_0_1766402601910.png)

La page de login est parfaite ! Maintenant, créons l'utilisateur admin.

---

## 🚀 Étapes pour Créer l'Utilisateur Admin

### Étape 1: Ouvrir Firebase Console

1. Allez sur: **https://console.firebase.google.com**
2. Sélectionnez le projet **tp22-64555**

### Étape 2: Créer l'Utilisateur dans Authentication

1. Dans le menu gauche, cliquez sur **Authentication**
2. Cliquez sur l'onglet **Users**
3. Cliquez sur **Add user** (Ajouter un utilisateur)
4. Remplissez:
   - **Email**: `admin@olympia-hr.com`
   - **Password**: `Admin123!` (ou votre mot de passe préféré)
5. Cliquez sur **Add user**
6. **IMPORTANT**: Notez l'**UID** qui apparaît (exemple: `Kh3Gs7xF8NYb...`)

### Étape 3: Créer le Profil dans Firestore

1. Dans le menu gauche, cliquez sur **Firestore Database**
2. Si c'est la première fois:
   - Cliquez sur **Create database**
   - Choisissez **Start in test mode**
   - Sélectionnez une région (ex: `eur3 (europe-west)`)
   - Cliquez sur **Enable**

3. Créer la collection `users`:
   - Cliquez sur **Start collection**
   - Collection ID: `users`
   - Cliquez sur **Next**

4. Ajouter le premier document admin:
   - **Document ID**: Collez l'**UID** copié à l'étape 2.6
   - Cliquez sur **Add field** pour chaque champ:

| Field | Type | Value |
|-------|------|-------|
| `email` | string | `admin@olympia-hr.com` |
| `firstName` | string | `Admin` |
| `lastName` | string | `Olympia` |
| `role` | string | `admin` |
| `status` | string | `active` |
| `createdAt` | timestamp | [Cliquez sur l'horloge pour choisir NOW] |

5. Cliquez sur **Save**

### Étape 4: Configurer les Security Rules

1. Toujours dans **Firestore Database**, cliquez sur l'onglet **Rules**
2. Remplacez tout le contenu par:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Autoriser lecture/écriture pour les utilisateurs authentifiés
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Cliquez sur **Publish**

---

## ✅ Se Connecter

1. Retournez sur **http://localhost:3000/login**
2. Connectez-vous avec:
   - **Email**: `admin@olympia-hr.com`
   - **Password**: `Admin123!` (ou celui que vous avez choisi)
3. Cliquez sur **Se connecter**

**Vous serez redirigé vers le Dashboard !** 🎉

---

## 📊 Après Connexion

Une fois connecté, vous aurez accès à:

- 📊 **Dashboard** - Vue d'ensemble
- 👥 **Employés** - Gestion complète
- ⏰ **Présence** - Check-in/out
- 🏖️ **Congés** - Workflow
- 💰 **Paie** - Bulletins
- 🧠 **Sentiment IA** - Analytics
- 📈 **Analytics** - Prédictions

---

## ❓ Troubleshooting

**Si "rien ne se passe" au login:**
- Vérifiez la console du navigateur (F12)
- Assurez-vous que le backend tourne sur http://localhost:5000
- Vérifiez que l'utilisateur existe dans Authentication ET Firestore

**Erreur "Invalid credentials":**
- Vérifiez l'email et le mot de passe
- L'utilisateur doit exister dans **Authentication**

**Erreur "User not found":**
- Le profil doit exister dans **Firestore** collection `users`
- L'**UID** doit correspondre entre Authentication et Firestore

---

**🎊 Félicitations ! Votre plateforme HR est 100% opérationnelle !**
