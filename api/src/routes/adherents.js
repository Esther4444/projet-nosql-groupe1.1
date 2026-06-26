import express from 'express';
import { auth, adminOnly } from '../middleware/auth.js';
import Adherent from '../models/Adherent.js';

const router = express.Router();

// Lister tous les adhérents (admin seulement)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { statut } = req.query;
    const filter = statut ? { statut } : {};

    const adherents = await Adherent.find(filter)
      .select('-mot_de_passe -carte')
      .sort({ createdAt: -1 });

    res.json({ adherents });
  } catch (error) {
    console.error('Erreur liste adhérents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des adhérents' });
  }
});

// Détails d'un adhérent (admin seulement)
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const adherent = await Adherent.findById(req.params.id);
    
    if (!adherent) {
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    // Inclure la carte pour validation
    adherent._includeCard = true;
    res.json({ adherent: adherent.toPublicJSON() });
  } catch (error) {
    console.error('Erreur détails adhérent:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'adhérent' });
  }
});

// Valider un adhérent (admin seulement)
router.put('/:id/valider', auth, adminOnly, async (req, res) => {
  try {
    const adherent = await Adherent.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'actif',
        motifRefus: null
      },
      { new: true }
    );

    if (!adherent) {
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    res.json({
      message: 'Adhérent validé avec succès',
      adherent: adherent.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur validation adhérent:', error);
    res.status(500).json({ error: 'Erreur lors de la validation' });
  }
});

// Refuser un adhérent (admin seulement)
router.put('/:id/refuser', auth, adminOnly, async (req, res) => {
  try {
    const { motifRefus } = req.body;

    if (!motifRefus) {
      return res.status(400).json({ error: 'Le motif de refus est requis' });
    }

    const adherent = await Adherent.findByIdAndUpdate(
      req.params.id,
      {
        statut: 'refuse',
        motifRefus
      },
      { new: true }
    );

    if (!adherent) {
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    res.json({
      message: 'Adhérent refusé',
      adherent: adherent.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur refus adhérent:', error);
    res.status(500).json({ error: 'Erreur lors du refus' });
  }
});

// Modifier un adhérent (admin seulement)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nom, prenom, email, role, statut } = req.body;
    
    const adherent = await Adherent.findByIdAndUpdate(
      req.params.id,
      { nom, prenom, email, role, statut },
      { new: true, runValidators: true }
    );

    if (!adherent) {
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    res.json({
      message: 'Adhérent modifié avec succès',
      adherent: adherent.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur modification adhérent:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Supprimer un adhérent (admin seulement)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const adherent = await Adherent.findByIdAndDelete(req.params.id);

    if (!adherent) {
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    res.json({ message: 'Adhérent supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression adhérent:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
