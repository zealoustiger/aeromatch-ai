# Post-type toggle — switch between the "Post a…" flows

**Lane:** `[want]` (last non-bug cycle `aircraft-compare-pages` pulled `[goal]`; last cycle PASS → no blocker → `[want]` owed per the 1:1). Backlog item: **[P2][want] Easy toggle between the three "Post a…" types** (2026-06-24 chat batch, with reference screenshot).

## Goal
From either posting flow, let the user instantly switch to the other with a clear segmented tab control at the top of the page — today `/partnerships/new` and `/partnerships/seeking/new` are separate pages with no cross-navigation.

## Scope (small)
- **New** `src/components/PostTypeTabs.tsx` — a presentational server component: a segmented pill toggle with one tab per existing posting flow, the current one highlighted (`aria-current="page"`), each a real internal `<Link>`.
- `src/app/partnerships/new/page.tsx` — render `<PostTypeTabs active="partnership" />` above the header.
- `src/app/partnerships/seeking/new/page.tsx` — render `<PostTypeTabs active="seeking" />` above the header.

## Acceptance criteria
- Both `/partnerships/new` and `/partnerships/seeking/new` render a 2-tab segmented control: **Post a partnership** → `/partnerships/new`, **Seeking a partnership** → `/partnerships/seeking/new`.
- On each page the tab for the current flow is visually active and carries `aria-current="page"`; the other tab links to the sibling flow (no 404 — both targets exist).
- The control is keyboard/screen-reader sane (`<nav aria-label>`, real links) and styled cohesively with existing chip/pill tokens (`--ch-border`, sky-500 active).
- No horizontal overflow at desktop 1280 + mobile 375; the form below is unchanged.
- `npx next build` + typecheck green; zero new app-origin console errors.

## Out of scope
- A third **"post a plane for sale"** tab — that page does not exist yet; linking to it would 404. Note it as the next slice.
- Any change to the forms themselves, autosave, or field layout.
- Top-nav / global IA changes (FREEZE: major nav restructure is ask-a-human).
