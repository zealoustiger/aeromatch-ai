# home-rails-snap-carousel

## Goal
Polish the homepage curated-collection rails into a clean snap-carousel — hidden
scrollbar, scroll-snap, next-card peek, and desktop chevron arrows — delivering the
agreed headline of the **[P1][want] "Redesign the collection layout — drop the
horizontal scrollbar"** item, without committing to the un-mocked wholesale redesign.

## Why this lane / item
- This cycle is owed **[want]** (last non-bug cycle `partnerships-near-og-parity` pulled
  [goal]; last cycle PASS → no blocker). 1:1 alternation per GOAL.md.
- The item's headline ask is unambiguous ("drop the horizontal scrollbar"); only its
  *preferred* realization — **Option A (category tile mosaic)** vs **a tabbed Option C** —
  is explicitly deferred by the human "after a mock." So the safe, reversible increment is
  to fix the agreed pain (the ugly visible scrollbar) on the existing real-listing rails,
  and leave the A-vs-C redesign for the human's mock (noted in Next).
- The homepage is priority seed page #1 and the highest-traffic page; a cleaner, more
  obviously-interactive collection row is a visible morning-review win.

## Scope (small — one component touched, one new client component)
- New `src/components/RailScroller.tsx` — a thin **client** wrapper that renders the
  horizontal scroll container (hidden scrollbar + `snap-x snap-mandatory`) and, on
  desktop, left/right chevron buttons that page the row via `scrollBy`. Cards stay
  **server-rendered** and are passed in as `children` (no data-fetch moves to the client).
- `src/components/HomeRails.tsx` — replace the raw `overflow-x-auto` row with
  `<RailScroller>`, add `snap-start` to each card `<li>`. No change to data fetching,
  the RAILS definitions, the MIN_PER_RAIL drop rule, or the section header/links.

## Acceptance criteria
- [ ] Homepage `/` renders the curated-collection rails with **no visible horizontal
      scrollbar** (reuses the established `[scrollbar-width:none] [-ms-overflow-style:none]
      [&::-webkit-scrollbar]:hidden` utility).
- [ ] Cards **scroll-snap** (`snap-x`/`snap-start`) and a partial next card peeks at the
      row's right edge (unchanged card sizing).
- [ ] On desktop (≥sm) a **right chevron** is available when the row overflows and a
      **left chevron** appears once scrolled; clicking pages the row. Chevrons are hidden
      on mobile (375px), where native swipe is the affordance.
- [ ] No app-origin console errors and **zero horizontal PAGE overflow** at 1280 + 375
      (the rail row scrolls internally; the page does not).
- [ ] `npx next build` + typecheck pass; QA smoke exits 0 and screenshots look right.

## Out of scope
- The wholesale **Option A tile-mosaic** / **tabbed Option C** redesign (awaits the
  human's mock) — not built tonight.
- The in-listing "more like this" rails on detail pages (separate Option B target).
- Any change to which listings appear, rail themes, sorting, or the $50k floor.
- Touching `AircraftRailCard`, partnerships rails, chip bars, or any other page.
