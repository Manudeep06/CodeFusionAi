const pad2 = (n) => String(n).padStart(2, '0')

export function monthIdFromDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function toIsoDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function fromIsoDate(iso) {
  const [y, m, day] = iso.split('-').map((v) => Number(v))
  // Use noon to reduce DST edge cases when converting to/from local time.
  return new Date(y, (m ?? 1) - 1, day ?? 1, 12, 0, 0, 0)
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0, 0)
}

export function addMonths(d, delta) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1, 12, 0, 0, 0)
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function clampRange(a, b) {
  return a.getTime() <= b.getTime() ? { start: a, end: b } : { start: b, end: a }
}

export function formatMonthYear(d, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d)
}

export function weekdayShort(locale = 'en-US') {
  // We want Monday-first labels: Mon..Sun
  const base = new Date(2024, 0, 1, 12, 0, 0, 0) // 2024-01-01 is Monday
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(base.getTime() + i * 86400000)))
}

export function buildMonthGrid(visibleMonth, weekStartsOn = 1) {
  const monthStart = startOfMonth(visibleMonth)
  const monthStartDay = monthStart.getDay() // 0 Sun..6 Sat
  const shift = (monthStartDay - weekStartsOn + 7) % 7
  const gridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - shift, 12, 0, 0, 0)

  const today = new Date()
  const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0)

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i, 12, 0, 0, 0)
    return {
      date: d,
      iso: toIsoDate(d),
      inCurrentMonth: isSameMonth(d, visibleMonth),
      isToday: isSameDay(d, todayNoon),
    }
  })
}

// Creative Liberty: Semantic Holidays Map (Localized to India)
export function getHolidayName(date) {
  const m = date.getMonth() + 1
  const d = date.getDate()
  
  // Approximate/Fixed dates for major Indian holidays
  const rules = {
    '1-1': "New Year's Day 🎉",
    '1-14': "Makar Sankranti 🪁",
    '1-26': "Republic Day 🇮🇳",
    '3-25': "Holi 🎨", // Variable lunisolar date (example)
    '4-14': "Ambedkar Jayanti 🙏",
    '5-1': "Labour Day (May Day) 🛠️",
    '8-15': "Independence Day 🇮🇳",
    '8-19': "Raksha Bandhan 🧵", // Variable lunisolar date (example)
    '10-2': "Gandhi Jayanti 🕊️",
    '10-31': "Diwali 🪔", // Variable lunisolar date (example)
    '12-25': "Christmas Day 🎄"
  }
  
  return rules[`${m}-${d}`] || null
}
