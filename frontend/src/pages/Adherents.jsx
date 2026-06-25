import { useState, useEffect } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";
import Badge from "../components/Badge.jsx";
import { SkeletonRow } from "../components/Skeleton.jsx";
import { toast } from "../components/Toast.jsx";

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

function avatarInitials(prenom = "", nom = "") {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

const TYPE_LABELS = { etudiant: "Étudiant (14 j)", enseignant: "Enseignant (30 j)" };

export default function Adherents() {
  const [form, setForm]                 = useState({ matricule: "", nom: "", prenom: "", type: "etudiant", email: "", role: "membre" });
  const [showCreate, setShowCreate]     = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [historique, setHistorique]     = useState(null); // { adherent, emprunts }
  const [histLoading, setHistLoading]   = useState(false);
  const [confirmDel, setConfirmDel]     = useState(null);
  const [editAdherent, setEditAdherent]   = useState(null);
  const [editForm, setEditForm]           = useState({ nom: "", prenom: "", type: "etudiant", email: "", role: "membre" });
  const [verif, setVerif]                 = useState(null);   // adhérent en cours de vérification (liste)
  const [verifFull, setVerifFull]         = useState(null);   // détail complet (avec carte)
  const [verifLoading, setVerifLoading]   = useState(false);
  const [motifRefus, setMotifRefus]       = useState("");
  const [recherche, setRecherche]       = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous"); // tous | inactif | actif

  const [adherents, setAdherents]       = useState([]);
  const [loading, setLoading]           = useState(true);

  const chargerAdherents = async () => {
    setLoading(true);
    try {
      const liste = await api.adherents();
      setAdherents(liste);
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { chargerAdherents(); }, []);

  const maj = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const creer = async () => {
    if (!form.matricule || !form.nom || !form.prenom) {
      toast("Matricule, nom et prénom sont obligatoires.", "erreur"); return;
    }
    setActionLoading(true);
    try {
      await api.creerAdherent(form);
      await chargerAdherents();
      setForm({ matricule: "", nom: "", prenom: "", type: "etudiant", email: "", role: "membre" });
      setShowCreate(false);
      toast("Adhérent créé et activé avec succès.", "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const validerCompte = async (a) => {
    setActionLoading(true);
    try {
      await api.validerAdherent(a._id);
      await chargerAdherents();
      toast(`Compte de ${a.prenom} ${a.nom} activé.`, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  // Ouvre le dossier de vérification : charge le détail complet (avec la carte).
  const ouvrirVerification = async (a) => {
    setVerif(a);
    setVerifFull(null);
    setMotifRefus(a.motifRefus ?? "");
    setVerifLoading(true);
    try {
      const full = await api.adherent(a._id);
      setVerifFull(full);
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setVerifLoading(false);
    }
  };

  const fermerVerif = () => { setVerif(null); setVerifFull(null); setMotifRefus(""); };

  const validerDepuisVerif = async () => {
    await validerCompte(verif);
    fermerVerif();
  };

  // Refus : le compte est conservé (statut "refuse") afin que l'utilisateur
  // soit informé du refus lors de sa prochaine tentative de connexion.
  const refuserDemande = async () => {
    setActionLoading(true);
    try {
      await api.refuserAdherent(verif._id, motifRefus.trim());
      await chargerAdherents();
      fermerVerif();
      toast(`Demande de ${verif.prenom} ${verif.nom} refusée.`, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const voirHistorique = async (a) => {
    setHistLoading(true);
    setHistorique({ adherent: a, emprunts: [] });
    try {
      const res = await api.empruntsAdherent(a._id);
      const liste = Array.isArray(res) ? res : res.emprunts ?? [];
      setHistorique({ adherent: a, emprunts: liste });
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setHistLoading(false);
    }
  };

  const supprimerAdherent = async () => {
    setActionLoading(true);
    try {
      await api.supprimerAdherent(confirmDel._id);
      await chargerAdherents();
      setConfirmDel(null);
      toast(`Adhérent ${confirmDel.prenom} ${confirmDel.nom} supprimé.`, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const ouvrirModifier = (a) => {
    setEditForm({
      nom: a.nom ?? "",
      prenom: a.prenom ?? "",
      type: a.type ?? "etudiant",
      email: a.email ?? "",
      role: a.role ?? "membre",
    });
    setEditAdherent(a);
  };

  const sauverModification = async () => {
    if (!editForm.nom || !editForm.prenom) {
      toast("Nom et prénom sont obligatoires.", "erreur");
      return;
    }
    setActionLoading(true);
    try {
      await api.majAdherent(editAdherent._id, editForm);
      await chargerAdherents();
      setEditAdherent(null);
      toast(`Profil de ${editForm.prenom} ${editForm.nom} mis à jour.`, "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const majEdit = (k) => (e) => setEditForm({ ...editForm, [k]: e.target.value });

  const nbEnAttente = adherents.filter((a) => a.statut === "inactif").length;
  const nbRefuse    = adherents.filter((a) => a.statut === "refuse").length;
  const nbActif     = adherents.filter((a) => a.statut === "actif").length;

  const filtres = adherents.filter((a) => {
    if (filtreStatut !== "tous" && a.statut !== filtreStatut) return false;
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    return (
      a.nom.toLowerCase().includes(q) ||
      a.prenom.toLowerCase().includes(q) ||
      a.matricule.toLowerCase().includes(q) ||
      (a.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <section>
      {/* Bandeau alerte : comptes en attente de validation */}
      {nbEnAttente > 0 && filtreStatut !== "inactif" && (
        <button
          type="button"
          className="alerte-attente"
          onClick={() => setFiltreStatut("inactif")}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>pending_actions</span>
          <span>
            <strong>{nbEnAttente}</strong> demande{nbEnAttente > 1 ? "s" : ""} d'inscription en attente de vérification
          </span>
          <span className="alerte-attente-cta">Voir <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_forward</span></span>
        </button>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <span className="material-symbols-rounded search-icon">search</span>
          <input
            type="text"
            className="form-input"
            placeholder="Rechercher par nom, matricule…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>person_add</span>
            Créer un compte
          </button>
        </div>
      </div>

      {/* Filtres par statut */}
      <div className="filtre-pills">
        {[
          { id: "tous", label: "Tous", count: adherents.length },
          { id: "inactif", label: "En attente", count: nbEnAttente },
          { id: "actif", label: "Actifs", count: nbActif },
          { id: "refuse", label: "Refusés", count: nbRefuse },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filtre-pill${filtreStatut === f.id ? " active" : ""}${f.id === "inactif" && f.count > 0 ? " pill-attente" : ""}${f.id === "refuse" && f.count > 0 ? " pill-refuse" : ""}`}
            onClick={() => setFiltreStatut(f.id)}
          >
            {f.id === "inactif" && (
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>pending_actions</span>
            )}
            {f.id === "refuse" && (
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>block</span>
            )}
            {f.label}
            <span className="filtre-pill-count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Adhérent</th>
              <th>Matricule</th>
              <th>Type / Rôle</th>
              <th>Statut</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
            ) : filtres.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><span className="material-symbols-rounded" style={{ fontSize: 48 }}>group_off</span></div>
                      <div className="empty-state-title">Aucun adhérent</div>
                      <div className="empty-state-sub">
                        {recherche
                          ? "Aucun résultat pour cette recherche."
                          : filtreStatut === "inactif"
                            ? "Aucune demande en attente de validation."
                            : filtreStatut === "actif"
                              ? "Aucun compte actif."
                              : filtreStatut === "refuse"
                                ? "Aucune demande refusée."
                                : "Créez le premier adhérent."}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filtres.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        className="avatar"
                        style={{
                          background: a.role === "admin"
                            ? "linear-gradient(135deg, var(--or), var(--or-clair))"
                            : "linear-gradient(135deg, var(--bleu-clair), var(--bleu-accent))",
                          color: a.role === "admin" ? "var(--bleu-nuit)" : "var(--blanc)",
                        }}
                      >
                        {avatarInitials(a.prenom, a.nom)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.prenom} {a.nom}</div>
                        <div style={{ fontSize: 12, color: "var(--gris-doux)" }}>{a.email || "Sans email"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-mono">{a.matricule}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4,
                      borderRadius: "var(--radius-full)",
                      background: a.role === "admin" ? "rgba(201,168,76,0.15)" : "rgba(59,114,217,0.15)",
                      color: a.role === "admin" ? "var(--or-clair)" : "var(--bleu-accent)",
                      border: `1px solid ${a.role === "admin" ? "rgba(201,168,76,0.3)" : "rgba(59,114,217,0.3)"}`,
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                        {a.role === "admin" ? "admin_panel_settings" : a.type === "enseignant" ? "school" : "face"}
                      </span>
                      {a.role === "admin" ? "Bibliothécaire" : a.type === "enseignant" ? "Enseignant" : "Étudiant"}
                    </span>
                  </td>
                  <td>
                    {a.statut === "inactif" ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ambre-clair)", background: "rgba(245,158,11,0.15)", padding: "3px 8px", borderRadius: "var(--radius-md)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>pending_actions</span> En attente
                      </span>
                    ) : a.statut === "refuse" ? (
                      <span title={a.motifRefus || "Demande refusée"} style={{ fontSize: 11, fontWeight: 700, color: "var(--rouge-clair, #f87171)", background: "rgba(239,68,68,0.15)", padding: "3px 8px", borderRadius: "var(--radius-md)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>block</span> Refusé
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--vert-clair)", background: "rgba(34,197,94,0.15)", padding: "3px 8px", borderRadius: "var(--radius-md)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>check_circle</span> Actif
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(a.statut === "inactif" || a.statut === "refuse") && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => ouvrirVerification(a)}
                          title={a.statut === "refuse" ? "Revoir le dossier" : "Vérifier le dossier et activer"}
                          disabled={actionLoading}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>fact_check</span>
                          {a.statut === "refuse" ? "Revoir" : "Vérifier"}
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => ouvrirModifier(a)}
                        title="Modifier"
                        disabled={actionLoading}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => voirHistorique(a)}
                        title="Voir les emprunts"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>history</span>
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => setConfirmDel(a)}
                        title="Supprimer"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal Inscription / Création ────────────────────────────────────────────── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Créer un compte"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Annuler</button>
            <button
              className="btn btn-primary"
              onClick={creer}
              disabled={actionLoading || !form.matricule || !form.nom || !form.prenom}
            >
              {actionLoading ? <><span className="spinner" /> Création…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>person_add</span> Créer le compte</>}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Matricule *</label>
            <input className="form-input" value={form.matricule} onChange={maj("matricule")} placeholder="ex. UOB-ET-2024-153" />
          </div>
          <div className="form-group">
            <label className="form-label">Nom *</label>
            <input className="form-input" value={form.nom} onChange={maj("nom")} placeholder="ex. MALEMBA" />
          </div>
          <div className="form-group">
            <label className="form-label">Prénom *</label>
            <input className="form-input" value={form.prenom} onChange={maj("prenom")} placeholder="ex. Esther Lydie" />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Rôle *</label>
            <select
              className="form-select"
              value={form.role === "admin" ? "admin" : form.type}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "admin") setForm({ ...form, role: "admin", type: "enseignant" });
                else setForm({ ...form, role: "membre", type: v });
              }}
            >
              <option value="etudiant">Étudiant (prêt 14 j)</option>
              <option value="enseignant">Enseignant (prêt 30 j)</option>
              <option value="admin">Bibliothécaire</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={maj("email")} placeholder="ex. e.malemba@uob.ga" />
          </div>
        </div>
      </Modal>

      {/* ── Modal Vérification du dossier (avant activation) ──────────────── */}
      <Modal
        open={Boolean(verif)}
        onClose={fermerVerif}
        title={verif ? `Vérifier le dossier — ${verif.prenom} ${verif.nom}` : ""}
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={fermerVerif}>Fermer</button>
            <button className="btn btn-danger" onClick={refuserDemande} disabled={actionLoading}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>cancel</span> Refuser la demande
            </button>
            <button className="btn btn-primary" onClick={validerDepuisVerif} disabled={actionLoading}>
              {actionLoading ? <><span className="spinner" /> Activation…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>how_to_reg</span> Valider et activer</>}
            </button>
          </>
        }
      >
        {verif && (
          <div className="verif-layout">
            <div className="verif-infos">
              <div className="verif-row"><span className="verif-key">Matricule</span><span className="verif-val td-mono">{verif.matricule}</span></div>
              <div className="verif-row"><span className="verif-key">Nom complet</span><span className="verif-val">{verif.prenom} {verif.nom}</span></div>
              <div className="verif-row"><span className="verif-key">Profil</span><span className="verif-val">{TYPE_LABELS[verif.type] ?? verif.type}</span></div>
              <div className="verif-row"><span className="verif-key">Email</span><span className="verif-val">{verif.email || "Non renseigné"}</span></div>
              <p className="verif-note">
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>info</span>
                Vérifiez que la carte correspond bien aux informations ci-dessus avant d'activer le compte.
              </p>
              <div className="form-group" style={{ marginTop: 4 }}>
                <label className="form-label">Motif de refus (optionnel)</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Ex : carte illisible, informations non concordantes…"
                  value={motifRefus}
                  onChange={(e) => setMotifRefus(e.target.value)}
                />
                <span style={{ fontSize: 11, color: "var(--gris-doux)" }}>
                  Ce message sera affiché à l'utilisateur s'il tente de se connecter après un refus.
                </span>
              </div>
            </div>
            <div className="verif-carte">
              <div className="verif-carte-label">
                {verif.type === "enseignant" ? "Carte professionnelle" : "Carte étudiant"}
              </div>
              {verifLoading ? (
                <div className="verif-carte-placeholder"><span className="spinner" /></div>
              ) : verifFull?.carte ? (
                <a href={verifFull.carte} target="_blank" rel="noopener noreferrer" title="Ouvrir en grand">
                  <img src={verifFull.carte} alt="Carte justificative" className="verif-carte-img" />
                </a>
              ) : (
                <div className="verif-carte-placeholder verif-carte-vide">
                  <span className="material-symbols-rounded" style={{ fontSize: 36 }}>image_not_supported</span>
                  Aucune carte fournie
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Modifier Adhérent ───────────────────────────────────────── */}
      <Modal
        open={Boolean(editAdherent)}
        onClose={() => setEditAdherent(null)}
        title={editAdherent ? `Modifier — ${editAdherent.prenom} ${editAdherent.nom}` : ""}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEditAdherent(null)}>Annuler</button>
            <button
              className="btn btn-primary"
              onClick={sauverModification}
              disabled={actionLoading || !editForm.nom || !editForm.prenom}
            >
              {actionLoading ? <><span className="spinner" /> Enregistrement…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>save</span> Enregistrer</>}
            </button>
          </>
        }
      >
        {editAdherent && (
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Matricule</label>
              <input className="form-input" value={editAdherent.matricule} disabled style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input className="form-input" value={editForm.nom} onChange={majEdit("nom")} />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom *</label>
              <input className="form-input" value={editForm.prenom} onChange={majEdit("prenom")} />
            </div>
            <div className="form-group">
              <label className="form-label">Rôle *</label>
              <select
                className="form-select"
                value={editForm.role === "admin" ? "admin" : editForm.type}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "admin") setEditForm({ ...editForm, role: "admin", type: "enseignant" });
                  else setEditForm({ ...editForm, role: "membre", type: v });
                }}
              >
                <option value="etudiant">Étudiant (prêt 14 j)</option>
                <option value="enseignant">Enseignant (prêt 30 j)</option>
                <option value="admin">Bibliothécaire</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={editForm.email} onChange={majEdit("email")} placeholder="ex. e.malemba@uob.ga" />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Historique des emprunts ────────────────────────────────── */}
      <Modal
        open={Boolean(historique)}
        onClose={() => setHistorique(null)}
        title={historique ? `Emprunts — ${historique.adherent.prenom} ${historique.adherent.nom}` : ""}
        size="lg"
        footer={<button className="btn btn-ghost" onClick={() => setHistorique(null)}>Fermer</button>}
      >
        {historique && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--or-clair)", background: "rgba(201,168,76,0.1)", padding: "4px 10px", borderRadius: "var(--radius-md)" }}>
                {historique.adherent.matricule}
              </span>
              <span style={{ fontSize: 12, color: "var(--gris-doux)", padding: "4px 0" }}>
                {TYPE_LABELS[historique.adherent.type]}
              </span>
            </div>

            {histLoading
              ? <div className="table-wrapper"><table><tbody>{Array.from({length:4}).map((_,i)=><SkeletonRow key={i} cols={4}/>)}</tbody></table></div>
              : historique.emprunts.length === 0
              ? <div className="empty-state">
                  <div className="empty-state-icon"><span className="material-symbols-rounded" style={{ fontSize: 48 }}>inventory_2</span></div>
                  <div className="empty-state-title">Aucun emprunt</div>
                  <div className="empty-state-sub">Cet adhérent n'a jamais emprunté.</div>
                </div>
              : <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Ouvrage</th><th>Exemplaire</th><th>Emprunté le</th><th>Statut</th></tr>
                    </thead>
                    <tbody>
                      {historique.emprunts.map((e) => {
                        const retard = e.statut === "en_cours" && new Date(e.dateRetourPrevue) < new Date();
                        return (
                          <tr key={e._id}>
                            <td style={{ fontSize: 13, fontWeight: 500 }}>{e.ouvrageTitre}</td>
                            <td className="td-mono">{e.exemplaireCode}</td>
                            <td style={{ fontSize: 12, color: "var(--gris-doux)" }}>{fmt(e.dateEmprunt)}</td>
                            <td><Badge statut={retard ? "retard" : e.statut} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>}
          </>
        )}
      </Modal>

      {/* ── Modal Confirmation Suppression ──────────────────────────────── */}
      <Modal
        open={Boolean(confirmDel)}
        onClose={() => setConfirmDel(null)}
        title="Confirmer la suppression"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={supprimerAdherent} disabled={actionLoading}>
              {actionLoading ? <><span className="spinner" /> Suppression…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span> Supprimer</>}
            </button>
          </>
        }
      >
        {confirmDel && (
          <div style={{ fontSize: 14, color: "var(--gris-moyen)", lineHeight: 1.7 }}>
            <p>Supprimer définitivement :</p>
            <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-md)", padding: "12px 16px", margin: "12px 0", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, color: "var(--ivoire)" }}>{confirmDel.prenom} {confirmDel.nom}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--or-clair)" }}>{confirmDel.matricule}</div>
            </div>
            <p style={{ color: "var(--rouge-clair)", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>warning</span>
              Impossible si des emprunts sont en cours.
            </p>
          </div>
        )}
      </Modal>
    </section>
  );
}
