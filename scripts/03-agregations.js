/**
 * Script 03 : Pipelines d'agrégation
 * 
 * Démontre l'utilisation des opérations d'agrégation MongoDB :
 * $match, $group, $sort, $lookup, $project, $unwind, $count
 * 
 * Utilisation :
 *   mongosh
 *   use biblio_uob
 *   load("scripts/03-agregations.js")
 */

print("\n=== Script 03 : Pipelines d'agrégation ===\n");

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TOP 10 DES OUVRAGES LES PLUS EMPRUNTÉS (Livrable spécifique du thème)
// ═══════════════════════════════════════════════════════════════════════════════

print("1. Top 10 des ouvrages les plus empruntés :");
const topOuvrages = db.ouvrages.aggregate([
  {
    $project: {
      titre: 1,
      auteur: 1,
      totalEmprunts: 1,
      categorie: 1,
    },
  },
  { $sort: { totalEmprunts: -1 } },
  { $limit: 10 },
]).toArray();

topOuvrages.forEach((o, i) => {
  print(`   ${i + 1}. ${o.titre} - ${o.totalEmprunts} emprunts [${o.categorie}]`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 2. STATISTIQUES PAR CATÉGORIE
// ═══════════════════════════════════════════════════════════════════════════════

print("2. Statistiques par catégorie :");
const statsCat = db.ouvrages.aggregate([
  {
    $group: {
      _id: "$categorie",
      nbOuvrages: { $sum: 1 },
      totalEmprunts: { $sum: "$totalEmprunts" },
      exemplairesDisponibles: { $sum: "$nbDisponibles" },
    },
  },
  { $sort: { totalEmprunts: -1 } },
]).toArray();

statsCat.forEach(c => {
  print(`   - ${c._id} :`);
  print(`       ${c.nbOuvrages} ouvrage(s), ${c.totalEmprunts} emprunts, ${c.exemplairesDisponibles} dispo`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 3. NOMBRE D'EMPRUNTS PAR ADHÉRENT
// ═══════════════════════════════════════════════════════════════════════════════

print("3. Top 5 des adhérents les plus actifs :");
const topAdherents = db.emprunts.aggregate([
  {
    $group: {
      _id: "$adherentNom",
      nbEmprunts: { $sum: 1 },
      enCours: {
        $sum: { $cond: [{ $eq: ["$statut", "en_cours"] }, 1, 0] },
      },
    },
  },
  { $sort: { nbEmprunts: -1 } },
  { $limit: 5 },
]).toArray();

topAdherents.forEach((a, i) => {
  print(`   ${i + 1}. ${a._id} : ${a.nbEmprunts} emprunt(s) dont ${a.enCours} en cours`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 4. JOINTURE : EMPRUNTS AVEC DÉTAILS ADHÉRENT ($lookup)
// ═══════════════════════════════════════════════════════════════════════════════

print("4. Emprunts en cours avec détails adhérent (jointure) :");
const empruntsDetailles = db.emprunts.aggregate([
  { $match: { statut: "en_cours" } },
  {
    $lookup: {
      from: "adherents",
      localField: "adherent",
      foreignField: "_id",
      as: "detailAdherent",
    },
  },
  { $unwind: "$detailAdherent" },
  {
    $project: {
      ouvrageTitre: 1,
      adherentNom: "$detailAdherent.nom",
      adherentPrenom: "$detailAdherent.prenom",
      adherentType: "$detailAdherent.type",
      dateRetourPrevue: 1,
    },
  },
  { $sort: { dateRetourPrevue: 1 } },
  { $limit: 5 },
]).toArray();

empruntsDetailles.forEach(e => {
  const date = e.dateRetourPrevue.toISOString().split('T')[0];
  print(`   - "${e.ouvrageTitre}"`);
  print(`     Emprunteur : ${e.adherentPrenom} ${e.adherentNom} (${e.adherentType})`);
  print(`     Retour prévu : ${date}`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 5. STATISTIQUES DES EMPRUNTS PAR MOIS
// ═══════════════════════════════════════════════════════════════════════════════

print("5. Emprunts par mois (2026) :");
const empruntsParMois = db.emprunts.aggregate([
  {
    $match: {
      dateEmprunt: {
        $gte: new Date("2026-01-01"),
        $lt: new Date("2027-01-01"),
      },
    },
  },
  {
    $group: {
      _id: { $month: "$dateEmprunt" },
      nbEmprunts: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
]).toArray();

const mois = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
empruntsParMois.forEach(m => {
  print(`   - ${mois[m._id - 1]} 2026 : ${m.nbEmprunts} emprunt(s)`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 6. MOYENNE DES EXEMPLAIRES PAR OUVRAGE
// ═══════════════════════════════════════════════════════════════════════════════

print("6. Statistiques sur les exemplaires :");
const statsExemplaires = db.ouvrages.aggregate([
  {
    $group: {
      _id: null,
      nbTotalExemplaires: { $sum: { $size: "$exemplaires" } },
      moyenneParOuvrage: { $avg: { $size: "$exemplaires" } },
      maxExemplaires: { $max: { $size: "$exemplaires" } },
      minExemplaires: { $min: { $size: "$exemplaires" } },
    },
  },
]).toArray()[0];

print(`   - Total exemplaires : ${statsExemplaires.nbTotalExemplaires}`);
print(`   - Moyenne par ouvrage : ${statsExemplaires.moyenneParOuvrage.toFixed(2)}`);
print(`   - Max : ${statsExemplaires.maxExemplaires} | Min : ${statsExemplaires.minExemplaires}`);
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 7. OUVRAGES LES PLUS DEMANDÉS (avec réservations simulées)
// ═══════════════════════════════════════════════════════════════════════════════

print("7. Ouvrages avec exemplaires réservés :");
const ouvragesReserves = db.ouvrages.aggregate([
  { $unwind: "$exemplaires" },
  { $match: { "exemplaires.statut": "reserve" } },
  {
    $group: {
      _id: "$_id",
      titre: { $first: "$titre" },
      nbReservations: { $sum: 1 },
    },
  },
  { $sort: { nbReservations: -1 } },
]).toArray();

if (ouvragesReserves.length > 0) {
  ouvragesReserves.forEach(o => {
    print(`   - ${o.titre} : ${o.nbReservations} réservation(s)`);
  });
} else {
  print(`   Aucun ouvrage actuellement réservé`);
}
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 8. EMPRUNTS EN RETARD AVEC CALCUL DU NOMBRE DE JOURS
// ═══════════════════════════════════════════════════════════════════════════════

print("8. Emprunts en retard :");
const empruntsRetard = db.emprunts.aggregate([
  {
    $match: {
      statut: "en_cours",
      dateRetourPrevue: { $lt: new Date() },
    },
  },
  {
    $project: {
      ouvrageTitre: 1,
      adherentNom: 1,
      dateRetourPrevue: 1,
      joursRetard: {
        $divide: [
          { $subtract: [new Date(), "$dateRetourPrevue"] },
          1000 * 60 * 60 * 24,
        ],
      },
    },
  },
  { $sort: { joursRetard: -1 } },
]).toArray();

if (empruntsRetard.length > 0) {
  empruntsRetard.forEach(e => {
    const jours = Math.floor(e.joursRetard);
    print(`   - "${e.ouvrageTitre}" par ${e.adherentNom} : ${jours} jour(s) de retard`);
  });
} else {
  print(`   ✓ Aucun emprunt en retard`);
}
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 9. ADHÉRENTS SANS AUCUN EMPRUNT (LEFT JOIN avec $lookup et filtre)
// ═══════════════════════════════════════════════════════════════════════════════

print("9. Adhérents n'ayant jamais emprunté :");
const adherentsSansEmprunt = db.adherents.aggregate([
  {
    $lookup: {
      from: "emprunts",
      localField: "_id",
      foreignField: "adherent",
      as: "emprunts",
    },
  },
  {
    $match: {
      emprunts: { $size: 0 },
      statut: "actif",
    },
  },
  {
    $project: {
      nom: 1,
      prenom: 1,
      matricule: 1,
      type: 1,
    },
  },
  { $limit: 5 },
]).toArray();

if (adherentsSansEmprunt.length > 0) {
  adherentsSansEmprunt.forEach(a => {
    print(`   - ${a.prenom} ${a.nom} (${a.matricule}) - ${a.type}`);
  });
} else {
  print(`   Tous les adhérents actifs ont au moins un emprunt`);
}
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 10. RÉPARTITION DES ADHÉRENTS PAR TYPE ET STATUT
// ═══════════════════════════════════════════════════════════════════════════════

print("10. Répartition des adhérents par type et statut :");
const repartitionAdherents = db.adherents.aggregate([
  {
    $group: {
      _id: { type: "$type", statut: "$statut" },
      count: { $sum: 1 },
    },
  },
  { $sort: { "_id.type": 1, "_id.statut": 1 } },
]).toArray();

repartitionAdherents.forEach(r => {
  print(`   - ${r._id.type} (${r._id.statut}) : ${r.count}`);
});
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// 11. TAUX DE RETOUR À TEMPS
// ═══════════════════════════════════════════════════════════════════════════════

print("11. Taux de retour dans les délais :");
const tauxRetour = db.emprunts.aggregate([
  { $match: { statut: "rendu" } },
  {
    $group: {
      _id: null,
      totalRendus: { $sum: 1 },
      aTemps: {
        $sum: {
          $cond: [{ $lte: ["$dateRetourEffective", "$dateRetourPrevue"] }, 1, 0],
        },
      },
    },
  },
  {
    $project: {
      totalRendus: 1,
      aTemps: 1,
      tauxPourcentage: {
        $multiply: [{ $divide: ["$aTemps", "$totalRendus"] }, 100],
      },
    },
  },
]).toArray();

if (tauxRetour.length > 0) {
  const stats = tauxRetour[0];
  print(`   ${stats.aTemps} / ${stats.totalRendus} à temps (${stats.tauxPourcentage.toFixed(1)}%)`);
} else {
  print(`   Aucun emprunt rendu pour calculer le taux`);
}
print("");

// ═══════════════════════════════════════════════════════════════════════════════
// RÉSUMÉ
// ═══════════════════════════════════════════════════════════════════════════════

print("=== Résumé des agrégations ===");
print("✓ $match : filtrage des documents");
print("✓ $group : regroupement et calculs ($sum, $avg, $max, $min)");
print("✓ $sort : tri des résultats");
print("✓ $lookup : jointures entre collections");
print("✓ $unwind : décomposition de tableaux");
print("✓ $project : projection et calculs complexes");
print("✓ $limit : limitation du nombre de résultats");
print("✓ Expressions conditionnelles : $cond");
print("✓ Opérations sur dates : $month, $subtract");
print("\n✅ Script terminé avec succès !\n");
