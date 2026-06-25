import { useEffect, useState, useRef } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import { SkeletonCard } from "../components/Skeleton.jsx";
import { toast } from "../components/Toast.jsx";

// Couleur de couverture déterministe selon titre
const COVER_COLORS = [
  ["#1A3560","#2A5298"], ["#2D1B69","#5B3FA6"], ["#1A4A2E","#2E8B57"],
  ["#4A1A1A","#8B2020"], ["#1A3A4A","#2E7DA8"], ["#3A2A1A","#8B6020"],
];
const coverColor = (title = "") => COVER_COLORS[title.charCodeAt(0) % COVER_COLORS.length];

const ETATS = ["neuf", "bon", "use"];
const userId = (user) => user?._id ?? user?.id;

export default function Catalogue({ user }) {
  const [ouvrages, setOuvrages]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [recherche, setRecherche]   = useState("");
  const [catFiltre, setCatFiltre]   = useState("");
  const [dispoOnly, setDispoOnly]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [selection, setSelection]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [empruntModal, setEmpruntModal] = useState(null); // { exemplaire, adherentId }
  const [adherents, setAdherents]   = useState([]);
  const [showEdit, setShowEdit]     = useState(false);
  const [editForm, setEditForm]     = useState({ titre: "", auteur: "", isbn: "", annee: "", categorie: "", description: "" });
  const [confirmDeleteOuvrage, setConfirmDeleteOuvrage] = useState(null);
  const [confirmDeleteEx, setConfirmDeleteEx] = useState(null);
  const [newExForm, setNewExForm]   = useState({ code: "", etat: "bon" });

  // Formulaire de création d'ouvrage
  const [form, setForm] = useState({ titre: "", auteur: "", isbn: "", annee: "", categorie: "", description: "" });
  const [newExemplaires, setNewExemplaires] = useState([{ code: "", etat: "bon" }]);
  const searchTimeout = useRef(null);

  const charger = async (q = recherche, cat = catFiltre, dispo = dispoOnly) => {
    setLoading(true);
    try {
      const liste = await api.ouvrages({ q, categorie: cat, disponible: dispo });
      setOuvrages(liste);
      if (selection) {
        const maj = liste.find((o) => o._id === selection._id);
        if (maj) setSelection(maj);
      }
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger("", "", false);
    api.categories().then(setCategories).catch(console.error);
  }, []);

  // Recherche avec debounce
  const handleSearch = (val) => {
    setRecherche(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => charger(val, catFiltre, dispoOnly), 350);
  };

  const agir = async (fn, msgSucces) => {
    setActionLoading(true);
    try {
      await fn();
      await charger();
      toast(msgSucces, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  // Création ouvrage
  const creerOuvrage = async () => {
    if (!form.titre || !form.auteur) {
      toast("Titre et auteur sont obligatoires.", "erreur"); return;
    }
    const exemplairesValides = newExemplaires.filter((ex) => ex.code.trim());
    if (!exemplairesValides.length) {
      toast("Ajoutez au moins un exemplaire.", "erreur"); return;
    }
    await agir(
      () => api.creerOuvrage({ ...form, annee: Number(form.annee) || undefined, exemplaires: exemplairesValides }),
      `Ouvrage "${form.titre}" créé avec ${exemplairesValides.length} exemplaire(s).`
    );
    setShowCreate(false);
    setForm({ titre: "", auteur: "", isbn: "", annee: "", categorie: "", description: "" });
    setNewExemplaires([{ code: "", etat: "bon" }]);
  };

  const majEx = (i, key, val) =>
    setNewExemplaires((prev) => prev.map((ex, j) => j === i ? { ...ex, [key]: val } : ex));

  const ouvrirEmprunt = async (ex) => {
    const reservePar = ex.statut === "reserve" && ex.reservePar ? String(ex.reservePar) : "";
    setEmpruntModal({ exemplaire: ex, adherentId: reservePar });
    if (user?.role === "admin" && adherents.length === 0) {
      try {
        const liste = await api.adherents();
        setAdherents(liste.filter((a) => a.statut === "actif"));
      } catch (e) {
        toast(e.message, "erreur");
      }
    }
  };

  const confirmerEmprunt = async () => {
    if (!empruntModal?.adherentId) {
      toast("Sélectionnez l'adhérent emprunteur.", "erreur");
      return;
    }
    setActionLoading(true);
    try {
      await api.emprunter(selection._id, empruntModal.adherentId, empruntModal.exemplaire.code);
      setEmpruntModal(null);
      await charger();
      toast(`Emprunt enregistré pour ${empruntModal.exemplaire.code}.`, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const ouvrirModifier = (o) => {
    setEditForm({
      titre: o.titre ?? "",
      auteur: o.auteur ?? "",
      isbn: o.isbn ?? "",
      annee: o.annee ?? "",
      categorie: o.categorie ?? "",
      description: o.description ?? "",
    });
    setShowEdit(true);
  };

  const sauverOuvrage = async () => {
    if (!editForm.titre || !editForm.auteur) {
      toast("Titre et auteur sont obligatoires.", "erreur");
      return;
    }
    setActionLoading(true);
    try {
      await api.majOuvrage(selection._id, {
        ...editForm,
        annee: Number(editForm.annee) || undefined,
      });
      setShowEdit(false);
      await charger();
      toast(`Ouvrage "${editForm.titre}" mis à jour.`, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const supprimerOuvrage = async () => {
    setActionLoading(true);
    try {
      await api.supprimerOuvrage(confirmDeleteOuvrage._id);
      setConfirmDeleteOuvrage(null);
      setSelection(null);
      await charger();
      toast(`Ouvrage "${confirmDeleteOuvrage.titre}" supprimé.`, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const ajouterExemplaire = async () => {
    if (!newExForm.code.trim()) {
      toast("Le code de l'exemplaire est requis.", "erreur");
      return;
    }
    await agir(
      () => api.ajouterExemplaire(selection._id, newExForm),
      `Exemplaire ${newExForm.code} ajouté.`
    );
    setNewExForm({ code: "", etat: "bon" });
  };

  const retirerExemplaire = async () => {
    setActionLoading(true);
    try {
      await api.supprimerExemplaire(selection._id, confirmDeleteEx);
      setConfirmDeleteEx(null);
      await charger();
      toast(`Exemplaire ${confirmDeleteEx} retiré du catalogue.`, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const uid = userId(user);

  return (
    <section>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <span className="material-symbols-rounded search-icon" style={{ fontSize: 18 }}>search</span>
          <input
            id="catalogue-search"
            type="text"
            className="form-input"
            placeholder="Titre, auteur, ISBN…"
            value={recherche}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            className={`filter-pill${dispoOnly ? " active" : ""}`}
            onClick={() => { const v = !dispoOnly; setDispoOnly(v); charger(recherche, catFiltre, v); }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>check_circle</span> Disponibles
          </button>
        </div>

        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={catFiltre}
          onChange={(e) => { setCatFiltre(e.target.value); charger(recherche, e.target.value, dispoOnly); }}
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {user?.role === "admin" && (
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span> Nouvel ouvrage
            </button>
          </div>
        )}
      </div>

      {/* Grille */}
      <div className="books-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : ouvrages.length === 0
          ? <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <div className="empty-state-icon"><span className="material-symbols-rounded" style={{ fontSize: 56 }}>menu_book</span></div>
              <div className="empty-state-title">Aucun ouvrage trouvé</div>
              <div className="empty-state-sub">Modifiez vos filtres ou créez un nouvel ouvrage.</div>
            </div>
          : ouvrages.map((o) => {
              const [c1, c2] = coverColor(o.titre);
              const exTotal = o.exemplaires?.length ?? 0;
              const dispo = o.nbDisponibles ?? 0;
              const tauxDispo = exTotal > 0 ? Math.round((dispo / exTotal) * 100) : 0;
              const initials = (o.titre ?? "")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() || "?";

              return (
                <button
                  key={o._id}
                  className="book-card book-card--v2"
                  onClick={() => setSelection(o)}
                  aria-label={`Ouvrage ${o.titre}`}
                >
                  <div className="book-card-cover-wrap">
                    <div
                      className="book-cover book-cover--hero"
                      style={{ background: `linear-gradient(145deg, ${c1} 0%, ${c2} 55%, ${c1} 100%)` }}
                    >
                      <div className="book-cover-shine" aria-hidden="true" />
                      <div className="book-cover-spine" aria-hidden="true" />
                      <span className="book-cover-initials">{initials}</span>
                      <span className="material-symbols-rounded book-cover-watermark">auto_stories</span>
                    </div>
                    <span className={`book-card-badge${dispo > 0 ? " book-card-badge--ok" : " book-card-badge--nok"}`}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                        {dispo > 0 ? "check_circle" : "block"}
                      </span>
                      {dispo > 0 ? `${dispo} dispo` : "Complet"}
                    </span>
                    <span className="book-card-hover-cta">
                      <span className="material-symbols-rounded" style={{ fontSize: 18 }}>visibility</span>
                      Voir détails
                    </span>
                  </div>

                  <div className="book-card-content">
                    <h3 className="book-title">{o.titre}</h3>
                    <p className="book-author">{o.auteur}</p>

                    <div className="book-card-chips">
                      {o.categorie && <span className="book-categorie">{o.categorie}</span>}
                      {o.annee && <span className="book-year">{o.annee}</span>}
                    </div>

                    <div className="book-card-stats">
                      <span title="Exemplaires">
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>inventory_2</span>
                        {exTotal} ex.
                      </span>
                      <span title="Emprunts totaux">
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>trending_up</span>
                        {o.totalEmprunts ?? 0}
                      </span>
                    </div>

                    <div className="book-card-progress" title={`${tauxDispo}% disponible`}>
                      <div
                        className={`book-card-progress-fill${dispo === 0 ? " book-card-progress-fill--empty" : ""}`}
                        style={{ width: `${tauxDispo}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
      </div>

      {/* ── Modal Fiche Ouvrage ─────────────────────────────────────────── */}
      <Modal
        open={Boolean(selection)}
        onClose={() => setSelection(null)}
        title={selection?.titre ?? ""}
        size="lg"
        footer={
          user?.role === "admin" ? (
            <>
              <button className="btn btn-ghost" onClick={() => ouvrirModifier(selection)}>
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span> Modifier
              </button>
              <button className="btn btn-danger btn-ghost" onClick={() => setConfirmDeleteOuvrage(selection)}>
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span> Supprimer
              </button>
              <button className="btn btn-ghost" onClick={() => setSelection(null)}>Fermer</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => setSelection(null)}>Fermer</button>
          )
        }
      >
        {selection && (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 14, color: "var(--gris-doux)", marginBottom: 4 }}>
                  {selection.auteur}
                  {selection.annee ? ` · ${selection.annee}` : ""}
                  {selection.categorie ? ` · ${selection.categorie}` : ""}
                </p>
                {selection.isbn && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gris-doux)" }}>
                    ISBN {selection.isbn}
                  </p>
                )}
                {selection.description && (
                  <p style={{ fontSize: 13, color: "var(--gris-moyen)", marginTop: 8, lineHeight: 1.5 }}>
                    {selection.description}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, padding: "4px 10px", background: "rgba(34,197,94,0.1)", color: "var(--vert-clair)", borderRadius: "var(--radius-md)" }}>
                  {selection.nbDisponibles} disponible{selection.nbDisponibles !== 1 ? "s" : ""}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, padding: "4px 10px", background: "rgba(201,168,76,0.1)", color: "var(--or-clair)", borderRadius: "var(--radius-md)" }}>
                  {selection.totalEmprunts} emprunt{selection.totalEmprunts !== 1 ? "s" : ""} total
                </span>
              </div>
            </div>

            {/* Liste des exemplaires */}
            <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gris-doux)" }}>
              Exemplaires ({selection.exemplaires.length})
            </div>
            <div className="exemplaires-list">
              {selection.exemplaires.map((ex) => {
                const estMaResa = ex.statut === "reserve" && String(ex.reservePar) === String(uid);
                const empruntable = ex.statut === "disponible" || ex.statut === "reserve";
                return (
                  <div className="exemplaire-row" key={ex.code}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span className="exemplaire-code">{ex.code}</span>
                      <span style={{ fontSize: 11, color: "var(--gris-doux)" }}>État : {ex.etat}</span>
                    </div>
                    <Badge
                      statut={ex.statut}
                      label={
                        ex.statut === "disponible" ? "Disponible"
                        : ex.statut === "emprunte"  ? "Emprunté"
                        : estMaResa                ? "Réservé (vous)"
                        : "Réservé"
                      }
                    />
                    <div className="exemplaire-actions">
                      {user?.role === "admin" && empruntable && (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={actionLoading}
                          onClick={() => ouvrirEmprunt(ex)}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>output</span>
                          {ex.statut === "reserve" ? "Valider l'emprunt" : "Emprunter"}
                        </button>
                      )}
                      {ex.statut === "disponible" && user?.role !== "admin" && (
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={actionLoading}
                          onClick={() => agir(
                            () => api.reserver(selection._id, ex.code, uid),
                            `Exemplaire ${ex.code} réservé.`
                          )}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>bookmark_add</span> Réserver
                        </button>
                      )}
                      {estMaResa && (
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={actionLoading}
                          onClick={() => agir(
                            () => api.annulerReservation(selection._id, ex.code, uid),
                            `Réservation annulée sur ${ex.code}.`
                          )}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>bookmark_remove</span> Annuler résa
                        </button>
                      )}
                      {user?.role === "admin" && ex.statut === "disponible" && (
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          disabled={actionLoading}
                          onClick={() => setConfirmDeleteEx(ex.code)}
                          title="Retirer cet exemplaire"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {user?.role === "admin" && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gris-doux)", marginBottom: 10 }}>
                  Ajouter un exemplaire
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    className="form-input"
                    placeholder="Code ex. UOB-0001-D"
                    value={newExForm.code}
                    onChange={(e) => setNewExForm({ ...newExForm, code: e.target.value })}
                    style={{ flex: 1, minWidth: 160 }}
                  />
                  <select
                    className="form-select"
                    style={{ width: 120 }}
                    value={newExForm.etat}
                    onChange={(e) => setNewExForm({ ...newExForm, etat: e.target.value })}
                  >
                    {ETATS.map((et) => <option key={et} value={et}>{et}</option>)}
                  </select>
                  <button className="btn btn-secondary btn-sm" onClick={ajouterExemplaire} disabled={actionLoading}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span> Ajouter
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ── Modal Modifier Ouvrage ───────────────────────────────────────── */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Modifier l'ouvrage"
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowEdit(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={sauverOuvrage} disabled={actionLoading}>
              {actionLoading ? <><span className="spinner" /> Enregistrement…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>save</span> Enregistrer</>}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Titre *</label>
            <input className="form-input" value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Auteur *</label>
            <input className="form-input" value={editForm.auteur} onChange={(e) => setEditForm({ ...editForm, auteur: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <input className="form-input" value={editForm.categorie} onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })} list="categories-list-edit" />
            <datalist id="categories-list-edit">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Année</label>
            <input className="form-input" type="number" value={editForm.annee} onChange={(e) => setEditForm({ ...editForm, annee: e.target.value })} min="1800" max="2100" />
          </div>
          <div className="form-group">
            <label className="form-label">ISBN</label>
            <input className="form-input" value={editForm.isbn} onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal Supprimer Ouvrage ────────────────────────────────────────── */}
      <Modal
        open={Boolean(confirmDeleteOuvrage)}
        onClose={() => setConfirmDeleteOuvrage(null)}
        title="Supprimer l'ouvrage"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmDeleteOuvrage(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={supprimerOuvrage} disabled={actionLoading}>
              {actionLoading ? <><span className="spinner" /> Suppression…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span> Supprimer</>}
            </button>
          </>
        }
      >
        {confirmDeleteOuvrage && (
          <div style={{ fontSize: 14, color: "var(--gris-moyen)", lineHeight: 1.7 }}>
            <p>Supprimer définitivement :</p>
            <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-md)", padding: "12px 16px", margin: "12px 0", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, color: "var(--ivoire)" }}>{confirmDeleteOuvrage.titre}</div>
              <div style={{ fontSize: 13, color: "var(--gris-doux)" }}>{confirmDeleteOuvrage.auteur}</div>
            </div>
            <p style={{ color: "var(--rouge-clair)", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>warning</span>
              Impossible si des emprunts sont en cours sur cet ouvrage.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Modal Retirer Exemplaire ───────────────────────────────────────── */}
      <Modal
        open={Boolean(confirmDeleteEx)}
        onClose={() => setConfirmDeleteEx(null)}
        title="Retirer l'exemplaire"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmDeleteEx(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={retirerExemplaire} disabled={actionLoading}>
              {actionLoading ? <><span className="spinner" /> Retrait…</> : "Retirer"}
            </button>
          </>
        }
      >
        {confirmDeleteEx && (
          <p style={{ fontSize: 14, color: "var(--gris-moyen)" }}>
            Retirer l'exemplaire <strong style={{ fontFamily: "var(--font-mono)", color: "var(--or-clair)" }}>{confirmDeleteEx}</strong> du catalogue ?
            Seuls les exemplaires <strong>disponibles</strong> peuvent être retirés.
          </p>
        )}
      </Modal>

      {/* ── Modal Emprunt (admin) ─────────────────────────────────────────── */}
      <Modal
        open={Boolean(empruntModal)}
        onClose={() => setEmpruntModal(null)}
        title="Enregistrer un emprunt"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEmpruntModal(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={confirmerEmprunt} disabled={actionLoading || !empruntModal?.adherentId}>
              {actionLoading ? <><span className="spinner" /> Traitement…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>check</span> Confirmer l'emprunt</>}
            </button>
          </>
        }
      >
        {empruntModal && (
          <div style={{ fontSize: 14, color: "var(--gris-moyen)", lineHeight: 1.7 }}>
            <p>Exemplaire <strong style={{ fontFamily: "var(--font-mono)", color: "var(--or-clair)" }}>{empruntModal.exemplaire.code}</strong></p>
            {empruntModal.exemplaire.statut === "reserve" && (
              <p style={{ fontSize: 13, color: "var(--vert-clair)", marginBottom: 12 }}>
                Cet exemplaire est réservé — l'emprunt convertira la réservation en prêt.
              </p>
            )}
            <div className="form-group">
              <label className="form-label">Adhérent emprunteur *</label>
              <select
                className="form-select"
                value={empruntModal.adherentId}
                onChange={(e) => setEmpruntModal({ ...empruntModal, adherentId: e.target.value })}
              >
                <option value="">— Choisir un adhérent —</option>
                {adherents.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.prenom} {a.nom} ({a.matricule}) — {a.type === "enseignant" ? "30 j" : "14 j"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Créer Ouvrage ──────────────────────────────────────────── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Ajouter un ouvrage au catalogue"
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={creerOuvrage} disabled={actionLoading}>
              {actionLoading ? <><span className="spinner" /> Création…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>add_circle</span> Créer l'ouvrage</>}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Titre *</label>
            <input className="form-input" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="ex. Une vie de boy" />
          </div>
          <div className="form-group">
            <label className="form-label">Auteur *</label>
            <input className="form-input" value={form.auteur} onChange={(e) => setForm({ ...form, auteur: e.target.value })} placeholder="ex. Ferdinand Oyono" />
          </div>
          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <input className="form-input" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} placeholder="ex. Littérature africaine" list="categories-list" />
            <datalist id="categories-list">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Année</label>
            <input className="form-input" type="number" value={form.annee} onChange={(e) => setForm({ ...form, annee: e.target.value })} placeholder="ex. 1956" min="1800" max="2100" />
          </div>
          <div className="form-group">
            <label className="form-label">ISBN</label>
            <input className="form-input" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} placeholder="978-…" />
          </div>
        </div>

        {/* Exemplaires */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gris-doux)" }}>
              Exemplaires *
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setNewExemplaires([...newExemplaires, { code: "", etat: "bon" }])}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span> Ajouter un exemplaire
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {newExemplaires.map((ex, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="form-input"
                  placeholder={`Code ex. UOB-0001-${String.fromCharCode(65 + i)}`}
                  value={ex.code}
                  onChange={(e) => majEx(i, "code", e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  className="form-select"
                  style={{ width: 120 }}
                  value={ex.etat}
                  onChange={(e) => majEx(i, "etat", e.target.value)}
                >
                  {ETATS.map((et) => <option key={et} value={et}>{et}</option>)}
                </select>
                {newExemplaires.length > 1 && (
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => setNewExemplaires(newExemplaires.filter((_, j) => j !== i))}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>remove_circle</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
}
