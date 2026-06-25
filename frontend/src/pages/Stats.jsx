import { useEffect, useState } from "react";
import { api } from "../api.js";
import DonutChart from "../components/DonutChart.jsx";
import BurgerBars from "../components/BurgerBars.jsx";

const CAT_COLORS = [
  "#0EA5E9", "#C9A84C", "#22C55E", "#A855F7", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6",
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Stats() {
  const [top, setTop]         = useState([]);
  const [cats, setCats]       = useState([]);
  const [dash, setDash]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.topOuvrages(), api.topCategories(), api.dashboard()])
      .then(([t, c, d]) => { setTop(t); setCats(c); setDash(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalEmpruntsCats = cats.reduce((s, c) => s + c.totalEmprunts, 0);
  const totalTopEmprunts  = top.reduce((s, o) => s + o.totalEmprunts, 0);

  const catDonutData = cats.map((c, i) => ({
    key: c.categorie ?? i,
    label: c.categorie ?? "Non classé",
    value: c.totalEmprunts,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));

  const exDispos = dash?.totalExemplairesDispos ?? 0;
  const exTotal  = dash?.totalExemplaires ?? 0;
  const exOccupes = Math.max(0, exTotal - exDispos);

  const stockDonutData = [
    { key: "dispo", label: "Disponibles", value: exDispos, color: "#22C55E" },
    { key: "occupe", label: "Empruntés / réservés", value: exOccupes, color: "#0EA5E9" },
  ].filter((d) => d.value > 0);

  const top5DonutData = top.slice(0, 5).map((o, i) => ({
    key: o.ouvrageId,
    label: o.titre,
    value: o.totalEmprunts,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }));
  const autresTop = totalTopEmprunts - top.slice(0, 5).reduce((s, o) => s + o.totalEmprunts, 0);
  if (autresTop > 0 && top.length > 5) {
    top5DonutData.push({ key: "autres", label: "Autres (top 6–10)", value: autresTop, color: "#94A3B8" });
  }

  const burgerTop = top.map((o, i) => ({
    key: o.ouvrageId,
    label: o.titre,
    sub: o.auteur,
    value: o.totalEmprunts,
    color: i === 0
      ? "linear-gradient(90deg, #C9A84C, #E8C96A)"
      : i === 1
      ? "linear-gradient(90deg, #9CA3AF, #D1D5DB)"
      : i === 2
      ? "linear-gradient(90deg, #CD7F32, #E8A96A)"
      : `linear-gradient(90deg, ${CAT_COLORS[i % CAT_COLORS.length]}, ${CAT_COLORS[(i + 2) % CAT_COLORS.length]})`,
  }));

  const burgerCats = cats.map((c, i) => ({
    key: c.categorie ?? i,
    label: c.categorie ?? "Non classé",
    value: c.totalEmprunts,
    color: `linear-gradient(90deg, ${CAT_COLORS[i % CAT_COLORS.length]}, ${CAT_COLORS[(i + 3) % CAT_COLORS.length]})`,
  }));

  if (loading) {
    return (
      <section className="stats-page">
        <div className="stats-kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stats-kpi-card skeleton" style={{ height: 100 }} />
          ))}
        </div>
        <div className="stats-charts-grid">
          <div className="card skeleton" style={{ height: 340 }} />
          <div className="card skeleton" style={{ height: 340 }} />
        </div>
      </section>
    );
  }

  return (
    <section className="stats-page">

      {/* KPIs */}
      {dash && (
        <div className="stats-kpi-grid">
          <div className="stats-kpi-card">
            <span className="material-symbols-rounded stats-kpi-icon" style={{ color: "var(--or)" }}>auto_stories</span>
            <div>
              <div className="stats-kpi-value">{dash.totalOuvrages}</div>
              <div className="stats-kpi-label">Ouvrages</div>
            </div>
          </div>
          <div className="stats-kpi-card">
            <span className="material-symbols-rounded stats-kpi-icon" style={{ color: "var(--bleu-accent)" }}>import_contacts</span>
            <div>
              <div className="stats-kpi-value">{dash.totalEmpruntsEnCours}</div>
              <div className="stats-kpi-label">Emprunts en cours</div>
            </div>
          </div>
          <div className="stats-kpi-card">
            <span className="material-symbols-rounded stats-kpi-icon" style={{ color: "var(--vert-clair)" }}>inventory_2</span>
            <div>
              <div className="stats-kpi-value">{exDispos}<span className="stats-kpi-sub">/{exTotal}</span></div>
              <div className="stats-kpi-label">Exemplaires disponibles</div>
            </div>
          </div>
          <div className="stats-kpi-card">
            <span className="material-symbols-rounded stats-kpi-icon" style={{ color: dash.totalRetards > 0 ? "var(--rouge-clair)" : "var(--gris-doux)" }}>warning</span>
            <div>
              <div className="stats-kpi-value" style={{ color: dash.totalRetards > 0 ? "var(--rouge-clair)" : undefined }}>{dash.totalRetards}</div>
              <div className="stats-kpi-label">Retards</div>
            </div>
          </div>
        </div>
      )}

      {/* Donuts */}
      <div className="stats-charts-grid">
        <div className="card stats-chart-card">
          <div className="card-header">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: "var(--bleu-accent)" }}>donut_large</span>
              Répartition par catégorie
            </div>
            <p className="stats-chart-sub">Agrégation <code>$lookup</code> + <code>$group</code></p>
          </div>
          <div className="card-body stats-donut-layout">
            {cats.length === 0 ? (
              <div className="empty-state"><div className="empty-state-title">Aucune donnée</div></div>
            ) : (
              <>
                <DonutChart
                  data={catDonutData}
                  centerLabel={totalEmpruntsCats}
                  centerSub="emprunts"
                />
                <ul className="chart-legend">
                  {catDonutData.map((d) => (
                    <li key={d.key} className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: d.color }} />
                      <span className="chart-legend-label">{d.label}</span>
                      <span className="chart-legend-val">{d.value}</span>
                      <span className="chart-legend-pct">{Math.round((d.value / totalEmpruntsCats) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="card stats-chart-card">
          <div className="card-header">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: "var(--vert-clair)" }}>pie_chart</span>
              État du fonds documentaire
            </div>
            <p className="stats-chart-sub">Exemplaires disponibles vs occupés</p>
          </div>
          <div className="card-body stats-donut-layout">
            {exTotal === 0 ? (
              <div className="empty-state"><div className="empty-state-title">Aucun exemplaire</div></div>
            ) : (
              <>
                <DonutChart
                  data={stockDonutData}
                  centerLabel={`${Math.round((exDispos / exTotal) * 100)}%`}
                  centerSub="disponibles"
                />
                <ul className="chart-legend">
                  {stockDonutData.map((d) => (
                    <li key={d.key} className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ background: d.color }} />
                      <span className="chart-legend-label">{d.label}</span>
                      <span className="chart-legend-val">{d.value}</span>
                      <span className="chart-legend-pct">{Math.round((d.value / exTotal) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 donut + burger top 10 */}
      <div className="stats-charts-grid stats-charts-grid--wide">
        <div className="card stats-chart-card">
          <div className="card-header">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: "var(--or)" }}>emoji_events</span>
              Part des ouvrages les plus lus
            </div>
            <p className="stats-chart-sub">Top 5 du classement (agrégation MongoDB)</p>
          </div>
          <div className="card-body stats-donut-layout stats-donut-layout--compact">
            {top.length === 0 ? (
              <div className="empty-state"><div className="empty-state-title">Aucune donnée</div></div>
            ) : (
              <>
                <DonutChart data={top5DonutData} size={200} thickness={26} centerLabel={totalTopEmprunts} centerSub="total top 10" />
                <ul className="chart-legend chart-legend--compact">
                  {top5DonutData.map((d, i) => (
                    <li key={d.key} className="chart-legend-item">
                      <span className="chart-legend-rank">{i < 3 ? MEDALS[i] : `${i + 1}.`}</span>
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

        <div className="card stats-chart-card">
          <div className="card-header">
            <div className="stats-chart-title">
              <span className="material-symbols-rounded" style={{ color: "var(--bleu-accent)" }}>bar_chart</span>
              Top 10 — barres de classement
            </div>
            <p className="stats-chart-sub">Volume d'emprunts par ouvrage</p>
          </div>
          <div className="card-body">
            {top.length === 0 ? (
              <div className="empty-state"><div className="empty-state-title">Aucune donnée</div></div>
            ) : (
              <BurgerBars items={burgerTop} valueKey="value" labelKey="label" subKey="sub" />
            )}
          </div>
        </div>
      </div>

      {/* Burger catégories pleine largeur */}
      <div className="card stats-chart-card">
        <div className="card-header">
          <div className="stats-chart-title">
            <span className="material-symbols-rounded" style={{ color: "var(--or-clair)" }}>folder_open</span>
            Emprunts par catégorie — vue barres
          </div>
          <p className="stats-chart-sub">Comparaison visuelle des catégories les plus empruntées</p>
        </div>
        <div className="card-body">
          {cats.length === 0 ? (
            <div className="empty-state"><div className="empty-state-title">Aucune donnée</div></div>
          ) : (
            <BurgerBars items={burgerCats} valueKey="value" labelKey="label" />
          )}
        </div>
      </div>

    </section>
  );
}
