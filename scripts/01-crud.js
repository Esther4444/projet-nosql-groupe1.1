/**
 * Script 01 : Opérations CRUD (Create, Read, Update, Delete)
 * 
 * Démontre les opérations de base MongoDB sur les collections
 * adherents, ouvrages et emprunts
 * 
 * Utilisation :
 *   mongosh
 *   use biblio_uob
 *   load("scripts/01-crud.js")
 */

print("\n=== Script 01 : Opérations CRUD ===\n");

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE (insertOne / insertMany)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- CREATE ---\n");

// 1. Ajout d'un nouvel adhérent (insertOne)
print("1. Ajout d'un étudiant :");
const nouvelEtudiant = db.adherents.insertOne({
  matricule: "UOB-ET-2024-150",
  nom: "BOUNDOU",
  prenom: "Kevin",
  type: "etudiant",
  email: "kevin.boundou@etudiant.uob.ga",
  mot_de_passe: "$2a$10$XvZ5qR3yK8nJ9wL4mP2tZuF.Yg7HsN6jQ8pW1rT0vU9aE3bC5dF7g",
  role: "membre",
  statut: "actif",
});
print(`   ✓ Adhérent créé avec l'ID : ${nouvelEtudiant.insertedId}\n`);

// 2. Ajout de plusieurs ouvrages (insertMany)
print("2. Ajout de plusieurs ouvrages :");
const nouveauxOuvrages = db.ouvrages.insertMany([
  {
    titre: "Intelligence Artificielle : Une Approche Moderne",
    auteur: "Stuart Russell, Peter Norvig",
    annee: 2021,
    editeur: "Pearson",
    isbn: "978-0134610993",
    categorie: "Informatique",
    nbDisponibles: 2,
    totalEmprunts: 0,
    exemplaires: [
      { code: "INF-IA-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "INF-IA-002", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
  {
    titre: "Géopolitique de l'Afrique Centrale",
    auteur: "Roland MARCHAL",
    annee: 2020,
    editeur: "Armand Colin",
    isbn: "978-2200625",
    categorie: "Géopolitique",
    nbDisponibles: 3,
    totalEmprunts: 0,
    exemplaires: [
      { code: "GEO-AFR-001", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "GEO-AFR-002", statut: "disponible", reservePar: null, reserveLe: null },
      { code: "GEO-AFR-003", statut: "disponible", reservePar: null, reserveLe: null },
    ],
  },
]);
print(`   ✓ ${Object.keys(nouveauxOuvrages.insertedIds).length} ouvrages créés\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// READ (find avec filtres et projection)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- READ ---\n");

// 3. Lecture de tous les étudiants (filtre simple)
print("3. Liste des étudiants actifs :");
const etudiants = db.adherents.find(
  { type: "etudiant", statut: "actif" },
  { matricule: 1, nom: 1, prenom: 1, _id: 0 }
).toArray();
print(`   ✓ ${etudiants.length} étudiants trouvés`);
etudiants.slice(0, 3).forEach(e => print(`     - ${e.prenom} ${e.nom} (${e.matricule})`));
print("");

// 4. Recherche d'un ouvrage par titre (regex)
print("4. Recherche d'ouvrages contenant 'Intelligence' :");
const ouvragesIA = db.ouvrages.find(
  { titre: /Intelligence/i },
  { titre: 1, auteur: 1, nbDisponibles: 1, _id: 0 }
).toArray();
ouvragesIA.forEach(o => print(`   - ${o.titre} (${o.auteur}) - ${o.nbDisponibles} dispo`));
print("");

// 5. Lecture des emprunts en cours avec projection
print("5. Emprunts actuellement en cours :");
const empruntsEnCours = db.emprunts.find(
  { statut: "en_cours" },
  { ouvrageTitre: 1, adherentNom: 1, dateRetourPrevue: 1, _id: 0 }
).toArray();
print(`   ✓ ${empruntsEnCours.length} emprunt(s) en cours`);
empruntsEnCours.forEach(e => {
  const date = e.dateRetourPrevue.toISOString().split('T')[0];
  print(`     - "${e.ouvrageTitre}" par ${e.adherentNom} (retour: ${date})`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE (updateOne / updateMany)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- UPDATE ---\n");

// 6. Mise à jour d'un adhérent ($set)
print("6. Ajout d'un email à un adhérent :");
const updateEmail = db.adherents.updateOne(
  { matricule: "UOB-ET-2024-150" },
  { $set: { email: "k.boundou@gmail.com" } }
);
print(`   ✓ ${updateEmail.modifiedCount} document modifié\n`);

// 7. Incrémenter le compteur d'emprunts d'un ouvrage ($inc)
print("7. Incrémentation du compteur d'emprunts d'un ouvrage :");
const updateCompteur = db.ouvrages.updateOne(
  { titre: /Intelligence Artificielle/ },
  { $inc: { totalEmprunts: 1 } }
);
print(`   ✓ ${updateCompteur.modifiedCount} compteur incrémenté\n`);

// 8. Ajout d'un exemplaire à un ouvrage ($push)
print("8. Ajout d'un exemplaire à un ouvrage :");
const ajoutExemplaire = db.ouvrages.updateOne(
  { titre: /Intelligence Artificielle/ },
  {
    $push: {
      exemplaires: {
        code: "INF-IA-003",
        statut: "disponible",
        reservePar: null,
        reserveLe: null,
      },
    },
    $inc: { nbDisponibles: 1 },
  }
);
print(`   ✓ ${ajoutExemplaire.modifiedCount} exemplaire ajouté\n`);

// 9. Mise à jour multiple : passer tous les comptes inactifs en attente
print("9. Changement du statut de tous les comptes inactifs :");
const updateStatuts = db.adherents.updateMany(
  { statut: "inactif" },
  { $set: { statut: "inactif" } } // Déjà inactif, mais démontre updateMany
);
print(`   ✓ ${updateStatuts.matchedCount} document(s) trouvé(s)\n`);

// 10. Modifier le statut d'un exemplaire (opération positionnelle $)
print("10. Passage d'un exemplaire à 'réservé' :");
const reserverExemplaire = db.ouvrages.updateOne(
  { titre: /Géopolitique/, "exemplaires.code": "GEO-AFR-001" },
  {
    $set: {
      "exemplaires.$.statut": "reserve",
      "exemplaires.$.reservePar": db.adherents.findOne({ matricule: "UOB-ET-2024-101" })._id,
      "exemplaires.$.reserveLe": new Date(),
    },
    $inc: { nbDisponibles: -1 },
  }
);
print(`   ✓ ${reserverExemplaire.modifiedCount} exemplaire réservé\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE (deleteOne / deleteMany)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- DELETE ---\n");

// 11. Suppression d'un emprunt rendu (deleteOne)
print("11. Suppression d'un ancien emprunt :");
const deleteEmprunt = db.emprunts.deleteOne({
  statut: "rendu",
  dateRetourEffective: { $lt: new Date("2026-05-01") },
});
print(`   ✓ ${deleteEmprunt.deletedCount} emprunt supprimé\n`);

// 12. Suppression d'un exemplaire d'un ouvrage ($pull)
print("12. Retrait d'un exemplaire endommagé :");
const retirerExemplaire = db.ouvrages.updateOne(
  { titre: /Intelligence Artificielle/ },
  {
    $pull: { exemplaires: { code: "INF-IA-003" } },
    $inc: { nbDisponibles: -1 },
  }
);
print(`   ✓ ${retirerExemplaire.modifiedCount} exemplaire retiré\n`);

// 13. Suppression multiple : supprimer tous les emprunts rendus avant 2026
print("13. Nettoyage des anciens emprunts :");
const deleteAnciensEmprunts = db.emprunts.deleteMany({
  statut: "rendu",
  dateRetourEffective: { $lt: new Date("2026-01-01") },
});
print(`   ✓ ${deleteAnciensEmprunts.deletedCount} ancien(s) emprunt(s) supprimé(s)\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// RÉSUMÉ
// ═══════════════════════════════════════════════════════════════════════════════

print("=== Résumé des opérations CRUD ===");
print(`Total adhérents : ${db.adherents.countDocuments()}`);
print(`Total ouvrages : ${db.ouvrages.countDocuments()}`);
print(`Total emprunts : ${db.emprunts.countDocuments()}`);
print("\n✅ Script CRUD terminé avec succès !\n");
