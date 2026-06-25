/** Graphique circulaire (donut) en SVG pur — segments animés au survol. */
export default function DonutChart({
  data,
  size = 220,
  thickness = 28,
  centerLabel,
  centerSub,
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={thickness}
          opacity={0.35}
        />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {data.map((d, i) => {
            const pct = d.value / total;
            const dash = pct * C;
            const gap = C - dash;
            const el = (
              <circle
                key={d.key ?? i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="donut-segment"
              >
                <title>{d.label} : {d.value} ({Math.round(pct * 100)}%)</title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        </g>
      </svg>
      {(centerLabel || centerSub) && (
        <div className="donut-center">
          {centerLabel && <div className="donut-center-value">{centerLabel}</div>}
          {centerSub && <div className="donut-center-sub">{centerSub}</div>}
        </div>
      )}
    </div>
  );
}
