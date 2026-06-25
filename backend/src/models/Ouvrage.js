import mongoose from "mongoose";

// Sous-document EMBARQUÉ : un exemplaire physique d'un ouvrage.
// Justification : cardinalité bornée (quelques exemplaires par ouvrage),
// lu avec l'ouvrage, et surtout mis à jour ATOMIQUEMENT avec les compteurs.
const exemplaireSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },            // ex. UOB-0001-A
    etat: { type: String, enum: ["neuf", "bon", "use"], default: "bon" },
    statut: {
      type: String,
      enum: ["disponible", "emprunte", "reserve"],
      default: "disponible",
    },
    reservePar: { type: mongoose.Schema.Types.ObjectId, ref: "Adherent", default: null },
    reserveLe: { type: Date, default: null },
  },
  { _id: false }
);

const ouvrageSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  auteur: { type: String, required: true },
  isbn: String,
  annee: Number,
  categorie: String,
  description: String,
  // Compteurs dénormalisés (pattern "computed"), maintenus via $inc
  nbDisponibles: { type: Number, default: 0 },
  totalEmprunts: { type: Number, default: 0 },
  exemplaires: [exemplaireSchema],
});

ouvrageSchema.index({ "exemplaires.code": 1 });
ouvrageSchema.index({ titre: "text", auteur: "text" });

export default mongoose.model("Ouvrage", ouvrageSchema);
