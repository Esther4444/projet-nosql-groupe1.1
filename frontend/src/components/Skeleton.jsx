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
    <div className="book-card" style={{ cursor: "default", gap: 12 }} aria-hidden="true">
      <div className="book-card-top">
        <Skeleton width="44px" height="56px" radius="4px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton height="18px" width="80%" />
          <Skeleton height="12px" width="55%" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton height="20px" width="80px" radius="var(--radius-full)" />
        <Skeleton height="20px" width="50px" radius="var(--radius-full)" />
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
