import { useEffect, useState } from 'react'
import { loadJson, saveJson } from '../../lib/storage'
import { monthIdFromDate, toIsoDate, clampRange } from '../../lib/date'
import { motion, AnimatePresence } from 'framer-motion'

export function NotesPanel({ visibleMonth, rangeStart, rangeEnd, isDark }) {
  const [monthNote, setMonthNote] = useState('')
  const [rangeNote, setRangeNote] = useState('')
  const [dateNotes, setDateNotes] = useState({})
  const [activeTab, setActiveTab] = useState('month')
  const [saved, setSaved] = useState(false)

  const monthKey = `month_note_${monthIdFromDate(visibleMonth)}`

  let rangeKey = null, rangeLabel = null, durationText = null
  if (rangeStart && rangeEnd) {
    const { start, end } = clampRange(rangeStart, rangeEnd)
    rangeKey = `range_note_${toIsoDate(start)}|${toIsoDate(end)}`
    rangeLabel = `${toIsoDate(start)} → ${toIsoDate(end)}`
    const diff = Math.ceil(Math.abs(+end - +start) / 864e5) + 1
    durationText = `${diff} day${diff !== 1 ? 's' : ''}`
  } else if (rangeStart) {
    rangeLabel = `Starting ${toIsoDate(rangeStart)}…`
  }

  useEffect(() => { setMonthNote(loadJson(monthKey) || '') }, [monthKey])
  useEffect(() => {
    if (rangeKey) { setRangeNote(loadJson(rangeKey) || ''); setActiveTab('range') }
    else setRangeNote('')
  }, [rangeKey])
  useEffect(() => {
    const notes = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('date_note_')) {
        const note = loadJson(key)
        if (note?.trim()) notes[key.replace('date_note_', '')] = note
      }
    }
    setDateNotes(notes)
  }, [visibleMonth])

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 1400) }
  const handleMonthNoteChange = e => { setMonthNote(e.target.value); saveJson(monthKey, e.target.value); flashSaved() }
  const handleRangeNoteChange = e => { setRangeNote(e.target.value); if (rangeKey) { saveJson(rangeKey, e.target.value); flashSaved() } }

  const monthName = visibleMonth.toLocaleString('default', { month: 'long' })
  const datesWithNotes = Object.entries(dateNotes).filter(([iso]) =>
    iso.startsWith(`${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, '0')}`)
  )

  // ── Style tokens ─────────────────────────────────────────
  const t = {
    heading:     isDark ? 'text-white'        : 'text-gray-800',
    sub:         isDark ? 'text-white/38'     : 'text-gray-400',
    tabWrap:     isDark ? 'bg-white/6 border-white/10' : 'bg-black/4 border-black/7',
    tabActive:   'bg-white font-bold shadow-sm',
    tabActiveText: 'text-[var(--accent)]',
    tabInactive: isDark ? 'text-white/45 hover:text-white/80 hover:bg-white/8' : 'text-gray-500 hover:text-gray-800 hover:bg-black/5',
    tabDisabled: isDark ? 'text-white/18 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed',
    textarea:    isDark
      ? 'bg-white/6 border-white/10 text-white placeholder-white/25 focus:bg-white/10 focus:ring-1 focus:ring-white/20'
      : 'bg-black/4 border-black/8 text-gray-800 placeholder-gray-400 focus:bg-black/6 focus:ring-1 focus:ring-black/15',
    rangeBox:    isDark ? 'bg-white/8 border-white/12 text-white/75' : 'bg-black/4 border-black/8 text-gray-600',
    noteDot:     isDark ? 'bg-sky-400'        : 'bg-sky-500',
    noteItem:    isDark ? 'bg-white/5 border-white/8'  : 'bg-black/3 border-black/5',
    noteDate:    isDark ? 'text-sky-400'       : 'text-sky-600',
    noteText:    isDark ? 'text-white/55'      : 'text-gray-600',
    qBtn:        isDark
      ? 'bg-white/6 border-white/10 text-white/70 hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/35 hover:text-white'
      : 'bg-black/4 border-black/8 text-gray-600 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/22 hover:text-gray-800',
    divider:     isDark ? 'border-white/8' : 'border-black/6',
  }

  return (
    <div className="flex flex-col h-full gap-3">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Accent bar */}
          <div className="w-[3px] h-5 rounded-full shadow-sm" style={{ background: 'var(--accent)', boxShadow: '0 0 8px color-mix(in oklab, var(--accent), transparent 40%)' }} />
          <h3 className={`font-bold text-sm tracking-tight ${t.heading}`}>Notes & Memos</h3>
        </div>

        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: 6, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -4 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/25"
            >
              <span className="text-emerald-400 text-[9px] font-black">✓ Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className={`flex shrink-0 rounded-xl overflow-hidden border p-0.5 gap-0.5 ${t.tabWrap}`}>
        {['month', 'range'].map(tab => (
          <button
            key={tab}
            onClick={() => { if (tab === 'range' && !rangeStart) return; setActiveTab(tab) }}
            className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all duration-200 capitalize ${
              activeTab === tab
                ? `${t.tabActive} ${t.tabActiveText}`
                : (tab === 'range' && !rangeStart) ? t.tabDisabled : t.tabInactive
            }`}
          >
            {tab === 'month' ? monthName : 'Range'}
            {tab === 'range' && durationText && (
              <span className="ml-1.5 px-1.5 py-px rounded-full text-[8px] font-black text-white"
                style={{ background: 'var(--accent)' }}>
                {durationText}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'month' ? (
            <motion.div key="month"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-2 h-full"
            >
              <label className={`text-[8px] font-black uppercase tracking-[0.2em] shrink-0 ${t.sub}`}>
                {monthName} {visibleMonth.getFullYear()} Memo
              </label>

              <textarea
                value={monthNote}
                onChange={handleMonthNoteChange}
                placeholder={`Write general notes for ${monthName}…`}
                className={`flex-1 min-h-0 resize-none rounded-2xl p-3.5 text-xs border focus:outline-none transition-all leading-relaxed ${t.textarea}`}
              />

              {/* Dates in this month that have notes */}
              {datesWithNotes.length > 0 && (
                <div className="shrink-0">
                  <p className={`text-[8px] uppercase tracking-widest mb-1.5 font-black ${t.sub}`}>📌 This month</p>
                  <div className="flex flex-col gap-1 max-h-[88px] overflow-y-auto">
                    {datesWithNotes.map(([iso, note]) => (
                      <div key={iso} className={`flex items-start gap-2 px-2.5 py-1 rounded-xl border ${t.noteItem}`}>
                        <span className={`text-[9px] font-black shrink-0 mt-px ${t.noteDate}`}>{iso.slice(5)}</span>
                        <span className={`text-[10px] truncate leading-snug ${t.noteText}`}>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="range"
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-2 h-full"
            >
              <div className="flex items-center justify-between shrink-0">
                <label className={`text-[8px] font-black uppercase tracking-[0.2em] ${t.sub}`}>Range Plan</label>
                {durationText && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-white shadow-sm"
                    style={{ background: 'var(--accent)', boxShadow: '0 2px 8px color-mix(in oklab, var(--accent), transparent 55%)' }}>
                    {durationText}
                  </span>
                )}
              </div>

              {rangeLabel ? (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 ${t.rangeBox}`}>
                  <span className="text-sm">📅</span>
                  <span className="text-[11px] font-semibold">{rangeLabel}</span>
                </div>
              ) : (
                <div className={`text-center px-3 py-2.5 rounded-xl border border-dashed text-[11px] shrink-0 ${t.sub} ${isDark ? 'border-white/12' : 'border-black/10'}`}>
                  Click two dates on the calendar
                </div>
              )}

              <textarea
                value={rangeNote}
                onChange={handleRangeNoteChange}
                disabled={!rangeKey}
                placeholder={rangeKey ? 'Write notes for this date range…' : 'Select a range to add notes…'}
                className={`flex-1 min-h-0 resize-none rounded-2xl p-3.5 text-xs border focus:outline-none transition-all disabled:opacity-35 disabled:cursor-not-allowed leading-relaxed ${t.textarea}`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Quick Note button ────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          const today = new Date()
          const key = `date_note_${toIsoDate(today)}`
          const note = prompt(`Quick note for today (${toIsoDate(today)}):`, loadJson(key) || '')
          if (note !== null) { saveJson(key, note); setDateNotes(prev => ({ ...prev, [toIsoDate(today)]: note })) }
        }}
        className={`shrink-0 w-full py-2.5 rounded-2xl transition-all duration-200 text-xs font-semibold border flex items-center justify-center gap-2 ${t.qBtn}`}
      >
        <span className="text-sm">📝</span> Quick Note for Today
      </motion.button>
    </div>
  )
}
