/**
 * Démonstration du défi technique : empêcher la double réservation.
 * Prérequis : backend démarré (http://localhost:4000) et `npm run seed` effectué.
 * Lancer : node test-concurrence.js
 */
const API = "http://localhost:4000/api";

async function json(path, options = {}, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { headers, ...options });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// Connexion admin (créé par seed.js)
const login = await json("/auth/login", {
  method: "POST",
  body: JSON.stringify({ matricule: "ADMIN-001", mot_de_passe: "password123" }),
});
if (!login.body.token) {
  console.error("❌ Connexion échouée — démarrez le backend et lancez npm run seed");
  process.exit(1);
}
const token = login.body.token;

const ouvrages = (await json("/ouvrages", {}, token)).body;
const adherents = (await json("/adherents", {}, token)).body;
const membres = adherents.filter((a) => a.role !== "admin");

const ouvrage = ouvrages.find((o) => o.exemplaires.some((e) => e.statut === "disponible"));
const exemplaire = ouvrage.exemplaires.find((e) => e.statut === "disponible");

console.log(`\n=== Test 1 : 10 réservations SIMULTANÉES sur ${ouvrage.titre} / ${exemplaire.code} ===`);
const reservations = await Promise.all(
  Array.from({ length: 10 }, (_, i) =>
    json(`/ouvrages/${ouvrage._id}/exemplaires/${exemplaire.code}/reserver`, {
      method: "POST",
      body: JSON.stringify({ adherentId: membres[i % membres.length]._id }),
    }, token)
  )
);
const ok = reservations.filter((r) => r.status === 200).length;
const conflits = reservations.filter((r) => r.status === 409).length;
console.log(`Réussites : ${ok} (attendu : 1) | Conflits 409 : ${conflits} (attendu : 9)`);
console.log(ok === 1 && conflits === 9 ? "✅ Aucune double réservation possible." : "❌ PROBLÈME de concurrence !");

console.log(`\n=== Test 2 : 10 emprunts SIMULTANÉS, exemplaires limités ===`);
const cible = ouvrages.find((o) => o._id !== ouvrage._id);
const dispo = cible.nbDisponibles;
const emprunts = await Promise.all(
  Array.from({ length: 10 }, (_, i) =>
    json("/emprunts", {
      method: "POST",
      body: JSON.stringify({ ouvrageId: cible._id, adherentId: membres[i % membres.length]._id }),
    }, token)
  )
);
const ok2 = emprunts.filter((r) => r.status === 201).length;
const refus = emprunts.filter((r) => r.status === 409).length;
console.log(`Ouvrage "${cible.titre}" : ${dispo} exemplaire(s) disponible(s).`);
console.log(`Emprunts acceptés : ${ok2} (attendu : ${dispo}) | Refus 409 : ${refus} (attendu : ${10 - dispo})`);
console.log(ok2 === dispo ? "✅ Impossible d'emprunter plus que le stock disponible." : "❌ PROBLÈME de concurrence !");
