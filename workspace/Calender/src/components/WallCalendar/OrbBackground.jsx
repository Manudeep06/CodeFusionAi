import { motion } from 'framer-motion'

export function OrbBackground({ isDark }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 130% 90% at 15% 10%, #0d1535 0%, #060a12 100%)'
            : 'radial-gradient(ellipse 130% 90% at 20% 10%, #dde8ff 0%, #edf2ff 60%, #f5f0ff 100%)',
        }}
      />

      {/* Orb 1 — top-left */}
      <motion.div
        animate={{ scale: [1, 1.08, 0.95, 1], opacity: isDark ? [0.5, 0.65, 0.45, 0.5] : [0.3, 0.42, 0.27, 0.3] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full filter blur-[80px]"
        style={{ background: 'var(--accent)' }}
      />

      {/* Orb 2 — bottom-right */}
      <motion.div
        animate={{ scale: [1, 1.15, 0.88, 1], opacity: isDark ? [0.38, 0.55, 0.33, 0.38] : [0.22, 0.35, 0.18, 0.22] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-[15%] -right-[10%] w-[60vw] h-[60vw] rounded-full filter blur-[90px]"
        style={{ background: 'color-mix(in oklab, var(--accent), white 30%)' }}
      />

      {/* Orb 3 — centre */}
      <motion.div
        animate={{ scale: [1, 1.06, 1.1, 1], opacity: isDark ? [0.25, 0.4, 0.22, 0.25] : [0.14, 0.24, 0.12, 0.14] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[25%] left-[25%] w-[45vw] h-[45vw] rounded-full filter blur-[70px]"
        style={{ background: 'color-mix(in oklab, var(--accent), black 10%)' }}
      />

      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDark ? 0.035 : 0.018,
          mixBlendMode: 'overlay',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  )
}
