import mongoose from 'mongoose';
import Adherent from '../models/Adherent.js';

export const toObjectId = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  return null;
};

export const resolveAdherent = async (identifier) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return await Adherent.findById(identifier);
  }
  return await Adherent.findOne({ matricule: identifier });
};

export const adherentIdEffectif = async (req) => {
  if (req.user.role === 'admin' && req.body.adherentId) {
    const adherent = await resolveAdherent(req.body.adherentId);
    if (!adherent) {
      throw new Error('Adhérent non trouvé');
    }
    if (adherent.statut !== 'actif') {
      throw new Error('Adhérent non actif');
    }
    return adherent._id;
  }
  return req.user._id;
};
