/** Skeleton block générique */
export function Skeleton({ width = "100%", height = "16px", radius = "var(--radius-sm)" }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, flexShrink: 0 }}
      aria-hidden="true"
    />
  );
}

/** Skeleton pour une ligne de tableau */
export function SkeletonRow({ cols = 5 }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <Skeleton height="14px" width={i === 0 ? "80%" : i % 2 === 0 ? "60%" : "70%"} />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton pour une carte ouvrage */
export function SkeletonCard() {
  return (
    <div className="book-card book-card--v2" style={{ cursor: "default", pointerEvents: "none" }} aria-hidden="true">
      <Skeleton width="100%" height="88px" radius="0" />
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton height="16px" width="85%" />
        <Skeleton height="12px" width="55%" />
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton height="22px" width="72px" radius="var(--radius-full)" />
          <Skeleton height="22px" width="40px" radius="var(--radius-full)" />
        </div>
        <Skeleton height="6px" width="100%" radius="var(--radius-full)" />
      </div>
    </div>
  );
}

/** Skeleton pour une stat card */
export function SkeletonStatCard() {
  return (
    <div className="stat-card" aria-hidden="true">
      <Skeleton width="40px" height="40px" radius="var(--radius-md)" />
      <Skeleton height="36px" width="70px" />
      <Skeleton height="12px" width="90%" />
    </div>
  );
}
