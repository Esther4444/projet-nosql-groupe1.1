/**
 * Script 02 : Requêtes avancées
 * 
 * Démontre l'utilisation d'opérateurs de comparaison, logiques,
 * expressions régulières, tri, pagination et comptage
 * 
 * Utilisation :
 *   mongosh
 *   use biblio_uob
 *   load("scripts/02-requetes.js")
 */

print("\n=== Script 02 : Requêtes avancées ===\n");

// ═══════════════════════════════════════════════════════════════════════════════
// OPÉRATEURS DE COMPARAISON ($gt, $lt, $gte, $lte, $in, $nin)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- Opérateurs de comparaison ---\n");

// 1. Ouvrages publiés après 2019
print("1. Ouvrages publiés après 2019 :");
const ouvr

agesRecents = db.ouvrages.find(
  { annee: { $gt: 2019 } },
  { titre: 1, annee: 1, _id: 0 }
).toArray();
print(`   ✓ ${ouvragesRecents.length} ouvrage(s) trouvé(s)`);
ouvragesRecents.forEach(o => print(`     - ${o.titre} (${o.annee})`));
print("");

// 2. Ouvrages avec 3 exemplaires ou plus
print("2. Ouvrages ayant au moins 3 exemplaires :");
const ouvragesStockImportant = db.ouvrages.find(
  { $expr: { $gte: [{ $size: "$exemplaires" }, 3] } },
  { titre: 1, exemplaires: 1, _id: 0 }
).toArray();
print(`   ✓ ${ouvragesStockImportant.length} ouvrage(s)`);
ouvragesStockImportant.forEach(o => print(`     - ${o.titre} : ${o.exemplaires.length} ex.`));
print("");

// 3. Emprunts effectués entre deux dates
print("3. Emprunts effectués en juin 2026 :");
const empruntsJuin = db.emprunts.find({
  dateEmprunt: {
    $gte: new Date("2026-06-01"),
    $lt: new Date("2026-07-01"),
  },
}).count();
print(`   ✓ ${empruntsJuin} emprunt(s) en juin 2026\n`);

// 4. Ouvrages dans plusieurs catégories ($in)
print("4. Ouvrages en Informatique ou Mathématiques :");
const ouvragesTech = db.ouvrages.find(
  { categorie: { $in: ["Informatique", "Mathématiques"] } },
  { titre: 1, categorie: 1, _id: 0 }
).toArray();
print(`   ✓ ${ouvragesTech.length} ouvrage(s)`);
ouvragesTech.forEach(o => print(`     - ${o.titre} [${o.categorie}]`));
print("");

// 5. Adhérents qui ne sont pas étudiants ($ne / $nin)
print("5. Adhérents enseignants ou admins :");
const nonEtudiants = db.adherents.find(
  { type: { $ne: "etudiant" } },
  { nom: 1, prenom: 1, type: 1, role: 1, _id: 0 }
).toArray();
print(`   ✓ ${nonEtudiants.length} adhérent(s)`);
nonEtudiants.forEach(a => print(`     - ${a.prenom} ${a.nom} (${a.type}, ${a.role})`));
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// OPÉRATEURS LOGIQUES ($and, $or, $not, $nor)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- Opérateurs logiques ---\n");

// 6. Ouvrages disponibles ET récents ($and implicite)
print("6. Ouvrages disponibles publiés après 2018 :");
const dispo = db.ouvrages.find(
  { nbDisponibles: { $gt: 0 }, annee: { $gte: 2019 } },
  { titre: 1, annee: 1, nbDisponibles: 1, _id: 0 }
).toArray();
print(`   ✓ ${dispo.length} ouvrage(s)`);
dispo.forEach(o => print(`     - ${o.titre} (${o.annee}) : ${o.nbDisponibles} dispo`));
print("");

// 7. Adhérents étudiants OU enseignants actifs ($or)
print("7. Adhérents actifs (étudiants ou enseignants) :");
const actifsOr = db.adherents.find({
  $or: [{ type: "etudiant" }, { type: "enseignant" }],
  statut: "actif",
}).count();
print(`   ✓ ${actifsOr} adhérent(s) actif(s)\n`);

