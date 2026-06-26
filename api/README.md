# API Bibliothèque UOB

API REST pour le système de gestion de la bibliothèque de l'Université Omar Bongo.

## 📋 Technologies

- **Runtime** : Node.js 18+
- **Framework** : Express.js 4.18
- **Base de données** : MongoDB 8.0
- **ODM** : Mongoose 8.0
- **Authentification** : JWT (jsonwebtoken)
- **Validation** : express-validator
- **Sécurité** : bcryptjs (hachage mots de passe)

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd api
npm install
```

### 2. Configuration

Créer un fichier `.env` :

```bash
cp .env.example .env
```

Modifier les variables :

```env
MONGODB_URI=mongodb://127.0.0.1:27017/biblio_uob
JWT_SECRET=votre_secret_jwt_unique
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Peupler la base de données

```bash
mongosh
use biblio_uob
load("../data/seed.js")
```

### 4. Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

## 📚 Routes API

### Authentification

#### POST `/api/auth/register`
Inscription d'un nouvel adhérent.

#### POST `/api/auth/login`
Connexion (retourne un token JWT).

#### GET `/api/auth/me`
Profil de l'utilisateur connecté.

### Adhérents (Admin)

#### GET `/api/adherents`
Liste des adhérents.

#### GET `/api/adherents/:id`
Détails d'un adhérent.

#### PUT `/api/adherents/:id/valider`
Valider une inscription.

#### PUT `/api/adherents/:id/refuser`
Refuser une inscription.

#### PUT `/api/adherents/:id`
Modifier un adhérent.

#### DELETE `/api/adherents/:id`
Supprimer un adhérent.

### Ouvrages

#### GET `/api/ouvrages`
Liste des ouvrages (avec filtres).

#### GET `/api/ouvrages/:id`
Détails d'un ouvrage.

#### POST `/api/ouvrages` (Admin)
Créer un ouvrage.

#### PUT `/api/ouvrages/:id` (Admin)
Modifier un ouvrage.

#### DELETE `/api/ouvrages/:id` (Admin)
Supprimer un ouvrage.

#### POST `/api/ouvrages/:id/exemplaires` (Admin)
Ajouter un exemplaire.

#### DELETE `/api/ouvrages/:id/exemplaires/:code` (Admin)
Retirer un exemplaire.

#### POST `/api/ouvrages/:id/reserver`
Réserver un exemplaire.

#### POST `/api/ouvrages/:id/annuler-reservation`
Annuler une réservation.

### Emprunts

#### GET `/api/emprunts`
Liste des emprunts.

#### POST `/api/emprunts` (Admin)
Créer un emprunt.

#### PUT `/api/emprunts/:id/retourner` (Admin)
Enregistrer un retour.

#### GET `/api/emprunts/retards` (Admin)
Liste des retards.

### Statistiques (Admin)

#### GET `/api/stats`
Statistiques générales.

#### GET `/api/stats/top-ouvrages`
Top 10 ouvrages.

#### GET `/api/stats/categories`
Stats par catégorie.

#### GET `/api/stats/emprunts-mois`
Emprunts par mois.

#### GET `/api/stats/top-adherents`
Top 5 adhérents.

## 🔒 Sécurité

- **Mots de passe** : Hachés avec bcrypt
- **JWT** : Expiration 7 jours
- **CORS** : Configurable
- **Validation** : express-validator

## 🗂️ Structure

```
api/
├── server.js
├── package.json
├── .env
└── src/
    ├── models/
    │   ├── Adherent.js
    │   ├── Ouvrage.js
    │   └── Emprunt.js
    ├── routes/
    │   ├── auth.js
    │   ├── adherents.js
    │   ├── ouvrages.js
    │   ├── emprunts.js
    │   └── stats.js
    ├── middleware/
    │   └── auth.js
    └── utils/
        ├── adherent.js
        └── reservations.js
```

## 👥 Auteurs

MALEMBA Esther Lydie, OUSMANE-MOANDA Ali El-Hadj Mahamat, NDONG EYEGHE Georges Frédéric

**Université Omar Bongo** - Projet NoSQL 2025-2026
