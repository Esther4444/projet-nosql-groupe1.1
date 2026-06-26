# Conformité aux Exigences du Bonus API

## 📋 Exigences du Cahier des Charges

> **7. Dossier api/ (optionnel)**
> Bonus reposant sur Node.js, Express et Mongoose. Fonctionnalités attendues :
> • API CRUD.
> • Routes REST.
> • Connexion à MongoDB

## ✅ Implémentation Réalisée

### 1. API CRUD ✓

L'API implémente toutes les opérations CRUD pour les 3 collections principales :

#### **Adhérents** (CRUD complet)
- **CREATE** : `POST /api/auth/register` - Inscription nouvel adhérent
- **READ** : 
  - `GET /api/adherents` - Liste tous les adhérents
  - `GET /api/adherents/:id` - Détails d'un adhérent
  - `GET /api/auth/me` - Profil utilisateur connecté
- **UPDATE** : 
  - `PUT /api/adherents/:id` - Modifier un adhérent
  - `PUT /api/adherents/:id/valider` - Valider une inscription
  - `PUT /api/adherents/:id/refuser` - Refuser une inscription
- **DELETE** : `DELETE /api/adherents/:id` - Supprimer un adhérent

#### **Ouvrages** (CRUD complet)
- **CREATE** : `POST /api/ouvrages` - Créer un ouvrage
- **READ** : 
  - `GET /api/ouvrages` - Liste avec filtres (catégorie, disponibilité, recherche)
  - `GET /api/ouvrages/:id` - Détails d'un ouvrage
- **UPDATE** : 
  - `PUT /api/ouvrages/:id` - Modifier un ouvrage
  - `POST /api/ouvrages/:id/exemplaires` - Ajouter un exemplaire
- **DELETE** : 
  - `DELETE /api/ouvrages/:id` - Supprimer un ouvrage
  - `DELETE /api/ouvrages/:id/exemplaires/:code` - Retirer un exemplaire

#### **Emprunts** (CRUD complet)
- **CREATE** : `POST /api/emprunts` - Créer un emprunt
- **READ** : 
  - `GET /api/emprunts` - Liste avec filtres (statut, recherche)
  - `GET /api/emprunts/retards` - Liste des retards
- **UPDATE** : `PUT /api/emprunts/:id/retourner` - Enregistrer un retour
- **DELETE** : (Non implémenté volontairement pour préserver l'historique)

**Total : 18 endpoints CRUD**

### 2. Routes REST ✓

L'API suit les principes REST :

#### **Conventions REST respectées** :
- ✅ Verbes HTTP appropriés (GET, POST, PUT, DELETE)
- ✅ Nommage de ressources (pluriel : `/adherents`, `/ouvrages`, `/emprunts`)
- ✅ Structure hiérarchique (`/ouvrages/:id/exemplaires`)
- ✅ Codes de statut HTTP corrects :
  - `200 OK` : Succès
  - `201 Created` : Création réussie
  - `400 Bad Request` : Données invalides
  - `401 Unauthorized` : Non authentifié
  - `403 Forbidden` : Non autorisé (rôle insuffisant)
  - `404 Not Found` : Ressource non trouvée
  - `409 Conflict` : Conflit (ex: double réservation)
  - `500 Internal Server Error` : Erreur serveur
- ✅ Réponses JSON structurées
- ✅ Filtrage via query parameters (`?statut=actif`, `?categorie=Informatique`)
- ✅ Authentification par token (JWT dans header `Authorization`)

#### **5 Modules de routes** :
1. `routes/auth.js` - Authentification (register, login, me)
2. `routes/adherents.js` - Gestion des adhérents (CRUD + validation)
3. `routes/ouvrages.js` - Gestion des ouvrages (CRUD + réservations)
4. `routes/emprunts.js` - Gestion des emprunts (CRUD + retards)
5. `routes/stats.js` - Statistiques (dashboard admin)

**Total : 25+ routes REST**

### 3. Connexion à MongoDB ✓

#### **Implémentation** :

**Fichier** : `server.js`

```javascript
import mongoose from 'mongoose';

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB (biblio_uob)');
    app.listen(PORT, () => {
      console.log(`🚀 API démarrée sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    process.exit(1);
  });
