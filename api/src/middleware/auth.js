import jwt from 'jsonwebtoken';
import Adherent from '../models/Adherent.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adherent = await Adherent.findById(decoded.id);

    if (!adherent) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    if (adherent.statut !== 'actif') {
      return res.status(403).json({
        error: 'Compte non actif',
        statut: adherent.statut,
        ...(adherent.statut === 'refuse' && { motifRefus: adherent.motifRefus })
      });
    }

    req.user = adherent;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Accès réservé aux administrateurs'
    });
  }
  next();
};
