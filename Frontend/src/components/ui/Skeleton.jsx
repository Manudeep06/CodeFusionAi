/** Shimmering placeholder blocks shown while data loads. */
export default function Skeleton({ width = "100%", height = "0.9rem", radius, className = "", style }) {
  return <span className={`cf-skeleton ${className}`} style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="cf-room-card" aria-hidden="true">
      <Skeleton width="55%" height="0.85rem" />
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} width={i === lines - 1 ? "35%" : "85%"} height="0.65rem" />)}
    </div>
  );
}
