import { Router } from "express";
import Ouvrage from "../models/Ouvrage.js";
import Emprunt from "../models/Emprunt.js";
import { adminOnly } from "../middlewares/role.js";
import { toObjectId, resolveAdherent } from "../utils/adherent.js";

const router = Router();
const DUREE_JOURS = { etudiant: 14, enseignant: 30 };

// ── GET /api/emprunts — liste avec filtres et pagination ──────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { statut, adherent, retard, q, page = 1, limit = 50 } = req.query;
    const filtre = {};

    if (statut)   filtre.statut   = statut;

    // Recherche texte sur les champs dénormalisés (titre, adhérent, exemplaire)
    if (q && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filtre.$or = [
        { ouvrageTitre: rx },
        { adherentNom: rx },
        { exemplaireCode: rx },
      ];
    }
    
    // Si membre, on force le filtre sur son ID. Si admin, on utilise le filtre query s'il existe.
    if (req.user.role !== "admin") {
      filtre.adherent = req.user.id;
    } else if (adherent) {
      filtre.adherent = adherent;
    }

    // Filtre retards : emprunts en cours dont la date de retour prévue est dépassée
    if (retard === "true") {
      filtre.statut = "en_cours";
      filtre.dateRetourPrevue = { $lt: new Date() };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const [emprunts, total] = await Promise.all([
      Emprunt.find(filtre).sort({ dateEmprunt: -1 }).skip(skip).limit(Number(limit)),
      Emprunt.countDocuments(filtre),
    ]);

    res.json({ emprunts, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
});

/**
 * LIVRABLE — EMPRUNT REFUSÉ SI AUCUN EXEMPLAIRE DISPONIBLE
 * POST /api/emprunts  { ouvrageId, adherentId, exemplaireCode? }
 * Gestion atomique via $set + $inc dans findOneAndUpdate.
 */
router.post("/", adminOnly, async (req, res, next) => {
  try {
    const { ouvrageId, adherentId, exemplaireCode } = req.body;
    if (!ouvrageId || !adherentId)
      return res.status(400).json({ erreur: "ouvrageId et adherentId requis" });

    const adherent = await resolveAdherent(adherentId);
    if (!adherent) return res.status(404).json({ erreur: "Adhérent introuvable" });
    if (adherent.statut !== "actif") {
      return res.status(403).json({ erreur: "Compte inactif — emprunt impossible." });
    }

    const adherentObjId = toObjectId(adherent._id);
    const conditionCode  = exemplaireCode ? { code: exemplaireCode } : {};

    // Tentative 1 : convertir SA réservation en emprunt
    let ouvrage = await Ouvrage.findOneAndUpdate(
      {
        _id: ouvrageId,
        exemplaires: {
          $elemMatch: { ...conditionCode, statut: "reserve", reservePar: adherentObjId },
        },
      },
      {
        $set: {
          "exemplaires.$.statut":    "emprunte",
          "exemplaires.$.reservePar": null,
          "exemplaires.$.reserveLe":  null,
        },
        // nbDisponibles déjà décrémenté lors de la réservation
        $inc: { totalEmprunts: 1 },
      },
      { new: false }
    );

    // Tentative 2 : prendre un exemplaire disponible
    let viaReservation = Boolean(ouvrage);
    if (!ouvrage) {
      ouvrage = await Ouvrage.findOneAndUpdate(
        {
          _id: ouvrageId,
          exemplaires: { $elemMatch: { ...conditionCode, statut: "disponible" } },
        },
        {
          $set: { "exemplaires.$.statut": "emprunte" },
          $inc: { nbDisponibles: -1, totalEmprunts: 1 },
        },
        { new: false }
      );
    }

    // Précondition non satisfaite → 409
    if (!ouvrage) {
      return res.status(409).json({
        erreur: "Emprunt refusé : aucun exemplaire disponible pour cet ouvrage.",
      });
    }

    // Identifier l'exemplaire pris (état avant mutation)
    const exemplaire = ouvrage.exemplaires.find((ex) =>
      exemplaireCode
        ? ex.code === exemplaireCode
        : viaReservation
        ? ex.statut === "reserve" && String(ex.reservePar) === String(adherent._id)
        : ex.statut === "disponible"
    );

    const duree   = DUREE_JOURS[adherent.type] ?? 14;
    const emprunt = await Emprunt.create({
      ouvrage:            ouvrage._id,
      exemplaireCode:     exemplaire.code,
      adherent:           adherent._id,
      ouvrageTitre:       ouvrage.titre,
      adherentNom:        `${adherent.prenom} ${adherent.nom}`,
      dateRetourPrevue:   new Date(Date.now() + duree * 24 * 3600 * 1000),
    });

    res.status(201).json(emprunt);
  } catch (e) { next(e); }
});

/**
 * POST /api/emprunts/:id/retour — rendre un exemplaire
 * $set statut "disponible" + $inc nbDisponibles +1, atomiquement.
 */
router.post("/:id/retour", adminOnly, async (req, res, next) => {
  try {
    const emprunt = await Emprunt.findOneAndUpdate(
      { _id: req.params.id, statut: "en_cours" },
      { $set: { statut: "rendu", dateRetourEffective: new Date() } },
      { new: true }
    );
    if (!emprunt) return res.status(409).json({ erreur: "Emprunt introuvable ou déjà rendu" });

    await Ouvrage.updateOne(
      { _id: emprunt.ouvrage, "exemplaires.code": emprunt.exemplaireCode },
      {
        $set: { "exemplaires.$.statut": "disponible" },
        $inc: { nbDisponibles: 1 },
      }
    );

    res.json(emprunt);
  } catch (e) { next(e); }
});

export default router;
