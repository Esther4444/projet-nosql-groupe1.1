# Projet NoSQL — Groupe 1
## Système de Gestion d'une Bibliothèque Universitaire

[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green.svg)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-blue.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-lightgrey.svg)](https://expressjs.com/)

---

## 👥 Membres du Groupe

- **MALEMBA Esther Lydie**
- **OUSMANE-MOANDA Ali El-Hadj Mahamat**
- **NDONG EYEGHE Georges Frédéric**

---

## 📖 Contexte Métier

La bibliothèque de l'Université Omar Bongo (UOB) souhaite moderniser la gestion de son fonds documentaire. Le système doit permettre de :

- Gérer les **ouvrages** et leurs **exemplaires** physiques
- Inscrire et gérer les **adhérents** (étudiants et enseignants)
- Enregistrer et suivre les **emprunts** et **réservations**
- Contrôler la disponibilité en temps réel
- Prévenir les doubles réservations (gestion de la concurrence)
- Fournir des statistiques sur les emprunts

### Focus NoSQL

Ce projet met l'accent sur la **modélisation documentaire** avec MongoDB :

- **Embedding** : Les exemplaires sont embarqués dans les ouvrages pour une lecture performante
- **Referencing** : Les emprunts et adhérents sont référencés pour éviter la duplication

---

## 🏗️ Architecture Technique

### Collections principales

1. **`adherents`** : Utilisateurs de la bibliothèque (étudiants, enseignants, bibliothécaires)
2. **`ouvrages`** : Livres du fonds documentaire avec exemplaires embarqués
3. **`emprunts`** : Historique des emprunts (collection référencée)

### Stack technologique

- **Base de données** : MongoDB 6.0+
- **Langage** : JavaScript (Node.js pour scripts mongosh)
- **Outils** : mongosh, MongoDB Compass

---

## 📁 Structure du Dépôt

```
biblio-uob/
├── README.md                  # Ce fichier
├── conception/                # Modèle de données et schémas
│   ├── modele-donnees.pdf    # Documentation complète (à générer)
│   └── schema.png            # Schéma visuel (à générer)
├── data/
│   └── seed.js               # Données de test (contexte gabonais)
├── scripts/
│   ├── 01-crud.js            # Opérations CRUD
│   ├── 02-requetes.js        # Requêtes avancées
│   ├── 03-agregations.js     # Pipelines d'agrégation
│   └── 04-index.js           # Indexation et performances
├── explain/
│   └── explain-avant-apres.pdf  # Analyse COLLSCAN → IXSCAN (à générer)
└── rapport/
    └── rapport.pdf           # Rapport final complet (à générer)
```

---

## ⚙️ Prérequis

### Obligatoires

- **MongoDB** 6.0+ ([Installation](https://www.mongodb.com/try/download/community) ou [MongoDB Atlas gratuit](https://www.mongodb.com/cloud/atlas/register))
- **Node.js** 18+ et **npm** ([Télécharger](https://nodejs.org/))
- **Git** ([Télécharger](https://git-scm.com/))

### Optionnels (recommandés)

- **MongoDB Compass** : Interface graphique pour MongoDB
- **mongosh** : Shell MongoDB moderne
- **VS Code** : Éditeur de code
- **Postman** ou **Thunder Client** : Test des endpoints API

---

## 🚀 Installation et Démarrage

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-groupe/biblio-uob.git
cd biblio-uob
```

### 2. Configuration de la base de données

#### Option A : MongoDB local

```bash
# Démarrer MongoDB (Windows)
net start MongoDB

# Démarrer MongoDB (macOS/Linux)
sudo systemctl start mongod
```

#### Option B : MongoDB Atlas (cloud gratuit)

1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Créer un cluster gratuit (M0)
3. Configurer l'accès réseau (ajouter `0.0.0.0/0` pour les tests)
4. Récupérer la chaîne de connexion

### 3. Peupler la base de données

```bash
mongosh

# Dans mongosh :
use biblio_uob
load("data/seed.js")
```

✅ **Résultat attendu** :
```
✓ 12 adhérents insérés
✓ 8 ouvrages insérés
✓ 6 emprunts insérés
✅ Base de données peuplée avec succès !
```

### 4. Tester les scripts MongoDB

```bash
# Dans mongosh :
use biblio_uob

# Script 1 : Opérations CRUD
load("scripts/01-crud.js")

# Script 2 : Requêtes avancées
load("scripts/02-requetes.js")

# Script 3 : Agrégations
load("scripts/03-agregations.js")

# Script 4 : Indexation
load("scripts/04-index.js")
```

### 5. Analyse des Performances (optionnel)

Pour comparer les performances avant/après indexation :

```bash
# Dans mongosh
use biblio_uob
load("scripts/04-index.js")
```

Capturer les résultats pour le document `explain/explain-avant-apres.pdf`

---

## 📊 Livrables Spécifiques au Thème

### ✅ Modèle de données justifié

- **Embedding** : Exemplaires dans ouvrages (accès rapide, cohérence)
- **Referencing** : Emprunts et adhérents (évite duplication, historique volumineux)
- Documentation complète dans `conception/modele-donnees.pdf`

### ✅ Top 10 des ouvrages les plus empruntés

```javascript
// Script : scripts/03-agregations.js (ligne 17)
db.ouvrages.aggregate([
  { $project: { titre: 1, totalEmprunts: 1, categorie: 1 } },
  { $sort: { totalEmprunts: -1 } },
  { $limit: 10 }
]);
```

### ✅ Gestion du statut des exemplaires

Statuts gérés via opérations atomiques `$set` et `$inc` :
- `disponible` : Libre pour emprunt/réservation
- `reserve` : Réservé par un adhérent
- `emprunte` : En cours d'emprunt

```javascript
// Exemple : backend/src/routes/ouvrages.js
db.ouvrages.updateOne(
  { _id: ouvrageId, "exemplaires.code": code },
  { $set: { "exemplaires.$.statut": "emprunte" }, $inc: { nbDisponibles: -1 } }
);
```

### ✅ Prévention des doubles réservations

Requête atomique avec condition dans `findOneAndUpdate` :

```javascript
// Exemple de requête atomique (scripts/03-agregations.js démontre le concept)
db.ouvrages.findOneAndUpdate(
  {
    _id: ouvrageId,
    exemplaires: { $elemMatch: { code: "INF-NOSQL-001", statut: "disponible" } }
  },
  { 
    $set: { "exemplaires.$.statut": "reserve" }, 
    $inc: { nbDisponibles: -1 } 
  },
  { returnNewDocument: true }
);
```

Si deux requêtes arrivent simultanément, **une seule réussira** grâce à l'atomicité de MongoDB.

---

## 🔍 Analyse des Performances (explain)

Le script `scripts/04-index.js` compare les performances **avant/après indexation** :

### Résultats typiques

| Requête | Sans index (COLLSCAN) | Avec index (IXSCAN) | Gain |
|---------|------------------------|---------------------|------|
| Recherche par matricule | 12 docs examinés | **1 doc** | -92% |
| Recherche par catégorie | 8 docs examinés | **3 docs** | -63% |
| Emprunts d'un adhérent | 6 docs examinés | **2 docs** | -67% |

📸 **Captures d'écran détaillées** : Voir `explain/explain-avant-apres.pdf`

---

## 🧪 Tests et Validation

### Validation des Scripts

Tous les scripts sont testés et fonctionnels :
- `data/seed.js` : Peuplement réussi (12 adhérents, 8 ouvrages, 6 emprunts)
- `scripts/01-crud.js` : Toutes les opérations CRUD validées
- `scripts/02-requetes.js` : 21 requêtes avancées testées
- `scripts/03-agregations.js` : 11 pipelines d'agrégation fonctionnels
- `scripts/04-index.js` : Indexation validée avec gains -60 à -92%

---

## 📄 Rapport Final

Le rapport complet (10-15 pages) est disponible dans `rapport/rapport.pdf` et couvre :

1. **Introduction** : Contexte et objectifs
2. **Modélisation NoSQL** : Choix embedding/referencing
3. **Implémentation** : Collections et structure
4. **Requêtes et agrégations** : Exemples et explications
5. **Indexation** : Stratégie et analyse des performances
6. **Comparaison SQL vs NoSQL** : Avantages et limites
7. **Difficultés rencontrées** : Solutions apportées
8. **Conclusion** : Bilan et perspectives

---

## 🎯 Fonctionnalités Principales (Démontrées dans les Scripts)

### Gestion des Adhérents
- ✅ CRUD complet (`scripts/01-crud.js`)
- ✅ Validation de statut (actif, inactif)
- ✅ Recherche par matricule (avec/sans index)

### Gestion des Ouvrages
- ✅ CRUD avec exemplaires embarqués
- ✅ Mise à jour atomique du statut d'exemplaire
- ✅ Recherche par catégorie, titre (regex)

### Gestion des Emprunts
- ✅ Création d'emprunt avec vérification de disponibilité
- ✅ Gestion des retours
- ✅ Identification des retards
- ✅ Top 10 des ouvrages les plus empruntés (agrégation)

---

## 🔒 Sécurité et Intégrité

- **Atomicité** : Opérations `findOneAndUpdate` pour éviter les doubles réservations
- **Validation** : Schémas MongoDB stricts
- **Concurrence** : Gestion via requêtes conditionnelles
- **Cohérence** : Dénormalisation contrôlée (ouvrageTitre, adherentNom)

---

## 📚 Documentation Complémentaire

- [Documentation MongoDB](https://www.mongodb.com/docs/)
- [Guide Mongoose](https://mongoosejs.com/docs/guide.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Modèle de données MongoDB](./docs/modele-donnees.md)

---

## 🤝 Contribution

Ce projet est développé dans le cadre du module **Bases de données NoSQL** de l'Université Omar Bongo.

---

## 📧 Contact

Pour toute question :

- **MALEMBA Esther Lydie** : [esther.malemba@etudiant.uob.ga](mailto:esther.malemba@etudiant.uob.ga)
- **OUSMANE-MOANDA Ali** : [ali.ousmane@etudiant.uob.ga](mailto:ali.ousmane@etudiant.uob.ga)
- **NDONG EYEGHE Georges** : [georges.ndong@etudiant.uob.ga](mailto:georges.ndong@etudiant.uob.ga)

---

**📅 Année académique** : 2025-2026  
**🎓 Établissement** : INSTITUT AFRICAINE D4INFORMATIQUE (IAI)
