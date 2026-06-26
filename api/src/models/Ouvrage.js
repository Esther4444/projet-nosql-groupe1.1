import mongoose from 'mongoose';

const exemplaireSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  statut: {
    type: String,
    enum: ['disponible', 'reserve', 'emprunte'],
    default: 'disponible'
  },
  reservePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adherent',
    default: null
  },
  reserveLe: {
    type: Date,
    default: null
  }
}, { _id: false });

const ouvrageSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true
  },
  auteur: {
    type: String,
    required: true,
    trim: true
  },
  annee: {
    type: Number,
    required: true
  },
  editeur: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    trim: true
  },
  categorie: {
    type: String,
    required: true,
    trim: true
  },
  nbDisponibles: {
    type: Number,
    default: 0
  },
  totalEmprunts: {
    type: Number,
    default: 0
  },
  exemplaires: [exemplaireSchema]
}, {
  timestamps: true
});

// Index
ouvrageSchema.index({ categorie: 1 });
ouvrageSchema.index({ nbDisponibles: 1, totalEmprunts: -1 });
ouvrageSchema.index({ titre: 'text', auteur: 'text' });

export default mongoose.model('Ouvrage', ouvrageSchema);
