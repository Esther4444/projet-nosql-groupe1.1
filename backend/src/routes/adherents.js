import { Router } from "express";
import Adherent from "../models/Adherent.js";
import Emprunt from "../models/Emprunt.js";
import { adminOnly } from "../middlewares/role.js";
import bcrypt from "bcryptjs";

const router = Router();

// ── GET /api/adherents ─────────────────────────────────────────────────────────
router.get("/", adminOnly, async (req, res, next) => {
  try {
    const filtre = {};
    if (req.query.type) filtre.type = req.query.type;
    if (req.query.q) {
      filtre.$or = [
        { nom:       new RegExp(req.query.q, "i") },
        { prenom:    new RegExp(req.query.q, "i") },
        { matricule: new RegExp(req.query.q, "i") },
      ];
    }
    const adherents = await Adherent.find(filtre).sort({ nom: 1 });
    res.json(adherents);
  } catch (e) { next(e); }
});

// ── GET /api/adherents/:id — détail d'un adhérent ─────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ erreur: "Accès refusé" });
    }
    const adherent = await Adherent.findById(req.params.id);
    if (!adherent) return res.status(404).json({ erreur: "Adhérent introuvable" });
    res.json(adherent);
  } catch (e) { next(e); }
});

// ── GET /api/adherents/:id/emprunts — historique des emprunts d'un adhérent ───
router.get("/:id/emprunts", async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ erreur: "Accès refusé" });
    }
    const { statut, page = 1, limit = 20 } = req.query;
    const filtre = { adherent: req.params.id };
    if (statut) filtre.statut = statut;

    const skip = (Number(page) - 1) * Number(limit);
    const [emprunts, total] = await Promise.all([
      Emprunt.find(filtre).sort({ dateEmprunt: -1 }).skip(skip).limit(Number(limit)),
      Emprunt.countDocuments(filtre),
    ]);

    res.json({ emprunts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
});

// ── POST /api/adherents ────────────────────────────────────────────────────────
router.post("/", adminOnly, async (req, res, next) => {
  try {
    const { matricule, nom, prenom, type, email, role } = req.body;
    if (!matricule || !nom || !prenom || !type) {
      return res.status(400).json({ erreur: "matricule, nom, prenom et type sont requis" });
    }
    const hash = await bcrypt.hash("password123", 10);
    const adherent = await Adherent.create({ 
      matricule, nom, prenom, type, email, 
      mot_de_passe: hash,
      role: role || "membre",
      statut: "actif" // L'admin crée des comptes actifs par défaut
    });
    res.status(201).json(adherent);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ erreur: "Matricule déjà existant" });
    next(e);
  }
});

// ── PUT /api/adherents/:id/valider — Activer un compte inactif (Admin) ────────
router.put("/:id/valider", adminOnly, async (req, res, next) => {
  try {
    const adherent = await Adherent.findByIdAndUpdate(
      req.params.id,
      { $set: { statut: "actif" } },
      { new: true }
    );
    if (!adherent) return res.status(404).json({ erreur: "Adhérent introuvable" });
    res.json(adherent);
  } catch (e) { next(e); }
});

// ── PUT /api/adherents/:id — modifier un adhérent ─────────────────────────────
router.put("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ erreur: "Accès refusé" });
    }
    const { nom, prenom, type, email } = req.body;
    const adherent = await Adherent.findByIdAndUpdate(
      req.params.id,
      { $set: { nom, prenom, type, email } },
      { new: true, runValidators: true }
    );
    if (!adherent) return res.status(404).json({ erreur: "Adhérent introuvable" });
    res.json(adherent);
  } catch (e) { next(e); }
});

// ── DELETE /api/adherents/:id — supprimer si aucun emprunt en cours ───────────
router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    const empruntsActifs = await Emprunt.countDocuments({
      adherent: req.params.id,
      statut: "en_cours",
    });
    if (empruntsActifs > 0) {
      return res.status(409).json({
        erreur: `Impossible de supprimer : cet adhérent a ${empruntsActifs} emprunt(s) en cours.`,
      });
    }
    const adherent = await Adherent.findByIdAndDelete(req.params.id);
    if (!adherent) return res.status(404).json({ erreur: "Adhérent introuvable" });
    res.json({ message: "Adhérent supprimé", adherent });
  } catch (e) { next(e); }
});

export default router;
