import { useState, useEffect } from 'react'
import { buildMonthGrid, weekdayShort, addMonths, isSameDay, monthIdFromDate, getHolidayName, toIsoDate } from '../../lib/date'
import { motion, AnimatePresence } from 'framer-motion'
import { loadJson } from '../../lib/storage'

export function CalendarGrid({
  visibleMonth, setVisibleMonth,
  rangeStart, setRangeStart,
  rangeEnd, setRangeEnd,
  isDark,
  mobile = false,
}) {
  const grid      = buildMonthGrid(visibleMonth)
  const weekdays  = weekdayShort()
  const monthId   = monthIdFromDate(visibleMonth)
  const [dateNotes, setDateNotes] = useState({})

  useEffect(() => {
    const allNotes = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('date_note_')) {
        const note = loadJson(key)
        if (note && note.trim() !== '') allNotes[key.replace('date_note_', '')] = true
      }
    }
    setDateNotes(allNotes)
  }, [visibleMonth, monthId])

  const handlePrevMonth = () => setVisibleMonth(prev => addMonths(prev, -1))
  const handleNextMonth = () => setVisibleMonth(prev => addMonths(prev, 1))

  const handleDayClick = (cell) => {
    if (!cell.inCurrentMonth)
      setVisibleMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1, 12, 0, 0))
    const d = cell.date
    if (!rangeStart) {
      setRangeStart(d); setRangeEnd(null)
    } else if (!rangeEnd) {
      if (isSameDay(d, rangeStart)) { setRangeStart(null); setRangeEnd(null) }
      else if (d < rangeStart)       { setRangeStart(d); setRangeEnd(rangeStart) }
      else                            setRangeEnd(d)
    } else {
      setRangeStart(d); setRangeEnd(null)
    }
  }

  const isInRange = d =>
    rangeStart && rangeEnd &&
    d > Math.min(+rangeStart, +rangeEnd) &&
    d < Math.max(+rangeStart, +rangeEnd)
  const isStart = d => rangeStart && isSameDay(d, rangeStart)
  const isEnd   = d => rangeEnd   && isSameDay(d, rangeEnd)

  // Responsive sizes
  const circleSize  = mobile ? 'w-8 h-8'    : 'w-9 h-9'
  const fontSize    = mobile ? 'text-[11px]' : 'text-[12px]'
  const navBtnSize  = mobile ? 'w-6 h-6 text-sm' : 'w-7 h-7 text-base'
  const labelSize   = mobile ? 'text-[8px]'  : 'text-[9px]'
  const weekdaySize = mobile ? 'text-[8px]'  : 'text-[9px]'

  // Colour tokens
  const col = {
    label:   isDark ? 'text-white/35'  : 'text-gray-400',
    normal:  isDark ? 'text-white/85 hover:bg-white/12' : 'text-gray-700 hover:bg-black/7',
    weekend: isDark ? 'text-rose-400 hover:bg-rose-500/22' : 'text-rose-500 hover:bg-rose-500/12',
    outside: isDark ? 'text-white/18'  : 'text-gray-300',
    navBtn:  isDark ? 'bg-white/8 border-white/12 text-white/55 hover:bg-white/18 hover:text-white' : 'bg-black/5 border-black/10 text-gray-500 hover:bg-black/12 hover:text-gray-800',
    divider: isDark ? 'border-white/8' : 'border-black/6',
    legend:  isDark ? 'text-white/28'  : 'text-gray-400',
  }

  const slideVariants = {
    enter:  { opacity: 0, y: 6 },
    center: { opacity: 1, y: 0 },
    exit:   { opacity: 0, y: -6 },
  }

  return (
    <div className="h-full flex flex-col gap-1">

      {/* ── Nav row ────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-[0.2em] uppercase ${labelSize} ${col.label}`}>
            Select
          </span>
          <button
            onClick={() => {
              const t = new Date()
              setVisibleMonth(new Date(t.getFullYear(), t.getMonth(), 1, 12, 0, 0))
              setRangeStart(t); setRangeEnd(null)
            }}
            className={`px-2.5 py-0.5 rounded-full font-black transition-all active:scale-95 text-white shadow-md leading-5 ${labelSize}`}
            style={{
              background: 'var(--accent)',
              boxShadow: '0 2px 10px color-mix(in oklab, var(--accent), transparent 55%)',
            }}
          >TODAY</button>

          {rangeStart && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => { setRangeStart(null); setRangeEnd(null) }}
              className={`px-2 py-0.5 rounded-full font-bold border transition-all active:scale-95 leading-5 ${labelSize} ${
                isDark ? 'bg-rose-500/18 border-rose-400/25 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-500'
              }`}
            >✕</motion.button>
          )}
        </div>

        <div className="flex gap-1">
          {[['‹', handlePrevMonth, 'Previous'], ['›', handleNextMonth, 'Next']].map(([icon, fn, label]) => (
            <button key={label} type="button" onClick={fn} aria-label={label}
              className={`flex items-center justify-center rounded-full border transition-all active:scale-90 ${navBtnSize} ${col.navBtn}`}
            >{icon}</button>
          ))}
        </div>
      </div>

      {/* ── Weekday headers ─────────────────────────────────── */}
      <div className="grid grid-cols-7 shrink-0">
        {weekdays.map(w => {
          const isWknd = w === 'Sun' || w === 'Sat'
          return (
            <div key={w} className={`text-center font-black tracking-widest uppercase ${weekdaySize} ${
              isWknd
                ? (isDark ? 'text-rose-400/70' : 'text-rose-400')
                : col.label
            }`}>{w[0]}</div>
          )
        })}
      </div>

      {/* ── Calendar grid ───────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={monthId}
            variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 grid-rows-6 h-full"
          >
            {grid.map(cell => {
              const d       = cell.date
              const start   = isStart(d)
              const end     = isEnd(d)
              const between = isInRange(d)
              const active  = start || end || between
              const holiday = getHolidayName(d)
              const hasNote = dateNotes[toIsoDate(d)]
              const weekend = d.getDay() === 0 || d.getDay() === 6
              const showLeft  = (between || end)   && rangeEnd
              const showRight = (between || start) && rangeEnd

              let cls = `relative z-10 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer select-none ${circleSize} ${fontSize} font-semibold `

              if (start || end) {
                cls += 'text-white font-black shadow-lg scale-[1.1] z-20 '
              } else if (between) {
                cls += isDark ? 'bg-[var(--accent)]/18 text-white/90 ' : 'bg-[var(--accent)]/10 text-gray-700 '
              } else if (!cell.inCurrentMonth) {
                cls += col.outside + ' '
              } else if (weekend) {
                cls += col.weekend + ' hover:scale-110 active:scale-95 '
              } else {
                cls += col.normal + ' hover:scale-110 active:scale-95 '
              }

              if (cell.isToday && !active) {
                cls += isDark
                  ? 'ring-2 ring-yellow-400/80 text-yellow-300 bg-yellow-400/10 font-bold '
                  : 'ring-2 ring-yellow-500/60 text-yellow-600 bg-yellow-50 font-bold '
              }

              return (
                <div key={monthId + cell.iso} className="relative group flex items-center justify-center">
                  {showLeft  && (
                    <div className="absolute left-0 inset-y-[28%] w-1/2 z-0 pointer-events-none"
                      style={{ background: 'color-mix(in oklab, var(--accent), transparent 82%)' }} />
                  )}
                  {showRight && (
                    <div className="absolute right-0 inset-y-[28%] w-1/2 z-0 pointer-events-none"
                      style={{ background: 'color-mix(in oklab, var(--accent), transparent 82%)' }} />
                  )}

                  <button
                    type="button"
                    onClick={() => handleDayClick(cell)}
                    className={cls}
                    style={(start || end) ? {
                      background: 'var(--accent)',
                      boxShadow: '0 4px 16px color-mix(in oklab, var(--accent), transparent 45%)',
                    } : {}}
                    title={holiday || ''}
                  >
                    {d.getDate()}
                    {holiday && <span className="absolute top-[1px] right-[1px] w-[4px] h-[4px] rounded-full bg-rose-400 pointer-events-none" />}
                    {hasNote  && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-sky-400 pointer-events-none" />}
                  </button>

                  {/* Holiday tooltip — desktop only (group-hover) */}
                  {holiday && !mobile && (
                    <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-950/95 text-white text-[9px] font-semibold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl pointer-events-none border border-white/10">
                      {holiday}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[3px] border-transparent border-t-gray-950/95" />
                    </div>
                  )}
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      {!mobile && (
        <div className={`flex items-center gap-4 shrink-0 pt-1 border-t ${col.divider}`}>
          {[['bg-rose-400','Holiday'],['bg-sky-400','Has Note'],[null,'Today']].map(([bg, lbl]) => (
            <span key={lbl} className={`flex items-center gap-1.5 text-[8px] font-bold tracking-wide uppercase ${col.legend}`}>
              {bg
                ? <span className={`w-[5px] h-[5px] rounded-full ${bg}`} />
                : <span className="w-[5px] h-[5px] rounded-full ring-1 ring-yellow-400" />
              }
              {lbl}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
