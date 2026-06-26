/**
 * Script 04 : Indexation et analyse des performances
 * 
 * Démontre la création d'index et l'analyse de performances avec explain()
 * Comparaison COLLSCAN (sans index) vs IXSCAN (avec index)
 * 
 * Utilisation :
 *   mongosh
 *   use biblio_uob
 *   load("scripts/04-index.js")
 */

print("\n=== Script 04 : Indexation et performances ===\n");

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1 : ANALYSE AVANT INDEXATION (COLLSCAN)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- PHASE 1 : Performances AVANT indexation ---\n");

// Suppression des index existants (sauf _id)
print("1. Nettoyage des index existants...");
db.adherents.dropIndexes();
db.ouvrages.dropIndexes();
db.emprunts.dropIndexes();
print("   ✓ Index supprimés (sauf _id)\n");

// Test 1 : Recherche d'adhérent par matricule (COLLSCAN attendu)
print("2. Test 1 : Recherche d'adhérent par matricule");
print("   Requête : db.adherents.find({ matricule: 'UOB-ET-2024-101' })");
const explainMatriculeAvant = db.adherents
  .find({ matricule: "UOB-ET-2024-101" })
  .explain("executionStats");

print(`   ✓ Stage : ${explainMatriculeAvant.executionStats.executionStages.stage}`);
print(`   ✓ Documents examinés : ${explainMatriculeAvant.executionStats.totalDocsExamined}`);
print(`   ✓ Documents retournés : ${explainMatriculeAvant.executionStats.nReturned}`);
print(`   ✓ Temps d'exécution : ${explainMatriculeAvant.executionStats.executionTimeMillis} ms\n`);

// Test 2 : Recherche d'ouvrages par catégorie (COLLSCAN attendu)
print("3. Test 2 : Recherche d'ouvrages par catégorie");
print("   Requête : db.ouvrages.find({ categorie: 'Informatique' })");
const explainCategorieAvant = db.ouvrages
  .find({ categorie: "Informatique" })
  .explain("executionStats");

print(`   ✓ Stage : ${explainCategorieAvant.executionStats.executionStages.stage}`);
print(`   ✓ Documents examinés : ${explainCategorieAvant.executionStats.totalDocsExamined}`);
print(`   ✓ Documents retournés : ${explainCategorieAvant.executionStats.nReturned}`);
print(`   ✓ Temps d'exécution : ${explainCategorieAvant.executionStats.executionTimeMillis} ms\n`);

// Test 3 : Recherche d'emprunts en cours par adhérent (COLLSCAN attendu)
print("4. Test 3 : Emprunts en cours d'un adhérent spécifique");
const alice = db.adherents.findOne({ matricule: "UOB-ET-2024-101" });
print(`   Requête : db.emprunts.find({ adherent: ObjectId('${alice._id}'), statut: 'en_cours' })`);
const explainEmpruntsAvant = db.emprunts
  .find({ adherent: alice._id, statut: "en_cours" })
  .explain("executionStats");

print(`   ✓ Stage : ${explainEmpruntsAvant.executionStats.executionStages.stage}`);
print(`   ✓ Documents examinés : ${explainEmpruntsAvant.executionStats.totalDocsExamined}`);
print(`   ✓ Documents retournés : ${explainEmpruntsAvant.executionStats.nReturned}`);
print(`   ✓ Temps d'exécution : ${explainEmpruntsAvant.executionStats.executionTimeMillis} ms\n`);

print("⚠️  Constat : COLLSCAN sur toutes les collections\n");
print("   Tous les documents sont parcourus séquentiellement.\n");

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 : CRÉATION DES INDEX
// ═══════════════════════════════════════════════════════════════════════════════

print("--- PHASE 2 : Création des index ---\n");

// Index 1 : Matricule des adhérents (unique)
print("5. Création d'index unique sur adherents.matricule...");
db.adherents.createIndex({ matricule: 1 }, { unique: true });
print("   ✓ Index créé : { matricule: 1 } [UNIQUE]\n");

// Index 2 : Catégorie des ouvrages
print("6. Création d'index sur ouvrages.categorie...");
db.ouvrages.createIndex({ categorie: 1 });
print("   ✓ Index créé : { categorie: 1 }\n");

