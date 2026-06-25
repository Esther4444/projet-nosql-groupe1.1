import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Adherent from "../models/Adherent.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_change_me_in_prod";

// Inscription (pour les étudiants/enseignants)
router.post("/register", async (req, res) => {
  try {
    const { matricule, nom, prenom, email, mot_de_passe, type, carte } = req.body;
    if (!matricule || !nom || !prenom || !mot_de_passe) {
      return res.status(400).json({ erreur: "Veuillez remplir tous les champs obligatoires." });
    }
    if (!carte || !/^data:image\/(png|jpe?g|webp);base64,/.test(carte)) {
      return res.status(400).json({
        erreur: "Veuillez joindre une carte justificative (image) valide.",
      });
    }
    const typeAdherent = type === "enseignant" ? "enseignant" : "etudiant";

    const existe = await Adherent.findOne({ matricule });
    if (existe) {
      return res.status(409).json({ erreur: "Ce matricule existe déjà." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(mot_de_passe, salt);

    const adherent = new Adherent({
      matricule, nom, prenom, type: typeAdherent, email,
      mot_de_passe: hash,
      role: "membre",
      statut: "inactif",
      carte,
    });
    await adherent.save();

    res.status(201).json({ message: "Inscription réussie. Votre compte est en attente de validation par un administrateur." });
  } catch (e) {
    if (e.name === "ValidationError") return res.status(400).json({ erreur: e.message });
    res.status(500).json({ erreur: "Erreur lors de l'inscription." });
  }
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { matricule, mot_de_passe } = req.body;
    if (!matricule || !mot_de_passe) {
      return res.status(400).json({ erreur: "Matricule et mot de passe requis." });
    }

    const user = await Adherent.findOne({ matricule });
    if (!user) {
      return res.status(401).json({ erreur: "Identifiants incorrects." });
    }

    const match = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!match) {
      return res.status(401).json({ erreur: "Identifiants incorrects." });
    }

    if (user.statut === "refuse") {
      return res.status(403).json({
        erreur: user.motifRefus
          ? `Votre demande d'inscription a été refusée. Motif : ${user.motifRefus}`
          : "Votre demande d'inscription a été refusée par l'administrateur.",
      });
    }

    if (user.statut === "inactif") {
      return res.status(403).json({ erreur: "Votre compte est en attente de validation par un administrateur." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { _id: user._id, matricule: user.matricule, nom: user.nom, prenom: user.prenom, type: user.type, role: user.role } });
  } catch (e) {
    res.status(500).json({ erreur: "Erreur lors de la connexion." });
  }
});

// Récupérer le profil courant
router.get("/me", auth, async (req, res) => {
  try {
    const user = await Adherent.findById(req.user.id).select("-mot_de_passe");
    if (!user) return res.status(401).json({ erreur: "Session expirée — reconnectez-vous." });
    res.json(user);
  } catch (e) {
    res.status(500).json({ erreur: "Erreur serveur." });
  }
});

export default router;
