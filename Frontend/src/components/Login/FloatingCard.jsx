function FloatingCard({ children, className = "", style = {} }) {
  return (
    <div
      className={`absolute rounded-2xl border border-white/[0.10] backdrop-blur-xl shadow-2xl ${className}`}
      style={{ background: "rgba(10,14,30,0.85)", ...style }}
    >
      {/* top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent rounded-t-2xl" />
      {children}
    </div>
  );
}

export default FloatingCard;
