# Design — CodeFusionAI

A locked interface system for the collaborative coding workspace. The visual direction borrows the calm, document-first clarity of modern tools while staying specific to a live development environment.

## Genre

Modern-minimal product workspace.

## Macrostructure family

- Entry: a document-like welcome panel beside a quiet product proof.
- Workspace: a compact application shell with a persistent utility bar and generous work canvas.
- Collaboration room: a focused workbench with low-contrast chrome and a single violet action cue.

## Theme

- Paper: warm white with a very light lilac tint.
- Ink: graphite, never pure black.
- Accent: a single saturated violet, reserved for primary actions and selection.
- Rules: cool grey hairlines; shadows are soft and rare.

## Typography

- Display: Manrope, 700, normal.
- Body: Inter, 400–600.
- Mono: IBM Plex Mono, 400–500.
- Headers are upright and use tight, readable tracking.

## Motion

- One short opacity/translate reveal on entry.
- Controls move only 1px on press.
- Reduced motion removes transforms.

## Microinteractions

- Quiet hover fills and visible focus rings.
- No decorative glows, shimmer, pulsing rings, or gradient animation.
- Success feedback is brief and inline.

## CTA voice

- Primary: solid violet, medium radius, direct verb-first copy.
- Secondary: white with a graphite hairline border.

## Shared rules

- Use the named tokens in `Frontend/tokens.css`; do not introduce arbitrary colors.
- Keep the accent below five percent of any view.
- App screens prioritise information density and legibility over decoration.
