/** Barres horizontales épaisses (« burger ») avec dégradé et animation. */
export default function BurgerBars({ items, maxValue, valueKey = "value", labelKey = "label", subKey }) {
  const max = maxValue || Math.max(...items.map((i) => i[valueKey]), 1);

  return (
    <div className="burger-bars">
      {items.map((item, i) => {
        const val = item[valueKey];
        const pct = (val / max) * 100;
        return (
          <div className="burger-row" key={item.key ?? i}>
            <div className="burger-meta">
              <span className="burger-rank">{String(i + 1).padStart(2, "0")}</span>
              <div className="burger-labels">
                <span className="burger-label">{item[labelKey]}</span>
                {subKey && item[subKey] && (
                  <span className="burger-sub">{item[subKey]}</span>
                )}
              </div>
              <span className="burger-value">{val}</span>
            </div>
            <div className="burger-track">
              <div
                className="burger-fill"
                style={{
                  width: `${pct}%`,
                  background: item.color ?? `linear-gradient(90deg, var(--bleu-clair), var(--bleu-accent))`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
