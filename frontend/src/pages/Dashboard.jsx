import { useEffect, useState } from "react";
import { api } from "../api.js";
import DonutChart from "../components/DonutChart.jsx";
import BurgerBars from "../components/BurgerBars.jsx";

const fmt = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

const CAT_COLORS = ["#0EA5E9", "#C9A84C", "#22C55E", "#A855F7", "#F59E0B"];

const KPI = [
  { key: "totalOuvrages", label: "Ouvrages", icon: "auto_stories", color: "var(--or)" },
  { key: "totalAdherents", label: "Adhérents", icon: "school", color: "var(--bleu-accent)" },
  { key: "totalEmpruntsEnCours", label: "Emprunts actifs", icon: "import_contacts", color: "var(--vert-clair)" },
  { key: "totalRetards", label: "Retards", icon: "warning", color: "var(--rouge-clair)", alert: true },
];

export default function Dashboard({ onNavigate }) {
  const [stats, setStats]     = useState(null);
  const [top, setTop]         = useState([]);
  const [cats, setCats]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboard(), api.topOuvrages(), api.topCategories()])
      .then(([s, t, c]) => {
        setStats(s);
        setTop(t.slice(0, 5));
        setCats(c.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const exDispos = stats?.totalExemplairesDispos ?? 0;
  const exTotal  = stats?.totalExemplaires ?? 0;
  const exOccupes = Math.max(0, exTotal - exDispos);
  const enCours = stats?.totalEmpruntsEnCours ?? 0;
  const retards = stats?.totalRetards ?? 0;
  const aJour   = Math.max(0, enCours - retards);

  const stockDonut = [
    { key: "d", label: "Disponibles", value: exDispos, color: "#22C55E" },
    { key: "o", label: "Occupés", value: exOccupes, color: "#0EA5E9" },
  ].filter((d) => d.value > 0);

  const empruntDonut = [
    { key: "ok", label: "À jour", value: aJour, color: "#22C55E" },
    { key: "ret", label: "En retard", value: retards, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const catDonut = cats.map((c, i) => ({
    key: c.categorie ?? i,
    label: c.categorie ?? "Non classé",
    value: c.totalEmprunts,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));
  const totalCat = catDonut.reduce((s, d) => s + d.value, 0);

  const burgerTop = top.map((o, i) => ({
    key: o.ouvrageId,
    label: o.titre,
    sub: o.auteur,
    value: o.totalEmprunts,
    color: i === 0
      ? "linear-gradient(90deg, #C9A84C, #E8C96A)"
      : `linear-gradient(90deg, ${CAT_COLORS[i % CAT_COLORS.length]}, ${CAT_COLORS[(i + 2) % CAT_COLORS.length]})`,
  }));

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-hero skeleton" style={{ height: 88 }} />
        <div className="stats-kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stats-kpi-card skeleton" style={{ height: 88 }} />
          ))}
        </div>
        <div className="dashboard-charts-grid">
          <div className="card skeleton" style={{ height: 280 }} />
          <div className="card skeleton" style={{ height: 280 }} />
          <div className="card skeleton" style={{ height: 280 }} />
        </div>
      </section>
    );
  }

  const tauxDispo = exTotal > 0 ? Math.round((exDispos / exTotal) * 100) : 0;

  return (
    <section className="dashboard-page">

      {/* Bandeau d'accueil */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-text">
          <h2 className="dashboard-hero-title">Vue d'ensemble</h2>
          <p className="dashboard-hero-sub">
            {exTotal} exemplaires · {tauxDispo}% disponibles
            {retards > 0 && (
              <span className="dashboard-hero-alert"> · {retards} retard{retards > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("catalogue")}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>auto_stories</span> Catalogue
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("stats")}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>bar_chart</span> Statistiques
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-kpi-grid">
        {KPI.map((k) => {
          const val = stats?.[k.key] ?? 0;
          const isAlert = k.alert && val > 0;
          return (
            <button
              key={k.key}
              type="button"
              className={`stats-kpi-card dashboard-kpi-card${isAlert ? " dashboard-kpi-card--alert" : ""}`}
              onClick={() => k.key === "totalRetards" && val > 0 ? onNavigate("emprunts") : undefined}
              style={{ cursor: k.key === "totalRetards" && val > 0 ? "pointer" : "default" }}
            >
              <span className="material-symbols-rounded stats-kpi-icon" style={{ color: k.color }}>{k.icon}</span>
              <div>
                <div className="stats-kpi-value" style={isAlert ? { color: "var(--rouge-clair)" } : undefined}>{val}</div>
                <div className="stats-kpi-label">{k.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Graphiques */}
      <div className="dashboard-charts-grid">
        <div className="card dashboard-chart-card">
          <div className="card-header">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: "var(--vert-clair)" }}>donut_large</span>
              Fonds documentaire
            </div>
          </div>
          <div className="card-body stats-donut-layout stats-donut-layout--compact">
            {exTotal === 0 ? (
              <p className="dashboard-empty-hint">Aucun exemplaire</p>
            ) : (
              <>
                <DonutChart data={stockDonut} size={168} thickness={22} centerLabel={`${tauxDispo}%`} centerSub="dispo" />
                <ul className="chart-legend chart-legend--compact">
                  {stockDonut.map((d) => (
                    <li key={d.key} className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: d.color }} />
                      <span className="chart-legend-label">{d.label}</span>
                      <span className="chart-legend-val">{d.value}</span>
                    </li>
                  ))}
                  <li className="chart-legend-item chart-legend-item--muted">
                    <span className="chart-legend-label">Total exemplaires</span>
                    <span className="chart-legend-val">{exTotal}</span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="card dashboard-chart-card">
          <div className="card-header">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: enCours > 0 && retards === 0 ? "var(--vert-clair)" : "var(--rouge-clair)" }}>pie_chart</span>
              Santé des emprunts
            </div>
          </div>
          <div className="card-body stats-donut-layout stats-donut-layout--compact">
            {enCours === 0 ? (
              <p className="dashboard-empty-hint">Aucun emprunt en cours</p>
            ) : (
              <>
                <DonutChart
                  data={empruntDonut}
                  size={168}
                  thickness={22}
                  centerLabel={enCours}
                  centerSub="actifs"
                />
                <ul className="chart-legend chart-legend--compact">
                  {empruntDonut.map((d) => (
                    <li key={d.key} className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: d.color }} />
                      <span className="chart-legend-label">{d.label}</span>
                      <span className="chart-legend-val">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="card dashboard-chart-card">
          <div className="card-header">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: "var(--bleu-accent)" }}>folder_open</span>
              Top catégories
            </div>
          </div>
          <div className="card-body stats-donut-layout stats-donut-layout--compact">
            {catDonut.length === 0 ? (
              <p className="dashboard-empty-hint">Pas encore de données</p>
            ) : (
              <>
                <DonutChart data={catDonut} size={168} thickness={22} centerLabel={totalCat} centerSub="emprunts" />
                <ul className="chart-legend chart-legend--compact">
                  {catDonut.map((d) => (
                    <li key={d.key} className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: d.color }} />
                      <span className="chart-legend-label" title={d.label}>{d.label}</span>
                      <span className="chart-legend-val">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bas : top 5 + activité récente */}
      <div className="dashboard-split">
        <div className="card dashboard-chart-card">
          <div className="card-header dashboard-card-header-row">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: "var(--or)" }}>emoji_events</span>
              Top 5 ouvrages
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("stats")}>Voir tout →</button>
          </div>
          <div className="card-body">
            {top.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <div className="empty-state-sub">Lancez le seed pour alimenter les données.</div>
              </div>
            ) : (
              <BurgerBars items={burgerTop} valueKey="value" labelKey="label" subKey="sub" />
            )}
          </div>
        </div>

        <div className="card dashboard-chart-card">
          <div className="card-header dashboard-card-header-row">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: "var(--bleu-accent)" }}>history</span>
              Activité récente
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("emprunts")}>Voir tout →</button>
          </div>
          <div className="card-body dashboard-activity">
            {!stats?.dernierEmprunts?.length ? (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <div className="empty-state-icon">
                  <span className="material-symbols-rounded" style={{ fontSize: 40 }}>mark_email_read</span>
                </div>
                <div className="empty-state-sub">Aucun emprunt en cours.</div>
              </div>
            ) : (
              stats.dernierEmprunts.map((e) => {
                const retard = new Date(e.dateRetourPrevue) < new Date();
                const initials = (e.adherentNom ?? "?")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <div key={e._id} className={`dashboard-activity-item${retard ? " dashboard-activity-item--retard" : ""}`}>
                    <div
                      className="dashboard-activity-avatar"
                      style={{
                        background: retard
                          ? "linear-gradient(135deg, #EF4444, #F87171)"
                          : "linear-gradient(135deg, var(--bleu-clair), var(--bleu-accent))",
                      }}
                    >
                      {initials}
                    </div>
                    <div className="dashboard-activity-body">
                      <div className="dashboard-activity-title">{e.ouvrageTitre}</div>
                      <div className="dashboard-activity-meta">
                        {e.adherentNom} · {e.exemplaireCode}
                      </div>
                      <div className="dashboard-activity-date">
                        Retour prévu {fmt(e.dateRetourPrevue)}
                      </div>
                    </div>
                    {retard ? (
                      <span className="dashboard-activity-badge dashboard-activity-badge--retard">Retard</span>
                    ) : (
                      <span className="dashboard-activity-badge dashboard-activity-badge--ok">En cours</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {retards > 0 && (
        <div className="retard-alert dashboard-retard-banner">
          <span className="material-symbols-rounded" style={{ fontSize: 22, color: "var(--rouge-clair)" }}>warning</span>
          <div className="dashboard-retard-text">
            <strong>{retards} emprunt{retards > 1 ? "s" : ""} en retard</strong>
            <span> — relancez les adhérents concernés.</span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => onNavigate("emprunts")}>
            Voir les retards
          </button>
        </div>
      )}
    </section>
  );
}
