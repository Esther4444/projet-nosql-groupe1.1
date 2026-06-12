import dotenv from "dotenv";
import { connectDB } from "./db.js";
import bcrypt from "bcryptjs";
import Ouvrage from "./models/Ouvrage.js";
import Adherent from "./models/Adherent.js";
import Emprunt from "./models/Emprunt.js";

dotenv.config();
await connectDB();

await Promise.all([Ouvrage.deleteMany({}), Adherent.deleteMany({}), Emprunt.deleteMany({})]);

const defaultPassword = await bcrypt.hash("password123", 10);

const adherents = await Adherent.insertMany([
  { matricule: "ADMIN-001", nom: "Bibliothécaire", prenom: "Chef", type: "enseignant", email: "admin@uob.ga", mot_de_passe: defaultPassword, role: "admin", statut: "actif" },
  { matricule: "UOB-ET-2024-101", nom: "MALEMBA", prenom: "Esther Lydie", type: "etudiant", email: "e.malemba@uob.ga", mot_de_passe: defaultPassword, role: "membre", statut: "actif" },
  { matricule: "UOB-ET-2024-102", nom: "OUSMANE-MOANDA", prenom: "Ali", type: "etudiant", email: "a.ousmane@uob.ga", mot_de_passe: defaultPassword, role: "membre", statut: "actif" },
  { matricule: "UOB-EN-2019-007", nom: "NDONG EYEGHE", prenom: "Georges", type: "enseignant", email: "g.ndong@uob.ga", mot_de_passe: defaultPassword, role: "membre", statut: "actif" },
]);

const mkEx = (prefix, n) =>
  Array.from({ length: n }, (_, i) => ({
    code: `${prefix}-${String.fromCharCode(65 + i)}`,
    etat: "bon",
    statut: "disponible",
  }));

const data = [
  { titre: "Une vie de boy", auteur: "Ferdinand Oyono", annee: 1956, categorie: "Littérature africaine", ex: 3 },
  { titre: "L'Enfant noir", auteur: "Camara Laye", annee: 1953, categorie: "Littérature africaine", ex: 2 },
  { titre: "Le Vieux Nègre et la Médaille", auteur: "Ferdinand Oyono", annee: 1956, categorie: "Littérature africaine", ex: 2 },
  { titre: "Introduction aux bases de données NoSQL", auteur: "P. Martin", annee: 2021, categorie: "Informatique", ex: 4 },
  { titre: "Algorithmique et structures de données", auteur: "T. Cormen", annee: 2009, categorie: "Informatique", ex: 3 },
  { titre: "Histoire du Gabon", auteur: "Nicolas Metegue N'nah", annee: 2006, categorie: "Histoire", ex: 2 },
  { titre: "Économie du développement", auteur: "D. Ray", annee: 1998, categorie: "Économie", ex: 2 },
];

const ouvrages = await Ouvrage.insertMany(
  data.map((d, i) => ({
    titre: d.titre, auteur: d.auteur, annee: d.annee, categorie: d.categorie,
    isbn: `978-2-000-0000${i}`,
    exemplaires: mkEx(`UOB-${String(i + 1).padStart(4, "0")}`, d.ex),
    nbDisponibles: d.ex,
  }))
);

// Historique d'emprunts rendus (pour alimenter le top 10)
const emprunts = [];
for (let i = 0; i < ouvrages.length; i++) {
  const nb = [9, 6, 4, 12, 7, 3, 2][i];
  for (let j = 0; j < nb; j++) {
    // on évite l'admin pour l'historique d'emprunts de test
    const adh = adherents[(j % (adherents.length - 1)) + 1]; 
    const ouv = ouvrages[i];
    const d = new Date(Date.now() - (j + 1) * 5 * 24 * 3600 * 1000);
    emprunts.push({
      ouvrage: ouv._id,
      exemplaireCode: ouv.exemplaires[0].code,
      adherent: adh._id,
      ouvrageTitre: ouv.titre,
      adherentNom: `${adh.prenom} ${adh.nom}`,
      dateEmprunt: d,
      dateRetourPrevue: new Date(d.getTime() + 14 * 24 * 3600 * 1000),
      dateRetourEffective: new Date(d.getTime() + 10 * 24 * 3600 * 1000),
      statut: "rendu",
    });
  }
  await Ouvrage.updateOne({ _id: ouvrages[i]._id }, { $set: { totalEmprunts: nb } });
}
await Emprunt.insertMany(emprunts);

console.log(`Seed OK : ${ouvrages.length} ouvrages, ${adherents.length} adhérents (dont 1 admin, mdp: password123), ${emprunts.length} emprunts (historique).`);
process.exit(0);
