# Design — CodeFusionAI

A professional, light-only interface for a collaborative, AI-assisted IDE, in the spirit of Linear and Vercel for the app, VS Code for the editor, and Cursor for the AI panel.

## Principles

- Light mode everywhere, including the code editor. White and slate surfaces, slate ink.
- One electric-blue accent (`--color-accent`, #2563eb), with indigo reserved for AI moments. Gradients only on the hero headline and AI icons.
- Lucide icons only, no emoji. Status colors: green (ok), amber (pending), red (error).
- Every screen ships real empty, loading, error and success states. Unsupported features get a clearly labeled placeholder, never fake data.

## Routes

| Route | Screen |
| --- | --- |
| `/` | Landing: hero + live editor preview, 8 features, how it works, workspace showcase, audiences, FAQ, CTA, footer |
| `/login` | Centered card: sign in, create account (with **Full name**), forgot password |
| `/dashboard` | App shell (sidebar) → Overview (stats, quick actions, recent rooms table, public hub) and Rooms (table + filters, public hub grid) |
| `/assistant` | Full-page AI chat: history rail, markdown + highlighted code, suggested prompts |
| `/docs`, `/docs/:page` | Documentation site: grouped nav, search, outline, prev/next |
| `/room/:id` | Workspace (see below) |

## Workspace layout

Toolbar (room, ID, privacy, avatars, Invite, connection, save, AI toggle) → activity bar (Explorer, Search, Collaborators, History) → side panel → editor (tabs, breadcrumb, Monaco `cf-light`) with a bottom panel (Terminal, Problems, Output, Console) → optional preview → right AI panel → status bar (Live, users, room ID, Ln/Col, spaces, language, sync). Side panels become drawers under 760px.

## Tokens (`Frontend/tokens.css`)

- Surfaces: `paper` (#fff), `paper-muted` (#f8fafc), `paper-sunken` (#f1f5f9).
- Ink: `ink` (#0f172a), `ink-soft`, `ink-faint`, `ink-ghost`.
- Rules: `rule` (#e5e7eb), `rule-strong` (#cbd5e1).
- Accent: `accent`, `accent-hover`, `accent-soft`, `accent-ring`; `indigo` for AI.
- Type: Inter (UI), JetBrains Mono (code, IDs).

## Shared UI (`Frontend/src/components/ui`)

`Brand`, `Modal` (native `<dialog>`), `Toast` + `toastStore`, `ConfirmHost` + `confirmStore`, `CommandPalette` + `palette` (Ctrl/⌘ K), `Skeleton`. Assistant replies render through `AIAssist/Markdown` (Prism highlighting, Copy, optional Apply).

## Rules

- Use tokens; no new hex colors in components.
- Never `alert()` / `confirm()`; use `toast` and `confirmDialog`.
- Document only features that exist.
