import mongoose from "mongoose";
import Adherent from "../models/Adherent.js";

export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (mongoose.Types.ObjectId.isValid(String(id))) {
    return new mongoose.Types.ObjectId(String(id));
  }
  return null;
}

/** Résout un adhérent par ObjectId MongoDB ou par matricule. */
export async function resolveAdherent(idOrMatricule) {
  if (!idOrMatricule) return null;
  const oid = toObjectId(idOrMatricule);
  if (oid) {
    const parId = await Adherent.findById(oid);
    if (parId) return parId;
  }
  return Adherent.findOne({ matricule: String(idOrMatricule).trim() });
}

/** ID adhérent effectif : membre = son propre compte, admin = body ou fallback. */
export function adherentIdEffectif(req) {
  if (req.user.role !== "admin") return req.user.id;
  return req.body.adherentId || req.user.id;
}
