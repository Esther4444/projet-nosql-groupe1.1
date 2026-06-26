import mongoose from 'mongoose';

const empruntSchema = new mongoose.Schema({
  ouvrage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ouvrage',
    required: true
  },
  exemplaireCode: {
    type: String,
    required: true
  },
  adherent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Adherent',
    required: true
  },
  ouvrageTitre: {
    type: String,
    required: true
  },
  adherentNom: {
    type: String,
    required: true
  },
  dateEmprunt: {
    type: Date,
    default: Date.now
  },
  dateRetourPrevue: {
    type: Date,
    required: true
  },
  dateRetourEffective: {
    type: Date,
    default: null
  },
  statut: {
    type: String,
    enum: ['en_cours', 'rendu'],
    default: 'en_cours'
  }
}, {
  timestamps: true
});

// Index
empruntSchema.index({ adherent: 1, statut: 1 });
empruntSchema.index({ dateRetourPrevue: 1 });
empruntSchema.index({ ouvrage: 1 });

export default mongoose.model('Emprunt', empruntSchema);
