import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import Adherent from '../models/Adherent.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Inscription
router.post('/register', [
  body('matricule').notEmpty().trim(),
  body('nom').notEmpty().trim(),
  body('prenom').notEmpty().trim(),
  body('type').isIn(['etudiant', 'enseignant']),
  body('mot_de_passe').isLength({ min: 6 }),
  body('carte').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matricule, nom, prenom, type, email, mot_de_passe, carte } = req.body;

    // Vérifier si le matricule existe déjà
    const existant = await Adherent.findOne({ matricule });
    if (existant) {
      return res.status(409).json({ error: 'Matricule déjà enregistré' });
    }

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(mot_de_passe, 10);

    // Créer l'adhérent (statut inactif par défaut)
    const adherent = new Adherent({
      matricule,
      nom,
      prenom,
      type,
      email,
      mot_de_passe: motDePasseHash,
      carte,
      statut: 'inactif'
    });

    await adherent.save();

    res.status(201).json({
      message: 'Inscription réussie. Votre compte sera activé après validation par un administrateur.',
      adherent: adherent.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Connexion
router.post('/login', [
  body('matricule').notEmpty(),
  body('mot_de_passe').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matricule, mot_de_passe } = req.body;

    // Trouver l'adhérent
    const adherent = await Adherent.findOne({ matricule });
    if (!adherent) {
      return res.status(401).json({ error: 'Matricule ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(mot_de_passe, adherent.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ error: 'Matricule ou mot de passe incorrect' });
    }

    // Vérifier le statut du compte
    if (adherent.statut === 'inactif') {
      return res.status(403).json({
        error: 'Votre compte n\'a pas encore été validé par un administrateur'
      });
    }

    if (adherent.statut === 'refuse') {
      return res.status(403).json({
        error: 'Votre demande d\'inscription a été refusée',
        motifRefus: adherent.motifRefus
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: adherent._id, role: adherent.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      adherent: adherent.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Récupérer le profil de l'utilisateur connecté
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      adherent: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

export default router;
