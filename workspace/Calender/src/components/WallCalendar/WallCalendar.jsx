import { useState, useEffect } from 'react'
import { HeroPanel } from './HeroPanel'
import { CalendarGrid } from './CalendarGrid'
import { NotesPanel } from './NotesPanel'
import { OrbBackground } from './OrbBackground'
import { monthImages, fallbacks } from '../../lib/images'
import { motion, AnimatePresence } from 'framer-motion'

const MONTH_ACCENTS = [
  '#0288D1', '#E91E63', '#4CAF50', '#7B61FF',
  '#689F38', '#00ACC1', '#FF7043', '#FBC02D',
  '#F57C00', '#E65100', '#7C5CBF', '#D32F2F',
]

export function WallCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0, 0, 0)
  )
  const [rangeStart, setRangeStart]   = useState(null)
  const [rangeEnd,   setRangeEnd]     = useState(null)
  const [isDark,     setIsDark]       = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  )
  // Mobile: 'calendar' | 'notes'
  const [mobileTab, setMobileTab] = useState('calendar')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', MONTH_ACCENTS[visibleMonth.getMonth()])
  }, [visibleMonth])

  // Switch to notes tab automatically when range is completed
  useEffect(() => {
    if (rangeStart && rangeEnd) setMobileTab('notes')
  }, [rangeEnd])

  const monthIdx = visibleMonth.getMonth()

  const sharedProps = {
    visibleMonth, setVisibleMonth,
    rangeStart, setRangeStart,
    rangeEnd,   setRangeEnd,
    isDark,
  }

  return (
    <div className="relative w-full h-[100svh] flex items-center justify-center overflow-hidden font-[Poppins]">

      {/* ── Background ──────────────────────────────────────── */}
      <OrbBackground isDark={isDark} />

      {/* Ambient blur photo */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={monthIdx}
          src={monthImages[monthIdx]}
          onError={e => { e.target.src = fallbacks[monthIdx] }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: isDark ? 0.12 : 0.06, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          className="absolute inset-[-12%] w-[124%] h-[124%] object-cover blur-[100px] z-0 pointer-events-none select-none"
          aria-hidden="true" alt=""
        />
      </AnimatePresence>

      {/* ── Toggle button ──────────────────────────────────── */}
      <motion.button
        id="dark-mode-toggle"
        onClick={() => setIsDark(v => !v)}
        aria-label="Toggle dark mode"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`absolute top-3 right-3 z-30 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full backdrop-blur-xl border shadow-2xl text-lg sm:text-xl transition-colors duration-300 ${
          isDark
            ? 'bg-white/10 border-white/15 hover:bg-white/20'
            : 'bg-white/90 border-white/60 hover:bg-white'
        }`}
      >
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >{isDark ? '☀️' : '🌙'}</motion.span>
      </motion.button>

      {/* ── Range status pill (floating) ────────────────────── */}
      <AnimatePresence>
        {(rangeStart || rangeEnd) && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold text-white border backdrop-blur-xl shadow-lg max-w-[calc(100%-100px)] truncate"
            style={{
              background: 'color-mix(in oklab, var(--accent), transparent 25%)',
              borderColor: 'color-mix(in oklab, var(--accent), transparent 50%)',
              boxShadow: '0 4px 20px color-mix(in oklab, var(--accent), transparent 55%)'
            }}
          >
            <span>📅</span>
            <span className="truncate">
              {rangeStart && rangeEnd
                ? `${rangeStart.toLocaleDateString()} – ${rangeEnd.toLocaleDateString()}`
                : `From ${rangeStart?.toLocaleDateString()}…`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main card ───────────────────────────────────────── */}
      <div className="relative z-10 w-full h-full flex flex-col px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className={`flex flex-col flex-1 min-h-0 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden backdrop-blur-[48px] transition-all duration-500 ${
            isDark
              ? 'bg-white/[0.06] border border-white/[0.10]'
              : 'bg-white/75 border border-white/90'
          }`}
          style={{
            boxShadow: isDark
              ? '0 32px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 24px 80px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >

          {/* ══════════════════════════════════════════════════
              MOBILE: Tab bar at the top (hidden on md+)
          ══════════════════════════════════════════════════ */}
          <div className={`md:hidden flex shrink-0 border-b ${isDark ? 'border-white/8' : 'border-black/6'}`}>
            {['calendar', 'notes'].map(tab => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
                  mobileTab === tab
                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                    : isDark ? 'text-white/35' : 'text-gray-400'
                }`}
              >
                {tab === 'calendar' ? '📅 Calendar' : '📝 Notes'}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════
              DESKTOP: Full two-column layout (hidden on < md)
          ══════════════════════════════════════════════════ */}
          <div className="hidden md:grid flex-1 min-h-0 grid-cols-[1.1fr_1px_0.9fr]">
            {/* Left */}
            <div className="flex flex-col min-h-0 overflow-hidden px-4 lg:px-5 pt-4 lg:pt-5 pb-3 lg:pb-4">
              <div className="shrink-0 mb-3">
                <HeroPanel visibleMonth={visibleMonth} />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <CalendarGrid {...sharedProps} />
              </div>
            </div>
            {/* Divider */}
            <div className={`${isDark ? 'bg-white/[0.07]' : 'bg-black/[0.05]'}`} />
            {/* Right */}
            <div className="flex flex-col min-h-0 overflow-hidden px-4 lg:px-5 pt-4 lg:pt-5 pb-3 lg:pb-4">
              <NotesPanel {...sharedProps} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              MOBILE: Single tab panel (hidden on md+)
          ══════════════════════════════════════════════════ */}
          <div className="md:hidden flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {mobileTab === 'calendar' ? (
                <motion.div
                  key="cal"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col h-full px-3 pt-3 pb-2 gap-2 overflow-hidden"
                >
                  <div className="shrink-0">
                    <HeroPanel visibleMonth={visibleMonth} mobile />
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <CalendarGrid {...sharedProps} mobile />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col h-full px-3 pt-3 pb-2 overflow-hidden"
                >
                  <NotesPanel {...sharedProps} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