// 8. Emprunts ni rendus ni en retard (logique complexe)
print("8. Emprunts en cours sans retard :");
const sansRetard = db.emprunts.find({
  statut: "en_cours",
  dateRetourPrevue: { $gte: new Date() },
}).count();
print(`   ✓ ${sansRetard} emprunt(s) en cours dans les délais\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXPRESSIONS RÉGULIÈRES (regex)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- Expressions régulières ---\n");

// 9. Recherche d'ouvrages par mots-clés dans le titre
print("9. Ouvrages contenant 'Gabon' (insensible à la casse) :");
const gabonais = db.ouvrages.find(
  { titre: /Gabon/i },
  { titre: 1, auteur: 1, _id: 0 }
).toArray();
print(`   ✓ ${gabonais.length} ouvrage(s)`);
gabonais.forEach(o => print(`     - ${o.titre} (${o.auteur})`));
print("");

// 10. Recherche d'adhérents par nom commençant par 'N'
print("10. Adhérents dont le nom commence par 'N' :");
const nomsN = db.adherents.find(
  { nom: /^N/i },
  { nom: 1, prenom: 1, matricule: 1, _id: 0 }
).toArray();
print(`   ✓ ${nomsN.length} adhérent(s)`);
nomsN.forEach(a => print(`     - ${a.prenom} ${a.nom} (${a.matricule})`));
print("");

// 11. Recherche d'emails avec domaine spécifique
print("11. Emails du domaine @uob.ga :");
const emailsUOB = db.adherents.find(
  { email: /@uob\.ga$/i },
  { email: 1, nom: 1, _id: 0 }
).count();
print(`   ✓ ${emailsUOB} adhérent(s) avec email @uob.ga\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// TRI (sort)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- Tri ---\n");

// 12. Ouvrages triés par nombre d'emprunts (décroissant)
print("12. Top 5 des ouvrages les plus empruntés :");
const topEmprunts = db.ouvrages
  .find({}, { titre: 1, totalEmprunts: 1, _id: 0 })
  .sort({ totalEmprunts: -1 })
  .limit(5)
  .toArray();
topEmprunts.forEach((o, i) => print(`     ${i + 1}. ${o.titre} : ${o.totalEmprunts} emprunts`));
print("");

// 13. Adhérents triés alphabétiquement
print("13. Adhérents triés par nom (A-Z) :");
const alpha = db.adherents
  .find({ statut: "actif" }, { nom: 1, prenom: 1, _id: 0 })
  .sort({ nom: 1, prenom: 1 })
  .limit(5)
  .toArray();
alpha.forEach(a => print(`     - ${a.nom} ${a.prenom}`));
print("");

// 14. Emprunts triés par date (plus récent en premier)
print("14. 3 emprunts les plus récents :");
const recentsEmprunts = db.emprunts
  .find({}, { ouvrageTitre: 1, adherentNom: 1, dateEmprunt: 1, _id: 0 })
  .sort({ dateEmprunt: -1 })
  .limit(3)
  .toArray();
recentsEmprunts.forEach(e => {
  const date = e.dateEmprunt.toISOString().split('T')[0];
  print(`     - ${e.ouvrageTitre} par ${e.adherentNom} le ${date}`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// PAGINATION (skip / limit)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- Pagination ---\n");

// 15. Pagination des ouvrages (page 2, 3 résultats par page)
print("15. Ouvrages - Page 2 (3 par page) :");
const page = 2;
const parPage = 3;
const paginatedOuvrages = db.ouvrages
  .find({}, { titre: 1, auteur: 1, _id: 0 })
  .sort({ titre: 1 })
  .skip((page - 1) * parPage)
  .limit(parPage)
  .toArray();
paginatedOuvrages.forEach((o, i) => print(`     ${(page - 1) * parPage + i + 1}. ${o.titre}`));
print("");

// 16. Comptage total pour la pagination
const totalOuvrages = db.ouvrages.countDocuments();
const totalPages = Math.ceil(totalOuvrages / parPage);
print(`16. Pagination : ${totalOuvrages} ouvrages au total, ${totalPages} page(s)\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPTAGE ET EXISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

print("--- Comptage ---\n");

// 17. Nombre d'emprunts par statut
print("17. Répartition des emprunts par statut :");
["en_cours", "rendu"].forEach(s => {
  const count = db.emprunts.countDocuments({ statut: s });
  print(`     - ${s} : ${count}`);
});
print("");

// 18. Vérifier l'existence d'un matricule
print("18. Vérification d'un matricule :");
const existe = db.adherents.findOne({ matricule: "UOB-ET-2024-101" }) !== null;
print(`     - UOB-ET-2024-101 : ${existe ? "✓ Existe" : "✗ N'existe pas"}\n`);

// 19. Ouvrages sans exemplaire disponible
print("19. Ouvrages en rupture de stock :");
const rupture = db.ouvrages.find(
  { nbDisponibles: 0 },
  { titre: 1, _id: 0 }
).toArray();
print(`   ✓ ${rupture.length} ouvrage(s) sans exemplaire disponible`);
if (rupture.length > 0) {
  rupture.forEach(o => print(`     - ${o.titre}`));
}
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// REQUÊTES SUR TABLEAUX EMBARQUÉS
// ═══════════════════════════════════════════════════════════════════════════════

print("--- Requêtes sur tableaux (exemplaires) ---\n");

// 20. Ouvrages ayant au moins un exemplaire réservé
print("20. Ouvrages avec exemplaire(s) réservé(s) :");
const avecReservation = db.ouvrages.find(
  { "exemplaires.statut": "reserve" },
  { titre: 1, _id: 0 }
).toArray();
print(`   ✓ ${avecReservation.length} ouvrage(s)`);
avecReservation.forEach(o => print(`     - ${o.titre}`));
print("");

// 21. Ouvrages avec un code d'exemplaire spécifique
print("21. Ouvrage contenant l'exemplaire 'INF-PYTHON-001' :");
const ouvrageSpecifique = db.ouvrages.findOne(
  { "exemplaires.code": "INF-PYTHON-001" },
  { titre: 1, _id: 0 }
);
if (ouvrageSpecifique) print(`     ✓ ${ouvrageSpecifique.titre}\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// RÉSUMÉ
// ═══════════════════════════════════════════════════════════════════════════════

print("=== Résumé des requêtes avancées ===");
print("✓ Opérateurs de comparaison : $gt, $lt, $gte, $lte, $in, $ne");
print("✓ Opérateurs logiques : $and, $or");
print("✓ Expressions régulières : insensible à la casse, début/fin");
print("✓ Tri : sort() ascendant/descendant");
print("✓ Pagination : skip() et limit()");
print("✓ Comptage : countDocuments()");
print("✓ Requêtes sur tableaux embarqués");
print("\n✅ Script terminé avec succès !\n");
