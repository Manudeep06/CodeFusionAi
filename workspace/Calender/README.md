# Frontend Engineering Challenge: Interactive Wall Calendar

A polished, responsive “wall calendar” component inspired by the provided reference image:

- **Wall calendar aesthetic** with a prominent hero image + month grid + notes
- **Day range selection** (start, end, in-between visual states)
- **Integrated notes** (month memo + note attached to the selected range)
- **No backend**; persistence via **localStorage**

## Tech stack
- React + Vite
- TypeScript
- Plain CSS (component-scoped CSS file for the calendar)

## Run locally

```bash
npm install
npm run dev
```

Build/preview:

```bash
npm run build
npm run preview
```

## How it works

### Range selection UX
- Click a day once to set the **start**.
- Click another day to set the **end** (if you click an earlier date, the component swaps so the start is always \(\le\) end).
- Once a range is complete, clicking any day starts a **new range**.
- Days outside the current month are shown “muted”; clicking them navigates to that month and selects the day.

### Notes behavior
- **Month memo** is saved per month (keyed by `YYYY-MM`).
- **Range note** is saved per selected range (keyed by `start|end`, where each is an ISO date `YYYY-MM-DD`).

### Persistence
All state is stored under a single key:
- `wallCalendar:v1`

## Code structure
- `src/components/WallCalendar/WallCalendar.tsx`: top-level composed component (hero + calendar + notes)
- `src/components/WallCalendar/MonthGrid.tsx`: 6×7 grid rendering and selection interaction
- `src/components/WallCalendar/NotesPanel.tsx`: notes UI
- `src/components/WallCalendar/useWallCalendarState.ts`: state + persistence
- `src/lib/date.ts`: date/grid utilities
- `src/lib/storage.ts`: safe localStorage helpers

## Demo requirements (for submission)
- Record a short screen capture showing:
  - range selection states (start / in-between / end)
  - notes (month memo + range note)
  - responsive layout (desktop + mobile width)
