function StatCard({ label, value, sub, icon, colorClass, glowHex, barWidth = "60%", delay = 0 }) {
  return (
    <div
      className="animate-card-enter relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-xl p-5 hover:scale-[1.04] hover:border-white/[0.15] transition-all duration-300 cursor-default group shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      {/* Top glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {/* Corner bg glow */}
      <div
        className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"
        style={{ background: glowHex }}
      />
      {/* Icon pill */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg"
          style={{ background: `${glowHex}28`, color: glowHex, boxShadow: `0 0 12px ${glowHex}40` }}
        >
          {icon}
        </div>
      </div>
      {/* Value */}
      <div className={`text-[1.65rem] font-black font-mono leading-none ${colorClass} mb-1`}>{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-3">{sub}</div>
      {/* Progress bar */}
      <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: barWidth, background: `linear-gradient(90deg, ${glowHex}80, ${glowHex})` }}
        />
      </div>
    </div>
  );
}

export default StatCard;
