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
  statut: { type: String, enum: ["actif", "inactif"], default: "actif" },
});

export default mongoose.model("Adherent", adherentSchema);