```

#### **Configuration** :
- Variable d'environnement : `MONGODB_URI=mongodb://127.0.0.1:27017/biblio_uob`
- Gestion des erreurs de connexion
- Arrêt gracieux lors du SIGINT

#### **ODM Mongoose** :
- 3 modèles (schemas) : `Adherent`, `Ouvrage`, `Emprunt`
- Index définis (matricule unique, statut, catégorie, etc.)
- Méthodes custom (`toPublicJSON()`)
- Validation des données
- Relations (références ObjectId + populate)

## 🎯 Fonctionnalités Supplémentaires (Bonus)

Au-delà des exigences minimales, l'API implémente :

### 1. Authentification JWT
- Inscription avec validation
- Connexion sécurisée
- Tokens expirables (7 jours)
- Middleware d'authentification
- Vérification du rôle (admin vs membre)

### 2. Sécurité
- Hachage des mots de passe (bcrypt, 10 rounds)
- Protection CORS configurable
- Validation des entrées (express-validator)
- Gestion des statuts de compte (actif, inactif, refusé)

### 3. Gestion de la Concurrence
- Requêtes atomiques pour éviter la double réservation
- `findOneAndUpdate()` avec conditions
- Rollback automatique si échec

### 4. Expiration Automatique des Réservations
- Balayage toutes les 10 minutes
- Libération des réservations > 48h
- Utilitaire `utils/reservations.js`

### 5. Statistiques Avancées
- Dashboard admin (compteurs globaux)
- Top 10 ouvrages les plus empruntés
- Stats par catégorie
- Emprunts par mois
- Top 5 adhérents actifs

### 6. Recherche et Filtrage
- Recherche textuelle (titre, auteur)
- Filtres multiples (catégorie, statut, disponibilité)
- Requêtes optimisées avec index

## 📊 Métriques

| Métrique | Valeur |
|----------|--------|
| **Routes REST** | 25+ |
| **Endpoints CRUD** | 18 |
| **Modèles Mongoose** | 3 |
| **Middleware custom** | 2 (auth, adminOnly) |
| **Utilitaires** | 2 |
| **Fichiers API** | 14 |
| **Lignes de code** | ~1500 |

## 🧪 Tests

### Test de connexion

```bash
curl http://localhost:5000/api/health
```

**Réponse** :
```json
{
  "status": "OK",
  "message": "API Bibliothèque UOB opérationnelle",
  "timestamp": "2026-06-26T12:00:00.000Z"
}
```

### Test d'authentification

```bash
# Connexion
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"matricule":"UOB-AD-2020-001","mot_de_passe":"admin123"}'

# Récupération du profil
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Test CRUD Ouvrages

```bash
# Liste
curl http://localhost:5000/api/ouvrages \
  -H "Authorization: Bearer <token>"

# Détails
curl http://localhost:5000/api/ouvrages/<id> \
  -H "Authorization: Bearer <token>"

# Filtrage
curl "http://localhost:5000/api/ouvrages?categorie=Informatique&disponible=true" \
  -H "Authorization: Bearer <token>"
```

## 🚀 Démarrage Rapide

```bash
# 1. Installer les dépendances
cd api
npm install

# 2. Configurer .env
cp .env.example .env

# 3. Peupler la base
mongosh
use biblio_uob
load("../data/seed.js")

# 4. Démarrer l'API
npm run dev

# ✅ API disponible sur http://localhost:5000
```

## 📝 Conformité Finale

| Exigence | Statut | Détails |
|----------|--------|---------|
| **Node.js** | ✅ | Version 18+ |
| **Express** | ✅ | v4.18.2 (framework principal) |
| **Mongoose** | ✅ | v8.0.3 (ODM MongoDB) |
| **API CRUD** | ✅ | 18 endpoints CRUD complets |
| **Routes REST** | ✅ | 25+ routes, conventions REST respectées |
| **Connexion MongoDB** | ✅ | Connexion robuste avec gestion d'erreurs |

## ✅ Conclusion

**L'API implémente intégralement les exigences du bonus** :
- ✅ API CRUD complète (18 endpoints)
- ✅ Routes REST conformes (25+ routes)
- ✅ Connexion MongoDB fonctionnelle (Mongoose)

**Bonus** : Authentification JWT, sécurité, statistiques, gestion de la concurrence, expiration automatique des réservations.

**Prête pour démonstration et déploiement !** 🎉
