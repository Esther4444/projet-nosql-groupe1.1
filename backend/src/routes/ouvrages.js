import { Router } from "express";
import Ouvrage from "../models/Ouvrage.js";
import Emprunt from "../models/Emprunt.js";
import { adminOnly } from "../middlewares/role.js";

const router = Router();

// ── GET /api/ouvrages — catalogue (recherche, filtre catégorie, filtre dispo) ─
router.get("/", async (req, res, next) => {
  try {
    const { q, categorie, disponible } = req.query;
    const filtre = {};

    if (q) {
      filtre.$or = [
        { titre:   new RegExp(q, "i") },
        { auteur:  new RegExp(q, "i") },
        { isbn:    new RegExp(q, "i") },
      ];
    }
    if (categorie) filtre.categorie = categorie;
    if (disponible === "true") filtre.nbDisponibles = { $gt: 0 };

    const ouvrages = await Ouvrage.find(filtre).sort({ titre: 1 });
    res.json(ouvrages);
  } catch (e) { next(e); }
});

// ── GET /api/ouvrages/categories — liste des catégories distinctes ────────────
router.get("/categories", async (_req, res, next) => {
  try {
    const cats = await Ouvrage.distinct("categorie");
    res.json(cats.filter(Boolean).sort());
  } catch (e) { next(e); }
});

// ── GET /api/ouvrages/:id — détail (exemplaires embarqués : 1 seule requête) ──
router.get("/:id", async (req, res, next) => {
  try {
    const ouvrage = await Ouvrage.findById(req.params.id);
    if (!ouvrage) return res.status(404).json({ erreur: "Ouvrage introuvable" });
    res.json(ouvrage);
  } catch (e) { next(e); }
});

// ── POST /api/ouvrages — création avec exemplaires ────────────────────────────
router.post("/", adminOnly, async (req, res, next) => {
  try {
    const { titre, auteur, isbn, annee, categorie, description, exemplaires = [] } = req.body;
    if (!titre || !auteur) {
      return res.status(400).json({ erreur: "titre et auteur sont requis" });
    }
    const ouvrage = await Ouvrage.create({
      titre, auteur, isbn, annee, categorie, description,
      exemplaires,
      nbDisponibles: exemplaires.filter((e) => e.statut !== "emprunte" && e.statut !== "reserve").length,
    });
    res.status(201).json(ouvrage);
  } catch (e) { next(e); }
});

// ── PUT /api/ouvrages/:id — modifier les métadonnées d'un ouvrage ─────────────
router.put("/:id", adminOnly, async (req, res, next) => {
  try {
    const { titre, auteur, isbn, annee, categorie, description } = req.body;
    const ouvrage = await Ouvrage.findByIdAndUpdate(
      req.params.id,
      { $set: { titre, auteur, isbn, annee, categorie, description } },
      { new: true, runValidators: true }
    );
    if (!ouvrage) return res.status(404).json({ erreur: "Ouvrage introuvable" });
    res.json(ouvrage);
  } catch (e) { next(e); }
});

// ── DELETE /api/ouvrages/:id — supprimer un ouvrage (si aucun emprunt actif) ──
router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    const empruntsActifs = await Emprunt.countDocuments({
      ouvrage: req.params.id,
      statut: "en_cours",
    });
    if (empruntsActifs > 0) {
      return res.status(409).json({
        erreur: `Impossible de supprimer : ${empruntsActifs} emprunt(s) en cours sur cet ouvrage.`,
      });
    }
    const ouvrage = await Ouvrage.findByIdAndDelete(req.params.id);
    if (!ouvrage) return res.status(404).json({ erreur: "Ouvrage introuvable" });
    res.json({ message: "Ouvrage supprimé", ouvrage });
  } catch (e) { next(e); }
});

// ── POST /api/ouvrages/:id/exemplaires — ajouter un exemplaire ($push + $inc) ─
router.post("/:id/exemplaires", adminOnly, async (req, res, next) => {
  try {
    const { code, etat = "bon" } = req.body;
    if (!code) return res.status(400).json({ erreur: "code d'exemplaire requis" });
    const ouvrage = await Ouvrage.findOneAndUpdate(
      { _id: req.params.id, "exemplaires.code": { $ne: code } },
      {
        $push: { exemplaires: { code, etat, statut: "disponible" } },
        $inc:  { nbDisponibles: 1 },
      },
      { new: true }
    );
    if (!ouvrage) return res.status(409).json({ erreur: "Code d'exemplaire déjà utilisé ou ouvrage introuvable" });
    res.status(201).json(ouvrage);
  } catch (e) { next(e); }
});

// ── DELETE /api/ouvrages/:id/exemplaires/:code — supprimer un exemplaire ──────
router.delete("/:id/exemplaires/:code", adminOnly, async (req, res, next) => {
  try {
    // Vérifier qu'il n'est pas emprunté ou réservé
    const ouvrage = await Ouvrage.findOne({
      _id: req.params.id,
      "exemplaires.code": req.params.code,
    });
    if (!ouvrage) return res.status(404).json({ erreur: "Exemplaire introuvable" });

    const ex = ouvrage.exemplaires.find((e) => e.code === req.params.code);
    if (ex.statut !== "disponible") {
      return res.status(409).json({ erreur: `Impossible : l'exemplaire est actuellement '${ex.statut}'` });
    }

    const updated = await Ouvrage.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { exemplaires: { code: req.params.code } },
        $inc:  { nbDisponibles: -1 },
      },
      { new: true }
    );
    res.json(updated);
  } catch (e) { next(e); }
});

// ── DÉFI TECHNIQUE — RÉSERVATION SANS DOUBLE RÉSERVATION ─────────────────────
// POST /api/ouvrages/:id/exemplaires/:code/reserver  { adherentId }
router.post("/:id/exemplaires/:code/reserver", async (req, res, next) => {
  try {
    const { adherentId } = req.body;
    if (!adherentId) return res.status(400).json({ erreur: "adherentId requis" });

    const ouvrage = await Ouvrage.findOneAndUpdate(
      {
        _id: req.params.id,
        exemplaires: { $elemMatch: { code: req.params.code, statut: "disponible" } },
      },
      {
        $set: {
          "exemplaires.$.statut":    "reserve",
          "exemplaires.$.reservePar": adherentId,
          "exemplaires.$.reserveLe":  new Date(),
        },
        $inc: { nbDisponibles: -1 },
      },
      { new: true }
    );

    if (!ouvrage) {
      return res.status(409).json({
        erreur: "Exemplaire indisponible : déjà réservé ou emprunté par un autre adhérent.",
      });
    }
    res.json(ouvrage);
  } catch (e) { next(e); }
});

// ── POST /api/ouvrages/:id/exemplaires/:code/annuler-reservation ─────────────
router.post("/:id/exemplaires/:code/annuler-reservation", async (req, res, next) => {
  try {
    const { adherentId } = req.body;
    const ouvrage = await Ouvrage.findOneAndUpdate(
      {
        _id: req.params.id,
        exemplaires: {
          $elemMatch: { code: req.params.code, statut: "reserve", reservePar: adherentId },
        },
      },
      {
        $set: {
          "exemplaires.$.statut":    "disponible",
          "exemplaires.$.reservePar": null,
          "exemplaires.$.reserveLe":  null,
        },
        $inc: { nbDisponibles: 1 },
      },
      { new: true }
    );
    if (!ouvrage) return res.status(409).json({ erreur: "Aucune réservation de cet adhérent sur cet exemplaire" });
    res.json(ouvrage);
  } catch (e) { next(e); }
});

export default router;
