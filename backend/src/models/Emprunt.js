import mongoose from "mongoose";

// Collection RÉFÉRENCÉE : historique non borné (anti-pattern unbounded array
// si on l'embarquait dans l'ouvrage). Donnée d'événement, idéale pour l'agrégation.
const empruntSchema = new mongoose.Schema({
  ouvrage: { type: mongoose.Schema.Types.ObjectId, ref: "Ouvrage", required: true },
  exemplaireCode: { type: String, required: true },
  adherent: { type: mongoose.Schema.Types.ObjectId, ref: "Adherent", required: true },
  // Dénormalisation de lecture (évite les $lookup sur les listes) :
  ouvrageTitre: String,
  adherentNom: String,
  dateEmprunt: { type: Date, default: Date.now },
  dateRetourPrevue: { type: Date, required: true },
  dateRetourEffective: { type: Date, default: null },
  statut: { type: String, enum: ["en_cours", "rendu"], default: "en_cours" },
});

empruntSchema.index({ ouvrage: 1 });
empruntSchema.index({ adherent: 1, statut: 1 });

export default mongoose.model("Emprunt", empruntSchema);
