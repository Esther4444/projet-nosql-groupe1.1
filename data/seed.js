/**
 * Script de peuplement de la base de données biblio_uob
 * Données de test réalistes dans le contexte gabonais
 * 
 * Utilisation :
 *   mongosh
 *   use biblio_uob
 *   load("data/seed.js")
 */

print("=== Peuplement de la base biblio_uob ===\n");

// Suppression des collections existantes pour un peuplement propre
db.adherents.drop();
db.ouvrages.drop();
db.emprunts.drop();

print("Collections supprimées.\n");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ADHÉRENTS (étudiants, enseignants, bibliothécaires)
// ═══════════════════════════════════════════════════════════════════════════════

const adherents = [
  // Bibliothécaire (Admin)
  {
    matricule: "ADMIN-001",
    nom: "OBAME",
    prenom: "Marie-Claire",
    type: "enseignant",
    email: "m.obame@uob.ga",
    // Mot de passe haché : "password123" (bcrypt)
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "admin",
    statut: "actif",
  },

  // Enseignants
  {
    matricule: "UOB-EN-2019-001",
    nom: "MBOUMBA",
    prenom: "Jean-Pierre",
    type: "enseignant",
    email: "jp.mboumba@uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-EN-2020-002",
    nom: "NZAMBA",
    prenom: "Charlotte",
    type: "enseignant",
    email: "c.nzamba@uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-EN-2018-003",
    nom: "OKOME",
    prenom: "Daniel",
    type: "enseignant",
    email: "d.okome@uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },

  // Étudiants
  {
    matricule: "UOB-ET-2024-101",
    nom: "BIVIGOU",
    prenom: "Alice",
    type: "etudiant",
    email: "alice.bivigou@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-ET-2024-102",
    nom: "KOMBILA",
    prenom: "Brice",
    type: "etudiant",
    email: "brice.kombila@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-ET-2023-201",
    nom: "NGUEMA",
    prenom: "Claire",
    type: "etudiant",
    email: "claire.nguema@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-ET-2023-202",
    nom: "OYOUGOU",
    prenom: "David",
    type: "etudiant",
    email: "david.oyougou@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-ET-2024-103",
    nom: "MAYOMBO",
    prenom: "Émilie",
    type: "etudiant",
    email: "emilie.mayombo@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-ET-2022-301",
    nom: "NDONG",
    prenom: "Fabrice",
    type: "etudiant",
    email: "fabrice.ndong@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-ET-2024-104",
    nom: "AKENDENGUE",
    prenom: "Grace",
    type: "etudiant",
    email: "grace.akendengue@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  {
    matricule: "UOB-ET-2023-203",
    nom: "ONDO",
    prenom: "Henri",
    type: "etudiant",
    email: "henri.ondo@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "actif",
  },
  
  // Comptes en attente de validation
  {
    matricule: "UOB-ET-2024-105",
    nom: "MOUITY",
    prenom: "Isabelle",
    type: "etudiant",
    email: "isabelle.mouity@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "inactif",
    carte: "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // Simplification
  },
  {
    matricule: "UOB-ET-2024-106",
    nom: "MAGANGA",
    prenom: "Jules",
    type: "etudiant",
    email: "jules.maganga@etudiant.uob.ga",
    mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
    role: "membre",
    statut: "inactif",
    carte: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  },
];

const resultAdherents = db.adherents.insertMany(adherents);
print(`✓ ${resultAdherents.insertedIds.length} adhérents insérés\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. OUVRAGES (avec exemplaires embarqués)
// ═══════════════════════════════════════════════════════════════════════════════

const ouvrages = [
  {
    titre: "Introduction aux Bases de Données NoSQL",
    auteur: "Martin Fowler",
    annee: 2020,
    editeur: "Addison-Wesley",
    isbn: "978-0321826626",
    categorie: "Informatique",
    nbDisponibles: 3,
    totalEmprunts: 12,
    exemplaires: [
      { code: "INF-NOSQL-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "INF-NOSQL-002", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "INF-NOSQL-003", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
  {
    titre: "Mathématiques pour l'Informatique",
    auteur: "Donald E. Knuth",
    annee: 2019,
    editeur: "Dunod",
    isbn: "978-2100794",
    categorie: "Mathématiques",
    nbDisponibles: 2,
    totalEmprunts: 8,
    exemplaires: [
      { code: "MATH-INFO-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "MATH-INFO-002", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
  {
    titre: "Histoire du Gabon Contemporain",
    auteur: "Nicolas METEGUE N'NAH",
    annee: 2021,
    editeur: "Éditions Raponda-Walker",
    isbn: "978-2912776",
    categorie: "Histoire",
    nbDisponibles: 4,
    totalEmprunts: 15,
    exemplaires: [
      { code: "HIST-GAB-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "HIST-GAB-002", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "HIST-GAB-003", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "HIST-GAB-004", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
  {
    titre: "Économie du Développement en Afrique Centrale",
    auteur: "Jean-Marc ELA",
    annee: 2018,
    editeur: "L'Harmattan",
    isbn: "978-2343134",
    categorie: "Économie",
    nbDisponibles: 2,
    totalEmprunts: 6,
    exemplaires: [
      { code: "ECO-DEV-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "ECO-DEV-002", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
  {
    titre: "Programmation Python pour les Sciences",
    auteur: "Jake VanderPlas",
    annee: 2022,
    editeur: "O'Reilly",
    isbn: "978-1491912058",
    categorie: "Informatique",
    nbDisponibles: 3,
    totalEmprunts: 20,
    exemplaires: [
      { code: "INF-PYTHON-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "INF-PYTHON-002", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "INF-PYTHON-003", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
  {
    titre: "Littérature Francophone d'Afrique",
    auteur: "Bernard MOURALIS",
    annee: 2017,
    editeur: "PUF",
    isbn: "978-2130584",
    categorie: "Littérature",
    nbDisponibles: 5,
    totalEmprunts: 10,
    exemplaires: [
      { code: "LIT-AFR-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "LIT-AFR-002", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "LIT-AFR-003", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "LIT-AFR-004", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "LIT-AFR-005", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
  {
    titre: "Droit Constitutionnel Gabonais",
    auteur: "Apollinaire NGUIMATSA",
    annee: 2020,
    editeur: "Éditions Ntsame",
    isbn: "978-2912773",
    categorie: "Droit",
    nbDisponibles: 2,
    totalEmprunts: 5,
    exemplaires: [
      { code: "DROIT-CONST-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "DROIT-CONST-002", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
  {
    titre: "Physique Générale - Tome 1",
    auteur: "Douglas C. Giancoli",
    annee: 2019,
    editeur: "De Boeck",
    isbn: "978-2807319",
    categorie: "Physique",
    nbDisponibles: 4,
    totalEmprunts: 14,
    exemplaires: [
      { code: "PHY-GEN-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "PHY-GEN-002", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "PHY-GEN-003", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "PHY-GEN-004", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
];

const resultOuvrages = db.ouvrages.insertMany(ouvrages);
print(`✓ ${resultOuvrages.insertedIds.length} ouvrages insérés\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. EMPRUNTS (collection référencée)
// ═══════════════════════════════════════════════════════════════════════════════

// Récupération des IDs pour les relations
const alice = db.adherents.findOne({ matricule: "UOB-ET-2024-101" });
const brice = db.adherents.findOne({ matricule: "UOB-ET-2024-102" });
const claire = db.adherents.findOne({ matricule: "UOB-ET-2023-201" });
const enseignant = db.adherents.findOne({ matricule: "UOB-EN-2019-001" });

const nosql = db.ouvrages.findOne({ titre: /NoSQL/ });
const python = db.ouvrages.findOne({ titre: /Python/ });
const histoire = db.ouvrages.findOne({ titre: /Histoire du Gabon/ });

const emprunts = [
  // Emprunts en cours
  {
    ouvrage: nosql._id,
    exemplaireCode: "INF-NOSQL-001",
    adherent: alice._id,
    ouvrageTitre: nosql.titre,
    adherentNom: "Alice BIVIGOU",
    dateEmprunt: new Date("2026-06-15"),
    dateRetourPrevue: new Date("2026-06-29"),
    dateRetourEffective: null,
    statut: "en_cours",
  },
  {
    ouvrage: python._id,
    exemplaireCode: "INF-PYTHON-001",
    adherent: brice._id,
    ouvrageTitre: python.titre,
    adherentNom: "Brice KOMBILA",
    dateEmprunt: new Date("2026-06-20"),
    dateRetourPrevue: new Date("2026-07-04"),
    dateRetourEffective: null,
    statut: "en_cours",
  },
  {
    ouvrage: histoire._id,
    exemplaireCode: "HIST-GAB-001",
    adherent: enseignant._id,
    ouvrageTitre: histoire.titre,
    adherentNom: "Jean-Pierre MBOUMBA",
    dateEmprunt: new Date("2026-06-10"),
    dateRetourPrevue: new Date("2026-07-10"),
    dateRetourEffective: null,
    statut: "en_cours",
  },

  // Emprunts rendus
  {
    ouvrage: nosql._id,
    exemplaireCode: "INF-NOSQL-002",
    adherent: claire._id,
    ouvrageTitre: nosql.titre,
    adherentNom: "Claire NGUEMA",
    dateEmprunt: new Date("2026-05-01"),
    dateRetourPrevue: new Date("2026-05-15"),
    dateRetourEffective: new Date("2026-05-14"),
    statut: "rendu",
  },
  {
    ouvrage: python._id,
    exemplaireCode: "INF-PYTHON-002",
    adherent: alice._id,
    ouvrageTitre: python.titre,
    adherentNom: "Alice BIVIGOU",
    dateEmprunt: new Date("2026-05-10"),
    dateRetourPrevue: new Date("2026-05-24"),
    dateRetourEffective: new Date("2026-05-23"),
    statut: "rendu",
  },

  // Emprunt en retard
  {
    ouvrage: histoire._id,
    exemplaireCode: "HIST-GAB-002",
    adherent: brice._id,
    ouvrageTitre: histoire.titre,
    adherentNom: "Brice KOMBILA",
    dateEmprunt: new Date("2026-06-01"),
    dateRetourPrevue: new Date("2026-06-15"),
    dateRetourEffective: null,
    statut: "en_cours",
  },
];

const resultEmprunts = db.emprunts.insertMany(emprunts);
print(`✓ ${resultEmprunts.insertedIds.length} emprunts insérés\n`);

// Mise à jour du statut des exemplaires empruntés
db.ouvrages.updateOne(
  { _id: nosql._id, "exemplaires.code": "INF-NOSQL-001" },
  { $set: { "exemplaires.$.statut": "emprunte" }, $inc: { nbDisponibles: -1 } }
);

db.ouvrages.updateOne(
  { _id: python._id, "exemplaires.code": "INF-PYTHON-001" },
  { $set: { "exemplaires.$.statut": "emprunte" }, $inc: { nbDisponibles: -1 } }
);

db.ouvrages.updateOne(
  { _id: histoire._id, "exemplaires.code": "HIST-GAB-001" },
  { $set: { "exemplaires.$.statut": "emprunte" }, $inc: { nbDisponibles: -1 } }
);

db.ouvrages.updateOne(
  { _id: histoire._id, "exemplaires.code": "HIST-GAB-002" },
  { $set: { "exemplaires.$.statut": "emprunte" }, $inc: { nbDisponibles: -1 } }
);

print("✓ Statuts des exemplaires mis à jour\n");

// ═══════════════════════════════════════════════════════════════════════════════
// 4. RÉSUMÉ
// ═══════════════════════════════════════════════════════════════════════════════

print("=== Résumé du peuplement ===");
print(`Adhérents : ${db.adherents.countDocuments()}`);
print(`Ouvrages : ${db.ouvrages.countDocuments()}`);
print(`Emprunts : ${db.emprunts.countDocuments()}`);
print("\n✅ Base de données peuplée avec succès !\n");
