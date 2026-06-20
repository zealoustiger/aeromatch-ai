# Spec — Surface the `/guides` hub in the top navigation

**Slug:** guides-nav-link
**Lane:** [goal] (deliberate fall-through — `[want]` exhausted/blocked this run; explicit "Next:" follow-up left by the `guide-find-partners` cycle: "consider surfacing the /guides hub in the top nav so it isn't footer-only.")
**Scoreboard at orient:** 61 pageviews / 7d.

## Goal
Give the existing 5-guide content cluster a crawlable, primary entry point by adding a single new top-level **"Guides"** item to the site header nav (desktop + mobile), improving internal linking (a named GOAL.md SEO lever) and human discoverability — without touching or reordering any existing nav item.

## Scope
- `src/components/Nav.tsx` — add `{ href: '/guides', label: 'Guides' }` to the `links` array (placed after the existing items, before/around "About" as reads best, additive only). This array already drives BOTH the desktop nav and the mobile hamburger menu, and both already use `pathname.startsWith(href)` for active-state, so `/guides` and `/guides/*` sub-paths highlight automatically with zero extra code.

## Acceptance criteria
1. A **"Guides"** link is present and clickable in the **desktop** nav and in the **mobile** hamburger menu.
2. Clicking it navigates to `/guides` (HTTP 200) and the hub renders its 5 guides.
3. Active-state styling (sky-blue `bg-sky-50 text-sky-700` desktop / `text-sky-700` mobile) highlights on `/guides` (and `/guides/*` sub-paths), matching the existing links' exact pattern.
4. The existing nav items (Partnerships, Planes for Sale, Tools, About) are **unchanged** in order, label, and behavior, and still work.
5. No layout break / no horizontal overflow at **375px** — the extra item must not wrap badly or break the header.
6. No new console / hydration errors; `npx next build` + `npx tsc --noEmit` pass (3 pre-existing `.test.ts` baseline errors acceptable, no new errors in touched files).

## Out of scope
- Redesigning the nav; changing/reordering/renaming any other item; new styles.
- The footer (guides already linked there).
- Creating new guides or pages; any schema/DB change.
