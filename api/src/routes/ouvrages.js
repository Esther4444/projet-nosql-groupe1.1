import express from 'express';
import { auth, adminOnly } from '../middleware/auth.js';
import { adherentIdEffectif } from '../utils/adherent.js';
import Ouvrage from '../models/Ouvrage.js';

const router = express.Router();

// Lister tous les ouvrages
router.get('/', auth, async (req, res) => {
  try {
    const { categorie, disponible, q } = req.query;
    const filter = {};

    if (categorie) {
      filter.categorie = categorie;
    }

    if (disponible === 'true') {
      filter.nbDisponibles = { $gt: 0 };
    }

    if (q) {
      filter.$text = { $search: q };
    }

    const ouvrages = await Ouvrage.find(filter).sort({ titre: 1 });

    res.json({ ouvrages });
  } catch (error) {
    console.error('Erreur liste ouvrages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des ouvrages' });
  }
});

// Détails d'un ouvrage
router.get('/:id', auth, async (req, res) => {
  try {
    const ouvrage = await Ouvrage.findById(req.params.id);

    if (!ouvrage) {
      return res.status(404).json({ error: 'Ouvrage non trouvé' });
    }

    res.json({ ouvrage });
  } catch (error) {
    console.error('Erreur détails ouvrage:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'ouvrage' });
  }
});

// Créer un ouvrage (admin seulement)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { titre, auteur, annee, editeur, isbn, categorie, exemplaires } = req.body;

    const nbDisponibles = exemplaires?.filter(ex => ex.statut === 'disponible').length || 0;

    const ouvrage = new Ouvrage({
      titre,
      auteur,
      annee,
      editeur,
      isbn,
      categorie,
      exemplaires: exemplaires || [],
      nbDisponibles
    });

    await ouvrage.save();

    res.status(201).json({
      message: 'Ouvrage créé avec succès',
      ouvrage
    });
  } catch (error) {
    console.error('Erreur création ouvrage:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'ouvrage' });
  }
});

// Modifier un ouvrage (admin seulement)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { titre, auteur, annee, editeur, isbn, categorie } = req.body;

    const ouvrage = await Ouvrage.findByIdAndUpdate(
      req.params.id,
      { titre, auteur, annee, editeur, isbn, categorie },
      { new: true, runValidators: true }
    );

    if (!ouvrage) {
      return res.status(404).json({ error: 'Ouvrage non trouvé' });
    }

    res.json({
      message: 'Ouvrage modifié avec succès',
      ouvrage
    });
  } catch (error) {
    console.error('Erreur modification ouvrage:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Supprimer un ouvrage (admin seulement)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const ouvrage = await Ouvrage.findByIdAndDelete(req.params.id);

    if (!ouvrage) {
      return res.status(404).json({ error: 'Ouvrage non trouvé' });
    }

    res.json({ message: 'Ouvrage supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression ouvrage:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Ajouter un exemplaire (admin seulement)
router.post('/:id/exemplaires', auth, adminOnly, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Le code de l\'exemplaire est requis' });
    }

    const ouvrage = await Ouvrage.findById(req.params.id);

    if (!ouvrage) {
      return res.status(404).json({ error: 'Ouvrage non trouvé' });
    }

    // Vérifier que le code n'existe pas déjà
    if (ouvrage.exemplaires.some(ex => ex.code === code)) {
      return res.status(409).json({ error: 'Ce code d\'exemplaire existe déjà' });
    }

    ouvrage.exemplaires.push({
      code,
      statut: 'disponible',
      reservePar: null,
      reserveLe: null
    });
    ouvrage.nbDisponibles += 1;

    await ouvrage.save();

    res.status(201).json({
      message: 'Exemplaire ajouté avec succès',
      ouvrage
    });
  } catch (error) {
    console.error('Erreur ajout exemplaire:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'exemplaire' });
  }
});

// Retirer un exemplaire (admin seulement)
router.delete('/:id/exemplaires/:code', auth, adminOnly, async (req, res) => {
  try {
    const ouvrage = await Ouvrage.findById(req.params.id);

    if (!ouvrage) {
      return res.status(404).json({ error: 'Ouvrage non trouvé' });
    }

    const exemplaire = ouvrage.exemplaires.find(ex => ex.code === req.params.code);

    if (!exemplaire) {
      return res.status(404).json({ error: 'Exemplaire non trouvé' });
    }

    if (exemplaire.statut !== 'disponible') {
      return res.status(400).json({
        error: `Impossible de retirer un exemplaire ${exemplaire.statut}`
      });
    }

    ouvrage.exemplaires = ouvrage.exemplaires.filter(ex => ex.code !== req.params.code);
    ouvrage.nbDisponibles -= 1;

    await ouvrage.save();

    res.json({
      message: 'Exemplaire retiré avec succès',
      ouvrage
    });
  } catch (error) {
    console.error('Erreur retrait exemplaire:', error);
    res.status(500).json({ error: 'Erreur lors du retrait de l\'exemplaire' });
  }
});

// Réserver un exemplaire
router.post('/:id/reserver', auth, async (req, res) => {
  try {
    const adherentId = await adherentIdEffectif(req);

    const ouvrage = await Ouvrage.findOneAndUpdate(
      {
        _id: req.params.id,
        exemplaires: { $elemMatch: { statut: 'disponible' } }
      },
      {
        $set: {
          'exemplaires.$.statut': 'reserve',
          'exemplaires.$.reservePar': adherentId,
          'exemplaires.$.reserveLe': new Date()
        },
        $inc: { nbDisponibles: -1 }
      },
      { new: true }
    );

    if (!ouvrage) {
      return res.status(409).json({
        error: 'Aucun exemplaire disponible pour réservation'
      });
    }

    res.json({
      message: 'Réservation effectuée avec succès',
      ouvrage
    });
  } catch (error) {
    console.error('Erreur réservation:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la réservation' });
  }
});

// Annuler une réservation
router.post('/:id/annuler-reservation', auth, async (req, res) => {
  try {
    const adherentId = await adherentIdEffectif(req);

    const ouvrage = await Ouvrage.findOneAndUpdate(
      {
        _id: req.params.id,
        exemplaires: {
          $elemMatch: {
            statut: 'reserve',
            reservePar: adherentId
          }
        }
      },
      {
        $set: {
          'exemplaires.$.statut': 'disponible',
          'exemplaires.$.reservePar': null,
          'exemplaires.$.reserveLe': null
        },
        $inc: { nbDisponibles: 1 }
      },
      { new: true }
    );

    if (!ouvrage) {
      return res.status(404).json({
        error: 'Aucune réservation trouvée pour cet ouvrage'
      });
    }

    res.json({
      message: 'Réservation annulée avec succès',
      ouvrage
    });
  } catch (error) {
    console.error('Erreur annulation réservation:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'annulation' });
  }
});

export default router;
