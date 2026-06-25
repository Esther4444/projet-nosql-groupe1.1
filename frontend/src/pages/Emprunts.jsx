import { useEffect, useState, Fragment } from "react";
import { api } from "../api.js";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import { SkeletonRow } from "../components/Skeleton.jsx";
import { toast } from "../components/Toast.jsx";

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const FILTRES = [
  { val: "en_cours", label: "En cours",  icon: "import_contacts" },
  { val: "retard",   label: "Retards",   icon: "warning" },
  { val: "rendu",    label: "Rendus",    icon: "task_alt" },
  { val: "",         label: "Tous",      icon: "list" },
];

export default function Emprunts({ user }) {
  const [data, setData]           = useState({ emprunts: [], total: 0, pages: 1 });
  const [filtre, setFiltre]       = useState("en_cours");
  const [recherche, setRecherche] = useState("");
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [confirmId, setConfirmId] = useState(null); // ID à confirmer pour retour
  const [actionLoading, setActionLoading] = useState(false);

  const charger = async (f = filtre, p = page, q = recherche) => {
    setLoading(true);
    try {
      const base = f === "retard"
        ? { retard: true }
        : f
        ? { statut: f }
        : {};
      const params = { ...base, page: p, limit: 30 };
      if (q && q.trim()) params.q = q.trim();
      const res = await api.emprunts(params);
      // Compatibilité si le backend retourne un tableau direct (ancien format)
      if (Array.isArray(res)) {
        setData({ emprunts: res, total: res.length, pages: 1 });
      } else {
        setData(res);
      }
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(filtre, 1, recherche); setPage(1); }, [filtre]);

  // Recherche débouncée : relance après 350 ms d'inactivité
  useEffect(() => {
    const t = setTimeout(() => { charger(filtre, 1, recherche); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [recherche]);

  const changerPage = (p) => { setPage(p); charger(filtre, p, recherche); };

  const confirmerRetour = async () => {
    setActionLoading(true);
    try {
      await api.rendre(confirmId);
      setConfirmId(null);
      await charger();
      toast("Retour enregistré — exemplaire à nouveau disponible.", "succes");
    } catch (e) {
      toast(e.message, "erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const empruntAConfirmer = data.emprunts.find((e) => e._id === confirmId);

  return (
    <section>
      {/* Filtres */}
      <div className="toolbar">
        <div className="filter-pills">
          {FILTRES.map((f) => (
            <button
              key={f.val}
              className={`filter-pill${filtre === f.val ? " active" : ""}`}
              onClick={() => setFiltre(f.val)}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <div className="search-input-wrapper">
            <span className="material-symbols-rounded search-icon">search</span>
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher ouvrage, adhérent, exemplaire…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            {recherche && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setRecherche("")}
                title="Effacer"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
              </button>
            )}
          </div>
          {!loading && (
            <span style={{ fontSize: 12, color: "var(--gris-doux)", alignSelf: "center", whiteSpace: "nowrap" }}>
              {data.total} emprunt{data.total > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ouvrage</th>
              <th>Exemplaire</th>
              <th>Adhérent</th>
              <th>Emprunté le</th>
              <th>Retour prévu</th>
              <th>Statut</th>
              {user?.role === "admin" && <th style={{ width: 140 }}></th>}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : data.emprunts.length === 0
              ? <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><span className="material-symbols-rounded" style={{ fontSize: 48 }}>library_books</span></div>
                      <div className="empty-state-title">Aucun emprunt</div>
                      <div className="empty-state-sub">
                        {recherche ? `Aucun résultat pour « ${recherche} ».` : "Aucun résultat pour ce filtre."}
                      </div>
                    </div>
                  </td>
                </tr>
              : data.emprunts.map((e) => {
                  const retard = e.statut === "en_cours" && new Date(e.dateRetourPrevue) < new Date();
                  return (
                    <tr key={e._id}>
                      <td style={{ maxWidth: 220 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.ouvrageTitre}
                        </div>
                      </td>
                      <td className="td-mono">{e.exemplaireCode}</td>
                      <td style={{ fontSize: 13 }}>{e.adherentNom}</td>
                      <td style={{ fontSize: 13, color: "var(--gris-doux)" }}>{fmt(e.dateEmprunt)}</td>
                      <td>
                        <span style={{
                          fontSize: 13,
                          fontWeight: retard ? 700 : 400,
                          color: retard ? "var(--rouge-clair)" : "var(--ivoire)",
                        }}>
                          {fmt(e.dateRetourPrevue)}
                        </span>
                      </td>
                      <td>
                        <Badge statut={retard ? "retard" : e.statut} />
                      </td>
                      {user?.role === "admin" && (
                        <td>
                          {e.statut === "en_cours" && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setConfirmId(e._id)}
                              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                            >
                              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>assignment_return</span>
                              Enregistrer le retour
                            </button>
                          )}
                          {e.statut === "rendu" && (
                            <span style={{ fontSize: 12, color: "var(--gris-doux)" }}>
                              Rendu le {fmt(e.dateRetourEffective)}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" onClick={() => changerPage(page - 1)} disabled={page === 1}>
            ← Préc.
          </button>
          {Array.from({ length: data.pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === data.pages || Math.abs(p - page) <= 1)
            .map((p, i, arr) => (
              <Fragment key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span style={{ color: "var(--gris-doux)" }}>…</span>
                )}
                <button
                  className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => changerPage(p)}
                >
                  {p}
                </button>
              </Fragment>
            ))}
          <button className="btn btn-ghost btn-sm" onClick={() => changerPage(page + 1)} disabled={page === data.pages}>
            Suiv. →
          </button>
        </div>
      )}
      <div className="pagination-info">
        {!loading && `Page ${page} / ${data.pages} — ${data.total} résultat${data.total > 1 ? "s" : ""}`}
      </div>

      {/* Modal confirmation retour */}
      <Modal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        title="Confirmer le retour"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={confirmerRetour} disabled={actionLoading}>
              {actionLoading ? <><span className="spinner" /> Traitement…</> : <><span className="material-symbols-rounded" style={{ fontSize: 16 }}>check</span> Confirmer le retour</>}
            </button>
          </>
        }
      >
        {empruntAConfirmer && (
          <div style={{ fontSize: 14, color: "var(--gris-moyen)", lineHeight: 1.7 }}>
            <p>Vous êtes sur le point d'enregistrer le retour de :</p>
            <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-md)", padding: "14px 16px", margin: "12px 0", border: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, color: "var(--ivoire)", marginBottom: 4 }}>{empruntAConfirmer.ouvrageTitre}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--or-clair)" }}>{empruntAConfirmer.exemplaireCode}</div>
              <div style={{ fontSize: 12, color: "var(--gris-doux)", marginTop: 4 }}>Emprunté par {empruntAConfirmer.adherentNom}</div>
            </div>
            <p>L'exemplaire redeviendra <strong style={{ color: "var(--vert-clair)" }}>disponible</strong> immédiatement.</p>
          </div>
        )}
      </Modal>
    </section>
  );
}
