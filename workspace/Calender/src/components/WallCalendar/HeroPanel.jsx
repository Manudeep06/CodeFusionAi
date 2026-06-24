import { motion, AnimatePresence } from 'framer-motion'
import { monthImages, fallbacks } from '../../lib/images'

export function HeroPanel({ visibleMonth, mobile = false }) {
  const monthIndex = visibleMonth.getMonth()
  const height = mobile ? '130px' : '230px'

  return (
    <div
      className="relative w-full overflow-hidden shadow-xl"
      style={{ height, borderRadius: mobile ? '1rem' : '1.25rem' }}
    >
      {/* Crossfade image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={monthIndex}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 z-0"
        >
          <img
            src={monthImages[monthIndex]}
            onError={e => { e.target.src = fallbacks[monthIndex] }}
            alt={`${visibleMonth.toLocaleString('default', { month: 'long' })} scenery`}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/45 via-transparent to-transparent pointer-events-none" />

      {/* "WALL CALENDAR" badge — desktop only */}
      {!mobile && (
        <div className="absolute top-3 left-4 z-20">
          <span className="text-white/50 text-[9px] font-black uppercase tracking-[0.28em]">
            Wall Calendar
          </span>
        </div>
      )}

      {/* Bottom: month name */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 ${mobile ? 'px-3 pb-2.5' : 'px-5 pb-4'}`}>
        {/* Accent underline */}
        <div
          className={`rounded-full mb-1.5 ${mobile ? 'w-5 h-[2px]' : 'w-8 h-[2px] mb-2.5'}`}
          style={{ background: 'var(--accent)' }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={monthIndex + '-label'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          >
            <div className="flex items-baseline gap-2">
              <h2
                className={`text-white font-black tracking-tight leading-none ${mobile ? 'text-2xl' : 'text-4xl'}`}
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
              >
                {visibleMonth.toLocaleString('default', { month: 'long' })}
              </h2>
              <span className={`text-white/55 font-semibold ${mobile ? 'text-sm' : 'text-lg'}`}>
                {visibleMonth.getFullYear()}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Shimmer arc — desktop only */}
      {!mobile && (
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none z-10 opacity-20"
          style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
        />
      )}
    </div>
  )
}
