import { Router } from "express";
import Emprunt from "../models/Emprunt.js";
import Ouvrage from "../models/Ouvrage.js";
import Adherent from "../models/Adherent.js";
import { adminOnly } from "../middlewares/role.js";

const router = Router();

/**
 * LIVRABLE — AGRÉGATION : top 10 des ouvrages les plus empruntés.
 * Agrège la collection référencée `emprunts`, puis $lookup vers `ouvrages`.
 */
router.get("/top-ouvrages", adminOnly, async (_req, res, next) => {
  try {
    const top = await Emprunt.aggregate([
      { $group: { _id: "$ouvrage", totalEmprunts: { $sum: 1 } } },
      { $sort:  { totalEmprunts: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from:         "ouvrages",
          localField:   "_id",
          foreignField: "_id",
          as:           "ouvrage",
        },
      },
      { $unwind: "$ouvrage" },
      {
        $project: {
          _id:          0,
          ouvrageId:    "$_id",
          titre:        "$ouvrage.titre",
          auteur:       "$ouvrage.auteur",
          categorie:    "$ouvrage.categorie",
          totalEmprunts: 1,
        },
      },
    ]);
    res.json(top);
  } catch (e) { next(e); }
});

/**
 * GET /api/stats/top-categories — emprunts par catégorie d'ouvrage.
 */
router.get("/top-categories", adminOnly, async (_req, res, next) => {
  try {
    const stats = await Emprunt.aggregate([
      {
        $lookup: {
          from:         "ouvrages",
          localField:   "ouvrage",
          foreignField: "_id",
          as:           "ouvrageInfo",
        },
      },
      { $unwind: "$ouvrageInfo" },
      {
        $group: {
          _id:          "$ouvrageInfo.categorie",
          totalEmprunts: { $sum: 1 },
        },
      },
      { $sort:  { totalEmprunts: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, categorie: "$_id", totalEmprunts: 1 } },
    ]);
    res.json(stats);
  } catch (e) { next(e); }
});

/**
 * GET /api/stats/dashboard — métriques globales pour le tableau de bord.
 */
router.get("/dashboard", adminOnly, async (_req, res, next) => {
  try {
    const maintenant = new Date();

    const [
      totalOuvrages,
      totalAdherents,
      totalEmpruntsEnCours,
      totalRetards,
      totalExemplairesDispos,
      totalExemplaires,
      dernierEmprunts,
    ] = await Promise.all([
      Ouvrage.countDocuments(),
      Adherent.countDocuments(),
      Emprunt.countDocuments({ statut: "en_cours" }),
      Emprunt.countDocuments({ statut: "en_cours", dateRetourPrevue: { $lt: maintenant } }),
      // Somme des nbDisponibles via agrégation
      Ouvrage.aggregate([{ $group: { _id: null, total: { $sum: "$nbDisponibles" } } }]),
      Ouvrage.aggregate([
        { $project: { nb: { $size: "$exemplaires" } } },
        { $group:   { _id: null, total: { $sum: "$nb" } } },
      ]),
      // 5 derniers emprunts pour la vue récente
      Emprunt.find({ statut: "en_cours" }).sort({ dateEmprunt: -1 }).limit(5),
    ]);

    res.json({
      totalOuvrages,
      totalAdherents,
      totalEmpruntsEnCours,
      totalRetards,
      totalExemplairesDispos: totalExemplairesDispos[0]?.total ?? 0,
      totalExemplaires:       totalExemplaires[0]?.total       ?? 0,
      dernierEmprunts,
    });
  } catch (e) { next(e); }
});

export default router;
