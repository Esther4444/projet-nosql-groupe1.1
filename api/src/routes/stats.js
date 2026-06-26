import express from 'express';
import { auth, adminOnly } from '../middleware/auth.js';
import Adherent from '../models/Adherent.js';
import Ouvrage from '../models/Ouvrage.js';
import Emprunt from '../models/Emprunt.js';

const router = express.Router();

// Statistiques générales (admin seulement)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const stats = await Promise.all([
      // Nombre total d'adhérents actifs
      Adherent.countDocuments({ statut: 'actif' }),
      
      // Nombre d'adhérents en attente
      Adherent.countDocuments({ statut: 'inactif' }),
      
      // Nombre total d'ouvrages
      Ouvrage.countDocuments(),
      
      // Nombre d'exemplaires disponibles
      Ouvrage.aggregate([
        { $group: { _id: null, total: { $sum: '$nbDisponibles' } } }
      ]),
      
      // Nombre d'emprunts en cours
      Emprunt.countDocuments({ statut: 'en_cours' }),
      
      // Nombre d'emprunts en retard
      Emprunt.countDocuments({
        statut: 'en_cours',
        dateRetourPrevue: { $lt: new Date() }
      })
    ]);

    res.json({
      adherentsActifs: stats[0],
      adherentsEnAttente: stats[1],
      ouvrages: stats[2],
      exemplairesDisponibles: stats[3][0]?.total || 0,
      empruntsEnCours: stats[4],
      empruntsEnRetard: stats[5]
    });
  } catch (error) {
    console.error('Erreur stats générales:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// Top 10 des ouvrages les plus empruntés
router.get('/top-ouvrages', auth, adminOnly, async (req, res) => {
  try {
    const topOuvrages = await Ouvrage.find()
      .select('titre auteur categorie totalEmprunts')
      .sort({ totalEmprunts: -1 })
      .limit(10);

    res.json({ topOuvrages });
  } catch (error) {
    console.error('Erreur top ouvrages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du top ouvrages' });
  }
});

// Statistiques par catégorie
router.get('/categories', auth, adminOnly, async (req, res) => {
  try {
    const statsCategories = await Ouvrage.aggregate([
      {
        $group: {
          _id: '$categorie',
          nbOuvrages: { $sum: 1 },
          totalEmprunts: { $sum: '$totalEmprunts' },
          exemplairesDisponibles: { $sum: '$nbDisponibles' }
        }
      },
      { $sort: { totalEmprunts: -1 } }
    ]);

    res.json({ statsCategories });
  } catch (error) {
    console.error('Erreur stats catégories:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des stats par catégorie' });
  }
});

// Emprunts par mois (année en cours)
router.get('/emprunts-mois', auth, adminOnly, async (req, res) => {
  try {
    const anneeEnCours = new Date().getFullYear();
    
    const empruntsParMois = await Emprunt.aggregate([
      {
        $match: {
          dateEmprunt: {
            $gte: new Date(`${anneeEnCours}-01-01`),
            $lt: new Date(`${anneeEnCours + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$dateEmprunt' },
          nbEmprunts: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ empruntsParMois });
  } catch (error) {
    console.error('Erreur emprunts par mois:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des emprunts par mois' });
  }
});

// Top 5 adhérents les plus actifs
router.get('/top-adherents', auth, adminOnly, async (req, res) => {
  try {
    const topAdherents = await Emprunt.aggregate([
      {
        $group: {
          _id: '$adherent',
          nbEmprunts: { $sum: 1 },
          enCours: {
            $sum: { $cond: [{ $eq: ['$statut', 'en_cours'] }, 1, 0] }
          }
        }
      },
      { $sort: { nbEmprunts: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'adherents',
          localField: '_id',
          foreignField: '_id',
          as: 'adherent'
        }
      },
      { $unwind: '$adherent' },
      {
        $project: {
          nom: '$adherent.nom',
          prenom: '$adherent.prenom',
          matricule: '$adherent.matricule',
          type: '$adherent.type',
          nbEmprunts: 1,
          enCours: 1
        }
      }
    ]);

    res.json({ topAdherents });
  } catch (error) {
    console.error('Erreur top adhérents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du top adhérents' });
  }
});

export default router;
