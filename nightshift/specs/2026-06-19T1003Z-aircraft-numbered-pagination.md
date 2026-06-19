# Spec — aircraft-numbered-pagination

## Goal
Add windowed **numbered page buttons** (1 2 3 … 31) with the current page highlighted to the `/aircraft` pager, so users can jump across the 31-page default set instead of only stepping one page at a time with Prev/Next.

## Context
The prior cycle (2026-06-19T09:02Z, aircraft-pagination) shipped Prev/Next-only pagination over the full filtered result set (`?page=N`, `range(from, to)`, "Showing X–Y of N" header). Its CHANGELOG explicitly flagged the next pick: "numbered page buttons (1 2 3 … 31) or a jump-to-page input." Numbered buttons are pure server-rendered `<Link>`s (no client JS) — they fit the existing server-component pattern and `pageHref()` helper already in `AircraftSaleList.tsx`. A jump-to-page input would require a client component; deferred.

## Scope
- `src/components/AircraftSaleList.tsx` — one file.
  - Add a `pageWindow(current, total)` pure helper that returns a compact list of page numbers + ellipsis gaps (always includes page 1, the last page, the current page and its immediate neighbors).
  - Replace the center "Page N of M" text span in the existing `<nav>` pager with the windowed numbered buttons. Active page = highlighted, non-link, `aria-current="page"`. Other pages = `<Link>` via `pageHref(filters, n)`. Ellipsis = inert span. Keep Prev/Next links exactly as-is. Keep an sr-only "Page N of M" for screen readers.

## Acceptance criteria
1. `npx next build` is green (compile + typecheck).
2. On the default `/aircraft` (31 pages) the pager shows numbered page buttons including page **1** and the last page (**31**) with ellipsis for the gap; the current page is visually highlighted (sky accent) and carries `aria-current="page"`.
3. Each numbered button (except the current one) links to the correct `?page=N` and preserves active filters (e.g. on `?max_tt=2000` the number hrefs carry `max_tt=2000`); page-1 link is the clean `/aircraft` (filters preserved, no `page` param).
4. Navigating via a numbered button lands on the right page (e.g. clicking "3" → header reads "Showing 121–180 of …", page-3 listings).
5. The pager does **not** render for single-page result sets and the price-drops path (`?drops=1`, `totalCount = null`) — unchanged from today.
6. No horizontal overflow at 375px (scrollWidth == clientWidth); the button row wraps cleanly. No new console errors vs. baseline (pre-existing Wikimedia LCP image warnings are OK).

## Out of scope
- Jump-to-page input / numeric entry (would need a client component — possible future slice).
- Any change to the query, filters, page size, "Showing X–Y of N" header, Prev/Next behavior, or the empty/out-of-range/error states.
- The human's uncommitted scraper WIP (`scraper/**`, `src/components/AircraftSaleCard.tsx`) — left untouched, as in prior cycles.
- DB / schema changes (none needed).
