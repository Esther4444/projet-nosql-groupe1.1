import { useEffect, useState } from "react";
import { api } from "../api.js";

const MEDALS = [
  <span key="1" className="material-symbols-rounded" style={{ fontSize: 20, color: "#FCD34D" }}>military_tech</span>,
  <span key="2" className="material-symbols-rounded" style={{ fontSize: 20, color: "#9CA3AF" }}>military_tech</span>,
  <span key="3" className="material-symbols-rounded" style={{ fontSize: 20, color: "#D97706" }}>military_tech</span>,
];

export default function Stats() {
  const [top, setTop]       = useState([]);
  const [cats, setCats]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.topOuvrages(), api.topCategories()])
      .then(([t, c]) => { setTop(t); setCats(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxTop  = top[0]?.totalEmprunts  || 1;
  const maxCats = cats[0]?.totalEmprunts || 1;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Top 10 ouvrages */}
      <div className="card">
        <div className="card-header">
          <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: "var(--bleu-nuit)" }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: "var(--or)" }}>emoji_events</span>
            Top 10 ouvrages les plus empruntés
          </div>
          <div style={{ fontSize: 12, color: "var(--gris-doux)", marginTop: 2 }}>
            Calculé par agrégation MongoDB sur la collection <span style={{ fontFamily: "var(--font-mono)", color: "var(--or)" }}>emprunts</span>.
          </div>
        </div>
        <div className="card-body">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: i < 9 ? "1px solid var(--border)" : "none" }}>
                <div className="skeleton" style={{ width: 28, height: 28, borderRadius: "50%" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="skeleton" style={{ height: 14, width: `${60 + i * 3}%` }} />
                  <div className="skeleton" style={{ height: 8, width: `${20 + (10 - i) * 8}%` }} />
                </div>
                <div className="skeleton" style={{ width: 40, height: 18 }} />
              </div>
            ))
            : top.length === 0
            ? <div className="empty-state">
                <div className="empty-state-icon"><span className="material-symbols-rounded" style={{ fontSize: 56 }}>insert_chart</span></div>
                <div className="empty-state-title">Aucune donnée</div>
                <div className="empty-state-sub">Lancez le seed du backend pour alimenter les statistiques.</div>
              </div>
            : top.map((o, i) => (
              <div key={o.ouvrageId} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 0",
                borderBottom: i < top.length - 1 ? "1px solid rgba(201,168,76,0.06)" : "none",
              }}>
                {/* Rang */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: i < 3 ? 18 : 12,
                  background: i < 3 ? "rgba(201,168,76,0.12)" : "var(--surface-2)",
                  color: i < 3 ? "var(--or)" : "var(--gris-doux)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  border: i < 3 ? "1px solid rgba(201,168,76,0.2)" : "1px solid var(--border)",
                }}>
                  {i < 3 ? MEDALS[i] : String(i + 1).padStart(2, "0")}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ivoire)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.titre}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gris-doux)", marginTop: 2 }}>
                    {o.auteur}
                    {o.categorie && <span style={{ marginLeft: 8, color: "var(--or)", fontWeight: 600 }}>· {o.categorie}</span>}
                  </div>
                  {/* Barre */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <div className="progress-bar-track" style={{ height: 6 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${(o.totalEmprunts / maxTop) * 100}%`,
                          background: i === 0
                            ? "linear-gradient(90deg, #C9A84C, #E8C96A)"
                            : i === 1
                            ? "linear-gradient(90deg, #9CA3AF, #D1D5DB)"
                            : i === 2
                            ? "linear-gradient(90deg, #CD7F32, #E8A96A)"
                            : "linear-gradient(90deg, var(--bleu-clair), var(--bleu-accent))",
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--or-clair)", flexShrink: 0 }}>
                      {o.totalEmprunts} emprunt{o.totalEmprunts > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top catégories */}
      <div className="card">
        <div className="card-header">
          <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: "var(--bleu-nuit)" }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: "var(--bleu-accent)" }}>folder_open</span>
            Emprunts par catégorie
          </div>
          <div style={{ fontSize: 12, color: "var(--gris-doux)", marginTop: 2 }}>
            Agrégation avec <span style={{ fontFamily: "var(--font-mono)", color: "var(--or)" }}>$lookup</span> sur la collection ouvrages.
          </div>
        </div>
        <div className="card-body">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
                <div className="skeleton" style={{ width: "25%", height: 14 }} />
                <div className="skeleton" style={{ flex: 1, height: 10 }} />
                <div className="skeleton" style={{ width: 30, height: 14 }} />
              </div>
            ))
            : cats.length === 0
            ? <div className="empty-state">
                <div className="empty-state-icon"><span className="material-symbols-rounded" style={{ fontSize: 48 }}>folder_open</span></div>
                <div className="empty-state-title">Aucune donnée</div>
              </div>
            : cats.map((c, i) => (
              <div key={c.categorie} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 0",
                borderBottom: i < cats.length - 1 ? "1px solid rgba(201,168,76,0.06)" : "none",
              }}>
                <div style={{
                  width: 140, fontSize: 13, fontWeight: 600,
                  color: "var(--gris-fonce)", flexShrink: 0,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {c.categorie ?? "Non classé"}
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${(c.totalEmprunts / maxCats) * 100}%`,
                      background: `linear-gradient(90deg, hsl(${(i * 47 + 200) % 360}, 65%, 55%), hsl(${(i * 47 + 220) % 360}, 75%, 65%))`,
                    }}
                  />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--or-clair)", flexShrink: 0, minWidth: 30, textAlign: "right" }}>
                  {c.totalEmprunts}
                </span>
              </div>
            ))}
        </div>
      </div>

    </section>
  );
}
