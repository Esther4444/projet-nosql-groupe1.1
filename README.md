# Système de Gestion d'une Bibliothèque Universitaire — UOB

**Groupe 1** : MALEMBA Esther Lydie · OUSMANE-MOANDA Ali El-Hadj Mahamat · NDONG EYEGHE Georges Frédéric

Application full-stack : **React (Vite)** · **Node.js / Express** · **MongoDB (Mongoose)**

---

## 1. Analyse des besoins

### Besoins fonctionnels
| Réf | Besoin |
|---|---|
| BF1 | Gérer le catalogue : ouvrages et leurs exemplaires physiques |
| BF2 | Inscrire les adhérents (étudiants : prêt 14 j, enseignants : 30 j) |
| BF3 | Enregistrer un emprunt **uniquement si un exemplaire est disponible** |
| BF4 | Enregistrer le retour d'un exemplaire (redevient disponible) |
| BF5 | Réserver un exemplaire disponible ; **interdire la double réservation** |
| BF6 | Suivre la disponibilité en temps réel (statut : disponible / emprunté / réservé) |
| BF7 | Conserver l'historique complet des emprunts |
| BF8 | Afficher le top 10 des ouvrages les plus empruntés (agrégation) |

### Besoins non fonctionnels
- **Concurrence** : deux requêtes simultanées sur le même exemplaire ne doivent jamais réussir toutes les deux → opérations atomiques MongoDB (`findOneAndUpdate` avec précondition dans le filtre), sans verrou applicatif.
- **Performance de lecture** : afficher un ouvrage et sa disponibilité en **une seule requête** (exemplaires embarqués, compteurs dénormalisés).
- **Scalabilité de l'historique** : les emprunts vivent dans leur propre collection (croissance non bornée).

➡️ Le détail des choix **embedding vs referencing**, les schémas et le pipeline d'agrégation sont dans [`docs/modele-donnees.md`](docs/modele-donnees.md) — c'est le livrable « Modèle de données ».

## 2. Architecture

```
biblio-uob/
├── docs/modele-donnees.md     ← livrable : modèle + justifications
├── backend/                   ← API Express + Mongoose
│   ├── server.js
│   └── src/
│       ├── db.js
│       ├── seed.js            ← données de démonstration
│       ├── models/            ← Ouvrage (exemplaires embarqués), Adherent, Emprunt
│       └── routes/            ← ouvrages, adherents, emprunts, stats
├── frontend/                  ← React (Vite), proxy /api → :4000
└── test-concurrence.js        ← démonstration du défi technique
```

### Endpoints principaux
| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/ouvrages?q=` | Catalogue + recherche |
| POST | `/api/ouvrages` | Créer un ouvrage (avec exemplaires) |
| POST | `/api/ouvrages/:id/exemplaires` | Ajouter un exemplaire (`$push` + `$inc`) |
| POST | `/api/ouvrages/:id/exemplaires/:code/reserver` | **Réservation atomique** (défi : anti-double réservation) → 409 si déjà pris |
| POST | `/api/ouvrages/:id/exemplaires/:code/annuler-reservation` | Annulation (seulement par le réservant) |
| GET/POST | `/api/adherents` | Liste / inscription |
| POST | `/api/emprunts` | **Emprunt refusé (409) si aucun exemplaire disponible** (`$set` + `$inc` atomiques) |
| POST | `/api/emprunts/:id/retour` | Retour : statut → disponible, `nbDisponibles +1` |
| GET | `/api/stats/top-ouvrages` | **Agrégation** : top 10 des plus empruntés |

### Authentification (JWT)

Toutes les routes `/api/*` (sauf `/api/auth/*` et `/api/health`) exigent un token `Authorization: Bearer <token>`.

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/login` | Connexion (matricule + mot de passe) |
| POST | `/api/auth/register` | Inscription étudiante (compte inactif en attente) |
| GET | `/api/auth/me` | Profil de l'utilisateur connecté |

**Comptes de démonstration** (après `npm run seed`, mot de passe : `password123`) :

| Matricule | Rôle | Usage |
|---|---|---|
| `ADMIN-001` | Bibliothécaire (admin) | Gestion complète, validation des emprunts |
| `UOB-ET-2024-101` | Étudiante (membre) | Réservations, consultation de ses emprunts |
| `UOB-ET-2024-102` | Étudiant (membre) | Idem |
| `UOB-EN-2019-007` | Enseignant (membre) | Prêt 30 jours |

### Parcours réservation → emprunt

1. **Membre** : réserve un exemplaire disponible depuis le catalogue.
2. **Bibliothécaire (admin)** : valide l'emprunt au comptoir via « Valider l'emprunt » sur l'exemplaire réservé.
3. **Retour** : l'admin enregistre le retour dans l'onglet Emprunts → l'exemplaire redevient disponible.

## 3. Installation et lancement

### Prérequis
- Node.js ≥ 18
- MongoDB local (`mongodb://127.0.0.1:27017`) **ou** un cluster gratuit MongoDB Atlas

### Backend
```bash
cd backend
npm install
cp .env.example .env        # ajuster MONGODB_URI, JWT_SECRET si besoin
npm run seed                # données de démonstration (ouvrages, adhérents, historique)
npm run dev                 # API sur http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxy /api → :4000)
```

## 4. Démonstration des livrables

1. **Modèle de données** → `docs/modele-donnees.md`.
2. **Top 10** → onglet « Statistiques » de l'interface, ou `GET /api/stats/top-ouvrages` (avec token admin).
3. **Statut via `$set` + `$inc`** → routes `emprunts.js` et `ouvrages.js` (chaque changement de statut et son compteur sont mis à jour dans la même opération).
4. **Emprunt refusé sans disponibilité** → emprunter tous les exemplaires d'un ouvrage dans l'interface, puis réessayer : message « Emprunt refusé : aucun exemplaire disponible » (HTTP 409).
5. **Défi : anti-double réservation** → lancer le script de concurrence :

```bash
# backend démarré + seed effectué (le script se connecte en tant qu'admin)
node test-concurrence.js
```

Le script envoie **10 réservations simultanées** sur le même exemplaire : exactement **1 réussit (200)** et **9 échouent (409)**. Idem pour l'emprunt simultané du dernier exemplaire.

## 5. Pourquoi ça marche (résumé du défi technique)

MongoDB garantit l'atomicité **au niveau du document**. Comme les exemplaires sont **embarqués** dans l'ouvrage, la précondition (« cet exemplaire est disponible ») et la mutation (« il devient réservé/emprunté » + compteur) tiennent dans **un seul `findOneAndUpdate`**. Les écritures concurrentes sur un même document sont sérialisées par le moteur : la deuxième requête ne matche plus le filtre et reçoit `null`, que l'API traduit en **409 Conflict**. Pas de verrou applicatif, pas de transaction multi-documents : la modélisation documentaire résout le problème de concurrence.
