# Spec — /aircraft pagination ("Load more" via pages)

**Cycle:** 2026-06-19T09:02Z
**Slug:** aircraft-pagination
**Backlog:** [P1] Filter UI overhaul — natural follow-up flagged by the prior cycle ("the count now advertises 1856 but only 60 rows render — a real pagination / 'load more' control is the natural follow-up").

## Goal
Let users page through the full filtered result set on `/aircraft` instead of being stuck on the first 60 rows, while keeping the SSR + URL-param-driven design intact.

## Scope (small)
- `src/components/AircraftSaleList.tsx` — read a `page` param, fetch the correct window with `.range()` instead of `.limit()`, and render a pagination control at the bottom that preserves all active filters.
- (No change expected to `page.tsx` — `?page=N` already flows through `searchParams` → `filters`, and the `Suspense` key already includes it.)

## Acceptance criteria
1. Default `/aircraft` shows page 1 (rows 1–60) and a pagination control with **Next** enabled and **Previous** disabled/absent.
2. Navigating to `?page=2` shows the next 60 rows (a different set of listings than page 1), with both **Previous** and **Next** available, and **Previous** links back to page 1 (drops the `page` param or sets `page=1`).
3. Pagination **preserves active filters** — e.g. `?max_tt=2000&page=2` keeps `max_tt=2000` in the prev/next links.
4. The results header reflects the visible window, e.g. "Showing 61–120 of 1,856" (exact total, comma-formatted); on the last page the upper bound clamps to the true total.
5. The last page shows **Next** disabled/absent (no empty page beyond the total); an out-of-range `?page` (e.g. far past the end) does not crash — it renders an empty/last state gracefully.
6. Works at 375px (control wraps/sized for mobile, no horizontal overflow) and produces no new console errors. `npx next build` (compile + typecheck) is green.

## Out of scope
- Infinite scroll / client-side "append" loading (keeping SSR + shareable URLs is the point).
- The price-drops path (`?drops=1`): its count is JS-narrowed (column-to-column, `totalCount = null`), so it stays single-window with no pagination — unchanged behavior.
- Any change to filters, cards, the scraper WIP, or the missing-photos / avionics-SMOH items (blocked on in-flight human scraper work).
- Per-page-size selector, jump-to-page input, numbered page buttons beyond a simple Prev/Next (+ current page indicator).
