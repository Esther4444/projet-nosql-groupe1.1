import express from 'express';
import { auth, adminOnly } from '../middleware/auth.js';
import { adherentIdEffectif } from '../utils/adherent.js';
import Emprunt from '../models/Emprunt.js';
import Ouvrage from '../models/Ouvrage.js';
import Adherent from '../models/Adherent.js';

const router = express.Router();

// Lister les emprunts
router.get('/', auth, async (req, res) => {
  try {
    const { statut, q } = req.query;
    const filter = {};

    // Filtrer par statut
    if (statut) {
      filter.statut = statut;
    }

    // Si non-admin, ne voir que ses propres emprunts
    if (req.user.role !== 'admin') {
      filter.adherent = req.user._id;
    }

    // Recherche textuelle
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { ouvrageTitre: regex },
        { adherentNom: regex },
        { exemplaireCode: regex }
      ];
    }

    const emprunts = await Emprunt.find(filter)
      .sort({ dateEmprunt: -1 })
      .populate('adherent', 'nom prenom matricule type')
      .populate('ouvrage', 'titre auteur categorie');

    res.json({ emprunts });
  } catch (error) {
    console.error('Erreur liste emprunts:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des emprunts' });
  }
});

// Créer un emprunt (admin seulement)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { ouvrageId, adherentId, exemplaireCode } = req.body;

    if (!ouvrageId || !adherentId) {
      return res.status(400).json({
        error: 'ouvrageId et adherentId sont requis'
      });
    }

    // Récupérer l'ouvrage
    const ouvrage = await Ouvrage.findById(ouvrageId);
    if (!ouvrage) {
      return res.status(404).json({ error: 'Ouvrage non trouvé' });
    }

    // Récupérer l'adhérent
    const adherent = await Adherent.findById(adherentId);
    if (!adherent) {
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    if (adherent.statut !== 'actif') {
      return res.status(400).json({ error: 'Adhérent non actif' });
    }

    // Déterminer l'exemplaire (soit spécifié, soit le premier disponible/réservé)
    let exemplaire;
    if (exemplaireCode) {
      exemplaire = ouvrage.exemplaires.find(ex => ex.code === exemplaireCode);
      if (!exemplaire) {
        return res.status(404).json({ error: 'Exemplaire non trouvé' });
      }
      if (!['disponible', 'reserve'].includes(exemplaire.statut)) {
        return res.status(400).json({
          error: `Exemplaire ${exemplaire.statut}, impossible d'emprunter`
        });
      }
    } else {
      exemplaire = ouvrage.exemplaires.find(
        ex => ex.statut === 'disponible' || ex.statut === 'reserve'
      );
      if (!exemplaire) {
        return res.status(400).json({
          error: 'Aucun exemplaire disponible ou réservé'
        });
      }
    }

    // Calculer la date de retour prévue
    const dureeJours = adherent.type === 'enseignant' ? 30 : 14;
    const dateRetourPrevue = new Date();
    dateRetourPrevue.setDate(dateRetourPrevue.getDate() + dureeJours);

    // Marquer l'exemplaire comme emprunté (requête atomique)
    const ouvrageModifie = await Ouvrage.findOneAndUpdate(
      {
        _id: ouvrageId,
        'exemplaires.code': exemplaire.code,
        'exemplaires.statut': { $in: ['disponible', 'reserve'] }
      },
      {
        $set: { 'exemplaires.$.statut': 'emprunte' },
        $inc: {
          nbDisponibles: exemplaire.statut === 'disponible' ? -1 : 0,
          totalEmprunts: 1
        }
      },
      { new: true }
    );

    if (!ouvrageModifie) {
      return res.status(409).json({
        error: 'Conflit : l\'exemplaire n\'est plus disponible'
      });
    }

    // Créer l'emprunt
    let emprunt;
    try {
      emprunt = await Emprunt.create({
        ouvrage: ouvrageId,
        exemplaireCode: exemplaire.code,
        adherent: adherentId,
        ouvrageTitre: ouvrage.titre,
        adherentNom: `${adherent.prenom} ${adherent.nom}`,
        dateRetourPrevue
      });
    } catch (empruntError) {
      // ROLLBACK : remettre l'exemplaire disponible
      await Ouvrage.updateOne(
        { _id: ouvrageId, 'exemplaires.code': exemplaire.code },
        {
          $set: { 'exemplaires.$.statut': exemplaire.statut },
          $inc: {
            nbDisponibles: exemplaire.statut === 'disponible' ? 1 : 0,
            totalEmprunts: -1
          }
        }
      );
      throw empruntError;
    }

    res.status(201).json({
      message: 'Emprunt créé avec succès',
      emprunt
    });
  } catch (error) {
    console.error('Erreur création emprunt:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'emprunt' });
  }
});

// Retourner un emprunt (admin seulement)
router.put('/:id/retourner', auth, adminOnly, async (req, res) => {
  try {
    const emprunt = await Emprunt.findById(req.params.id);

    if (!emprunt) {
      return res.status(404).json({ error: 'Emprunt non trouvé' });
    }

    if (emprunt.statut === 'rendu') {
      return res.status(400).json({ error: 'Emprunt déjà retourné' });
    }

    // Marquer l'exemplaire comme disponible
    await Ouvrage.updateOne(
      { _id: emprunt.ouvrage, 'exemplaires.code': emprunt.exemplaireCode },
      {
        $set: { 'exemplaires.$.statut': 'disponible' },
        $inc: { nbDisponibles: 1 }
      }
    );

    // Mettre à jour l'emprunt
    emprunt.statut = 'rendu';
    emprunt.dateRetourEffective = new Date();
    await emprunt.save();

    res.json({
      message: 'Retour enregistré avec succès',
      emprunt
    });
  } catch (error) {
    console.error('Erreur retour emprunt:', error);
    res.status(500).json({ error: 'Erreur lors du retour' });
  }
});

// Emprunts en retard (admin seulement)
router.get('/retards', auth, adminOnly, async (req, res) => {
  try {
    const empruntsRetard = await Emprunt.find({
      statut: 'en_cours',
      dateRetourPrevue: { $lt: new Date() }
    })
      .sort({ dateRetourPrevue: 1 })
      .populate('adherent', 'nom prenom matricule type email')
      .populate('ouvrage', 'titre auteur');

    res.json({ empruntsRetard });
  } catch (error) {
    console.error('Erreur emprunts en retard:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des retards' });
  }
});

export default router;
