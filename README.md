# Pizza Town - Workspace

Bienvenue dans le dépôt du projet Pizza Town. L'application est divisée en deux parties : un **Frontend** (React + Vite) et un **Backend** (Node.js, Express, Socket.io, Prisma, PostgreSQL).

Ce guide s'adresse aux développeurs souhaitant lancer le projet en local sur leur machine.

## 🛠️ Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre ordinateur :
1. **Node.js** (version 18+ recommandée)
2. **PostgreSQL** (version 14+ recommandée)

## 🚀 Installation & Lancement Rapide

### 1. Installation des dépendances
À la racine du projet, exécutez la commande suivante pour installer toutes les dépendances du frontend et du backend en une seule fois :
```bash
npm run install:all
```

### 2. Variables d'environnement (.env)
Le projet nécessite des variables d'environnement pour fonctionner localement.
1. Allez dans le dossier `frontend` et copiez le fichier d'exemple :
   - Renommez `.env.example` en `.env` (il contient l'URL du backend local).
2. Allez dans le dossier `backend` et copiez le fichier d'exemple :
   - Renommez `.env.example` en `.env`.
   - Modifiez la variable `DATABASE_URL` pour qu'elle corresponde à vos identifiants PostgreSQL (ex: `postgresql://UTILISATEUR:MOTDEPASSE@localhost:5432/pizzatown`).

### 3. Base de données (PostgreSQL)
1. Ouvrez votre terminal PostgreSQL ou pgAdmin et créez une base de données nommée `pizzatown` (ou le nom défini dans votre `DATABASE_URL`).
2. Pour initialiser les tables et le schéma Prisma, naviguez dans le dossier `backend` et exécutez :
```bash
cd backend
npx prisma db push
# Si vous avez un fichier seed, vous pouvez aussi le lancer, ex: npx prisma db seed
cd ..
```

### 4. Démarrer l'application (Mode Développement)

À la racine du projet, vous pouvez démarrer le frontend et le backend. Il est conseillé d'ouvrir deux terminaux :

**Terminal 1 (Backend) :**
```bash
npm run backend
```
*Le serveur démarrera sur `http://localhost:5000`*

**Terminal 2 (Frontend) :**
```bash
npm run frontend
```
*Le site React démarrera sur `http://localhost:5173`*

🎉 **C'est tout !** Ouvrez votre navigateur sur `http://localhost:5173` pour accéder à Pizza Town en développement.
