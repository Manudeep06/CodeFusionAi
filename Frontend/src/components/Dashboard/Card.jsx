export function Card({ children, className = "", delay = 0, accentColor = "purple", noPad = false }) {
  const glows = {
    purple: "hover:border-purple-500/35 hover:shadow-[0_0_70px_-10px_rgba(168,85,247,0.45)]",
    blue:   "hover:border-blue-500/35   hover:shadow-[0_0_70px_-10px_rgba(59,130,246,0.45)]",
    none:   "hover:border-white/[0.12]",
  };
  const topEdge = {
    purple: "via-purple-400/60",
    blue:   "via-blue-400/60",
    none:   "via-white/12",
  };
  const cornerGlow = {
    purple: "from-purple-500/[0.08]",
    blue:   "from-blue-500/[0.08]",
    none:   "from-white/[0.03]",
  };
  return (
    <div
      className={`animate-card-enter relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] via-white/[0.02] to-transparent backdrop-blur-2xl shadow-[0_12px_48px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-500 group ${glows[accentColor] ?? glows.purple} ${noPad ? "" : "p-6 md:p-8"} ${className}`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      {/* Top prismatic line */}
      <div className={`absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent ${topEdge[accentColor]} to-transparent`} />
      {/* Corner radiance */}
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${cornerGlow[accentColor]} to-transparent rounded-bl-full pointer-events-none`} />
      {children}
    </div>
  );
}

export default Card;
