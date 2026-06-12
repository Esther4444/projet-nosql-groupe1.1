import { useEffect, useState } from "react";
import { api } from "../api.js";
import { SkeletonStatCard } from "../components/Skeleton.jsx";

const fmt = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const STAT_DEFS = [
  {
    key:    "totalOuvrages",
    label:  "Ouvrages au catalogue",
    icon:   "auto_stories",
    accent: "#C9A84C",
    bg:     "rgba(201,168,76,0.12)",
  },
  {
    key:    "totalAdherents",
    label:  "Adhérents inscrits",
    icon:   "school",
    accent: "#3B72D9",
    bg:     "rgba(59,114,217,0.12)",
  },
  {
    key:    "totalEmpruntsEnCours",
    label:  "Emprunts en cours",
    icon:   "import_contacts",
    accent: "#22C55E",
    bg:     "rgba(34,197,94,0.12)",
  },
  {
    key:    "totalRetards",
    label:  "Retards à relancer",
    icon:   "warning",
    accent: "#EF4444",
    bg:     "rgba(239,68,68,0.12)",
  },
  {
    key:    "totalExemplairesDispos",
    label:  "Exemplaires disponibles",
    icon:   "check_circle",
    accent: "#22C55E",
    bg:     "rgba(34,197,94,0.08)",
  },
  {
    key:    "totalExemplaires",
    label:  "Exemplaires au total",
    icon:   "inventory_2",
    accent: "#8A8070",
    bg:     "rgba(138,128,112,0.1)",
  },
];

export default function Dashboard({ onNavigate }) {
  const [stats, setStats]     = useState(null);
  const [top, setTop]         = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboard(), api.topOuvrages()])
      .then(([s, t]) => { setStats(s); setTop(t.slice(0, 5)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Stat Cards */}
      <div className="stat-cards-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)
          : STAT_DEFS.map((def) => (
            <div
              key={def.key}
              className="stat-card"
              style={{ "--stat-accent": def.accent, "--stat-bg": def.bg }}
            >
              <div className="stat-card-icon"><span className="material-symbols-rounded" style={{ fontSize: 24, color: `var(--stat-accent)` }}>{def.icon}</span></div>
              <div className="stat-card-value">
                {stats?.[def.key] ?? 0}
                {def.key === "totalRetards" && (stats?.totalRetards ?? 0) > 0 && (
                  <span style={{ fontSize: 14, color: "var(--rouge-clair)", marginLeft: 6 }}>!</span>
                )}
              </div>
              <div className="stat-card-label">{def.label}</div>
            </div>
          ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Top 5 ouvrages */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "var(--ivoire)" }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--or)" }}>emoji_events</span> Top 5 ouvrages empruntés
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate("stats")}
              style={{ fontSize: 12 }}
            >
              Voir tout →
            </button>
          </div>
          <div className="card-body" style={{ padding: "12px 20px" }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="skeleton" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                  <div className="skeleton" style={{ flex: 1, height: 14 }} />
                  <div className="skeleton" style={{ width: 30, height: 14 }} />
                </div>
              ))
              : top.length === 0
              ? <div className="empty-state" style={{ padding: "30px 0" }}>
                  <div className="empty-state-icon"><span className="material-symbols-rounded" style={{ fontSize: 40 }}>insert_chart</span></div>
                  <div className="empty-state-sub">Aucune donnée disponible. Lancez le seed.</div>
                </div>
              : (() => {
                const max = top[0]?.totalEmprunts || 1;
                return top.map((o, i) => (
                  <div key={o.ouvrageId} style={{ padding: "10px 0", borderBottom: i < top.length - 1 ? "1px solid rgba(201,168,76,0.06)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 16, width: 24, textAlign: "center", color: i===0?"#FCD34D":i===1?"#9CA3AF":i===2?"#D97706":"var(--gris-doux)" }}>
                        {i < 3 ? <span className="material-symbols-rounded" style={{ fontSize: 20 }}>military_tech</span> : <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{i + 1}</span>}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ivoire)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {o.titre}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--or)", fontWeight: 700, flexShrink: 0 }}>
                        {o.totalEmprunts}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 34 }}>
                      <div className="progress-bar-track" style={{ height: 4 }}>
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${(o.totalEmprunts / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ));
              })()}
          </div>
        </div>

        {/* Derniers emprunts en cours */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "var(--ivoire)" }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--bleu-accent)" }}>content_paste</span> Emprunts récents en cours
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate("emprunts")}
              style={{ fontSize: 12 }}
            >
              Voir tout →
            </button>
          </div>
          <div className="card-body" style={{ padding: "0" }}>
            {loading
              ? <div style={{ padding: "12px 20px" }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div className="skeleton" style={{ height: 14, width: "60%" }} />
                      <div className="skeleton" style={{ height: 12, width: "40%" }} />
                    </div>
                  ))}
                </div>
              : !stats?.dernierEmprunts?.length
              ? <div className="empty-state" style={{ padding: "30px 20px" }}>
                  <div className="empty-state-icon"><span className="material-symbols-rounded" style={{ fontSize: 40 }}>mark_email_read</span></div>
                  <div className="empty-state-sub">Aucun emprunt en cours.</div>
                </div>
              : stats.dernierEmprunts.map((e) => {
                const retard = new Date(e.dateRetourPrevue) < new Date();
                return (
                  <div key={e._id} style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(201,168,76,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: retard ? "var(--rouge)" : "var(--vert)",
                      boxShadow: retard ? "0 0 6px var(--rouge)" : "0 0 6px var(--vert)",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ivoire)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.ouvrageTitre}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--gris-doux)" }}>
                        {e.adherentNom} · retour prévu {fmt(e.dateRetourPrevue)}
                      </div>
                    </div>
                    {retard && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--rouge-clair)", background: "rgba(239,68,68,0.12)", padding: "2px 8px", borderRadius: "var(--radius-full)", flexShrink: 0 }}>
                        RETARD
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Alerte retards globale */}
      {!loading && (stats?.totalRetards ?? 0) > 0 && (
        <div className="retard-alert" style={{ marginTop: 20 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: "var(--rouge-clair)" }}>warning</span>
          <span>
            <strong>{stats.totalRetards} emprunt{stats.totalRetards > 1 ? "s" : ""} en retard</strong> — pensez à relancer les adhérents concernés.
          </span>
          <button
            className="btn btn-danger btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => onNavigate("emprunts")}
          >
            Voir les retards
          </button>
        </div>
      )}
    </>
  );
}
