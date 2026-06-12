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
  const [recherche, setRecherche]       = useState("");

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

  const filtres = adherents.filter((a) => {
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
          <span style={{ fontSize: 12, color: "var(--gris-doux)", alignSelf: "center" }}>
            {adherents.length} adhérent{adherents.length > 1 ? "s" : ""}
          </span>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>person_add</span>
            Créer un compte
          </button>
        </div>
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
                        {recherche ? "Aucun résultat pour cette recherche." : "Créez le premier adhérent."}
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
                      {a.role === "admin" ? "Admin" : a.type === "enseignant" ? "Enseignant" : "Étudiant"}
                    </span>
                  </td>
                  <td>
                    {a.statut === "inactif" ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ambre-clair)", background: "rgba(245,158,11,0.15)", padding: "3px 8px", borderRadius: "var(--radius-md)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>pending_actions</span> En attente
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--vert-clair)", background: "rgba(34,197,94,0.15)", padding: "3px 8px", borderRadius: "var(--radius-md)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>check_circle</span> Actif
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {a.statut === "inactif" && (
                        <button
                          className="btn btn-primary btn-sm btn-icon"
                          onClick={() => validerCompte(a)}
                          title="Activer le compte"
                          disabled={actionLoading}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>how_to_reg</span>
                        </button>
                      )}
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
          <div className="form-group">
            <label className="form-label">Type *</label>
            <select className="form-select" value={form.type} onChange={maj("type")}>
              <option value="etudiant">Étudiant (prêt 14 j)</option>
              <option value="enseignant">Enseignant (prêt 30 j)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Rôle *</label>
            <select className="form-select" value={form.role} onChange={maj("role")}>
              <option value="membre">Membre</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={maj("email")} placeholder="ex. e.malemba@uob.ga" />
          </div>
        </div>
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