// Index 3 : Index composé sur emprunts (adherent + statut)
print("7. Création d'index composé sur emprunts...");
db.emprunts.createIndex({ adherent: 1, statut: 1 });
print("   ✓ Index créé : { adherent: 1, statut: 1 } [COMPOSÉ]\n");

// Index 4 : Index sur statut des adhérents
print("8. Création d'index sur adherents.statut...");
db.adherents.createIndex({ statut: 1 });
print("   ✓ Index créé : { statut: 1 }\n");

// Index 5 : Index sur dateRetourPrevue pour les requêtes de retard
print("9. Création d'index sur emprunts.dateRetourPrevue...");
db.emprunts.createIndex({ dateRetourPrevue: 1 });
print("   ✓ Index créé : { dateRetourPrevue: 1 }\n");

// Index 6 : Index composé sur ouvrages pour disponibilité
print("10. Création d'index sur ouvrages.nbDisponibles...");
db.ouvrages.createIndex({ nbDisponibles: 1, totalEmprunts: -1 });
print("    ✓ Index créé : { nbDisponibles: 1, totalEmprunts: -1 } [COMPOSÉ]\n");

// Affichage de tous les index créés
print("11. Liste des index créés :");
print("\n   Collection adherents :");
db.adherents.getIndexes().forEach(idx => {
  print(`     - ${JSON.stringify(idx.key)} ${idx.unique ? "[UNIQUE]" : ""}`);
});

print("\n   Collection ouvrages :");
db.ouvrages.getIndexes().forEach(idx => {
  print(`     - ${JSON.stringify(idx.key)}`);
});

