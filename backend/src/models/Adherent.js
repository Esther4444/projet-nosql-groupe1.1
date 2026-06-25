import mongoose from "mongoose";

// Collection RÉFÉRENCÉE : entité autonome partagée par de nombreux emprunts.
const adherentSchema = new mongoose.Schema({
  matricule: { type: String, required: true, unique: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  type: { type: String, enum: ["etudiant", "enseignant"], required: true },
  email: String,
  mot_de_passe: { type: String, required: true },
  role: { type: String, enum: ["admin", "membre"], default: "membre" },
  // actif = peut se connecter ; inactif = en attente de validation ; refuse = demande rejetée
  statut: { type: String, enum: ["actif", "inactif", "refuse"], default: "actif" },
  // Carte justificative (étudiant ou professionnelle) fournie à l'inscription,
  // stockée en data URL base64. Vérifiée par l'admin avant activation du compte.
  carte: { type: String, default: null },
  // Motif renseigné par l'admin lorsqu'une demande d'inscription est refusée.
  motifRefus: { type: String, default: null },
});

export default mongoose.model("Adherent", adherentSchema);
