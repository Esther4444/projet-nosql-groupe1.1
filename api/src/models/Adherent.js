import mongoose from 'mongoose';

const adherentSchema = new mongoose.Schema({
  matricule: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['etudiant', 'enseignant'],
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  mot_de_passe: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'membre'],
    default: 'membre'
  },
  statut: {
    type: String,
    enum: ['actif', 'inactif', 'refuse'],
    default: 'inactif'
  },
  carte: {
    type: String // Base64 image
  },
  motifRefus: {
    type: String
  }
}, {
  timestamps: true
});

// Index
adherentSchema.index({ matricule: 1 }, { unique: true });
adherentSchema.index({ statut: 1 });

// Méthode pour exclure le mot de passe
adherentSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.mot_de_passe;
  // Exclure la carte dans les listes (trop volumineuse)
  if (!this._includeCard) {
    delete obj.carte;
  }
  return obj;
};

export default mongoose.model('Adherent', adherentSchema);