print("\n   Collection emprunts :");
db.emprunts.getIndexes().forEach(idx => {
  print(`     - ${JSON.stringify(idx.key)}`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 : ANALYSE APRÈS INDEXATION (IXSCAN)
// ═══════════════════════════════════════════════════════════════════════════════

print("--- PHASE 3 : Performances APRÈS indexation ---\n");

// Test 1 bis : Recherche d'adhérent par matricule (IXSCAN attendu)
print("12. Test 1 bis : Recherche d'adhérent par matricule (avec index)");
const explainMatriculeApres = db.adherents
  .find({ matricule: "UOB-ET-2024-101" })
  .explain("executionStats");

print(`    ✓ Stage : ${explainMatriculeApres.executionStats.executionStages.stage}`);
print(`    ✓ Documents examinés : ${explainMatriculeApres.executionStats.totalDocsExamined}`);
print(`    ✓ Documents retournés : ${explainMatriculeApres.executionStats.nReturned}`);
print(`    ✓ Temps d'exécution : ${explainMatriculeApres.executionStats.executionTimeMillis} ms`);
print(`    ✓ Index utilisé : ${explainMatriculeApres.executionStats.executionStages.indexName}\n`);

// Test 2 bis : Recherche d'ouvrages par catégorie (IXSCAN attendu)
print("13. Test 2 bis : Recherche d'ouvrages par catégorie (avec index)");
const explainCategorieApres = db.ouvrages
  .find({ categorie: "Informatique" })
  .explain("executionStats");

print(`    ✓ Stage : ${explainCategorieApres.executionStats.executionStages.stage}`);
print(`    ✓ Documents examinés : ${explainCategorieApres.executionStats.totalDocsExamined}`);
print(`    ✓ Documents retournés : ${explainCategorieApres.executionStats.nReturned}`);
print(`    ✓ Temps d'exécution : ${explainCategorieApres.executionStats.executionTimeMillis} ms`);
print(`    ✓ Index utilisé : ${explainCategorieApres.executionStats.executionStages.indexName}\n`);

// Test 3 bis : Recherche d'emprunts en cours par adhérent (IXSCAN attendu)
print("14. Test 3 bis : Emprunts en cours d'un adhérent (avec index composé)");
const explainEmpruntsApres = db.emprunts
  .find({ adherent: alice._id, statut: "en_cours" })
  .explain("executionStats");

print(`    ✓ Stage : ${explainEmpruntsApres.executionStats.executionStages.stage}`);
print(`    ✓ Documents examinés : ${explainEmpruntsApres.executionStats.totalDocsExamined}`);
print(`    ✓ Documents retournés : ${explainEmpruntsApres.executionStats.nReturned}`);
print(`    ✓ Temps d'exécution : ${explainEmpruntsApres.executionStats.executionTimeMillis} ms`);
print(`    ✓ Index utilisé : ${explainEmpruntsApres.executionStats.executionStages.indexName}\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4 : COMPARAISON ET ANALYSE
// ═══════════════════════════════════════════════════════════════════════════════

print("--- PHASE 4 : Comparaison avant/après ---\n");

print("15. Test 1 — Recherche par matricule :");
print(`    Avant : COLLSCAN, ${explainMatriculeAvant.executionStats.totalDocsExamined} docs examinés`);
print(`    Après : IXSCAN, ${explainMatriculeApres.executionStats.totalDocsExamined} doc(s) examiné(s)`);
const gainMatricule = explainMatriculeAvant.executionStats.totalDocsExamined - explainMatriculeApres.executionStats.totalDocsExamined;
print(`    ➜ Gain : ${gainMatricule} document(s) en moins\n`);

print("16. Test 2 — Recherche par catégorie :");
print(`    Avant : COLLSCAN, ${explainCategorieAvant.executionStats.totalDocsExamined} docs examinés`);
print(`    Après : IXSCAN, ${explainCategorieApres.executionStats.totalDocsExamined} doc(s) examiné(s)`);
const gainCategorie = explainCategorieAvant.executionStats.totalDocsExamined - explainCategorieApres.executionStats.totalDocsExamined;
print(`    ➜ Gain : ${gainCategorie} document(s) en moins\n`);

print("17. Test 3 — Recherche emprunts avec index composé :");
print(`    Avant : COLLSCAN, ${explainEmpruntsAvant.executionStats.totalDocsExamined} docs examinés`);
print(`    Après : IXSCAN, ${explainEmpruntsApres.executionStats.totalDocsExamined} doc(s) examiné(s)`);
const gainEmprunts = explainEmpruntsAvant.executionStats.totalDocsExamined - explainEmpruntsApres.executionStats.totalDocsExamined;
print(`    ➜ Gain : ${gainEmprunts} document(s) en moins\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5 : TEST SUPPLÉMENTAIRE - RECHERCHE TEXTUELLE
// ═══════════════════════════════════════════════════════════════════════════════

print("--- PHASE 5 : Index textuel (recherche plein texte) ---\n");

// Création d'un index textuel sur le titre des ouvrages
print("18. Création d'index textuel sur ouvrages.titre...");
db.ouvrages.createIndex({ titre: "text", auteur: "text" });
print("    ✓ Index textuel créé\n");

// Test de recherche textuelle
print("19. Recherche textuelle : 'Intelligence' dans titre ou auteur");
const rechercheTexte = db.ouvrages.find(
  { $text: { $search: "Intelligence" } },
  { titre: 1, auteur: 1, score: { $meta: "textScore" }, _id: 0 }
).sort({ score: { $meta: "textScore" } }).toArray();

if (rechercheTexte.length > 0) {
  rechercheTexte.forEach(o => {
    print(`    - ${o.titre} (${o.auteur}) [Score: ${o.score.toFixed(2)}]`);
  });
} else {
  print(`    Aucun résultat`);
}
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// RÉSUMÉ
// ═══════════════════════════════════════════════════════════════════════════════

print("=== Résumé de l'indexation ===");
print("✓ Index simples : matricule, categorie, statut, dateRetourPrevue");
print("✓ Index composés : { adherent: 1, statut: 1 }, { nbDisponibles: 1, totalEmprunts: -1 }");
print("✓ Index unique : matricule (évite les doublons)");
print("✓ Index textuel : recherche plein texte sur titre et auteur");
print("\n📊 Impact des index :");
print("   • Passage de COLLSCAN → IXSCAN");
print("   • Réduction drastique du nombre de documents examinés");
print("   • Amélioration des temps de réponse");
print("\n⚠️  À capturer pour le dossier explain/ :");
print("   • Captures d'écran des explain() avant (COLLSCAN)");
print("   • Captures d'écran des explain() après (IXSCAN)");
print("   • Comparaison des statistiques d'exécution");
print("\n✅ Script terminé avec succès !\n");
