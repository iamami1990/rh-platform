# 🎯 Solution Rapide - Créer l'Utilisateur Admin

## 📧 Votre Email

J'ai vu que vous essayez de vous connecter avec: **`admin@edutunisia.pro`**

## ⚡ Solution en 3 Étapes

### Étape 1: Aller dans Firebase Console

1. Ouvrez: **https://console.firebase.google.com/project/tp22-64555**
2. Cliquez sur **Firestore Database** dans le menu gauche

### Étape 2: Créer la Collection `users`

1. Si première fois, cliquez **Create database** → **Test mode** → **Enable**
2. Cliquez **Start collection**
3. Collection ID: `users`
4. Cliquez **Next**

### Étape 3: Ajouter Votre Utilisateur

**Document ID**: `HF4kLOVxSVWBF-_8K0MUl...` (copiez l'UID de Authentication → Users → admin@edutunisia.pro)

**Fields à ajouter** (cliquez "+ Add field" pour chacun):

| Field | Type | Value |
|-------|------|-------|
| `email` | string | `admin@edutunisia.pro` |
| `password` | string | `$2a$10$abcdefghijklmnopqrstuv` |
| `firstName` | string | `Admin` |
| `lastName` | string | `EduTunisia` |
| `role` | string | `admin` |
| `status` | string | `active` |
| `created_at` | timestamp | [Maintenant] |
| `last_login` | timestamp | null |
| `employee_id` | string | null |

4. Cliquez **Save**

---

## 🔐 Se Connecter

1. Aller sur: **http://localhost:3000/login**
2. Email: `admin@edutunisia.pro`
3. Password: `Admin123!` (ou celui que vous avez défini dans Authentication)
4. Cliquer **Se connecter**

**Vous serez redirigé vers le Dashboard !** 🎉

---

## 🖼️ Capture d'Écran de Référence

Voici à quoi doit ressembler votre configuration Firestore :

![Login Screen](file:///C:/Users/ismai/.gemini/antigravity/brain/56dad69e-7e87-4a47-a157-c080879d5f03/uploaded_image_1766403296474.png)

---

## ⚠️ Important

Le champ `password` peut être n'importe quel hash bcrypt (commençant par `$2a$10$`). Le backend utilise Firebase Authentication pour vérifier le vrai mot de passe, ce champ est juste pour la compatibilité.

---

**Une fois ces 3 étapes terminées, le login fonctionnera immédiatement !**
