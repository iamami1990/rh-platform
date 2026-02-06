# Guide de Contribution - Olympia HR

Bienvenue dans le projet ! Voici comment configurer votre environnement pour travailler en équipe.

## Pré-requis

1.  **Node.js** (v18 ou v20 recommandés)
2.  **MongoDB Community Server** (installé et démarré localement)
3.  **MongoDB Compass** (pour visualiser la base de données)

## Initialisation du Projet

### 1. Cloner le projet
\`\`\`bash
git clone <votre-repo-url>
cd RH
\`\`\`

### 2. Backend (Serveur API)
\`\`\`bash
cd backend
# Copier les variables d'environnement
cp .env.example .env

# Installer les dépendances
npm install

# Créer le dossier d'uploads s'il n'existe pas
mkdir -p public/uploads

# Démarrer le serveur
npm run dev
\`\`\`
Le serveur tourne sur `http://localhost:5000`.

### 3. Web Admin (Interface Admin)
\`\`\`bash
cd web-admin
# Copier les variables d'environnement
cp .env.example .env

# Installer les dépendances
npm install

# Démarrer le site
npm start
\`\`\`
Le site tourne sur `http://localhost:3000`.

### 4. Base de Données
La base de données s'appelle `rh_platform`.
Elle se créera automatiquement au premier démarrage.
Pour créer un premier compte administrateur (si la base est vide), demandez le script de seed ou utilisez Postman sur la route `/api/auth/register` (si ouverte) ou créez-le manuellement en base.

## Règles de Git
- **Ne jamais commiter** les fichiers `.env` (ils contiennent vos secrets locaux).
- **Toujours commiter** `package-lock.json` si possible (pour avoir les mêmes versions de librairies que l'équipe).
- Travailler sur des branches séparées pour chaque fonctionnalité.

## Architecture
- **Backend**: Node.js + Express + Mongoose (MongoDB).
- **Frontend**: React + Material UI.
- **Stockage**: Les fichiers sont stockés localement dans `backend/public/uploads`.
