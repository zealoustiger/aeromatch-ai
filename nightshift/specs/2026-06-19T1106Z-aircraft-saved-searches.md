# Spec — aircraft-saved-searches

**UTC:** 2026-06-19T11:06Z
**Cycle picked because:** Last cycle (`aircraft-numbered-pagination`) was a PASS, so no failure to fix.
The [P1] filter overhaul is functionally complete and its remaining slices (avionics/SMOH
filters, real photos) stay **blocked on uncommitted human scraper WIP** in the tree
(`scraper/*`, `src/components/AircraftSaleCard.tsx` — left untouched, per prior cycles).
Next-best unblocked item: extend the existing **Saved Searches** feature (which the
SignUpGate UI already promises — "Save multiple searches") from Partnerships to the
**Planes-for-Sale** page. Matches the Hangar67 "saved searches" inspiration, reuses the
existing auth/save plumbing, and touches none of the contested or frozen files.

## Goal
Let a signed-in user save their current `/aircraft` filter set as a named saved search,
and replay it correctly from the **My Saved Searches** page — exactly like Partnerships
already supports.

## Scope (small; no contested/frozen files)
- DB (additive only): `saved_searches` gets a `path text not null default '/partnerships'`
  column so each saved search remembers which marketplace it came from. Existing rows
  backfill to `/partnerships` (they are all partnership searches today) — backward
  compatible; current prod code never references the column.
- `src/app/actions.ts` — `saveSearch(name, searchParams, path)` writes `path` (whitelisted
  to `/partnerships` | `/aircraft`, default `/partnerships`).
- `src/components/SaveSearchButton.tsx` — add optional `basePath` prop (default
  `/partnerships`); used for the logged-out `/auth?next=` redirect and the `saveSearch` call.
- `src/app/aircraft/page.tsx` — render `<SaveSearchButton basePath="/aircraft" />` in the
  action bar (hidden when no filters are active — same as Partnerships).
- `src/app/searches/page.tsx` — make the "View" link use the saved `path`; make
  `describeSearch` aircraft-aware (make/model/state/min_year/max_price/max_tt/drops/q);
  show a small origin label (Planes for Sale vs Partnerships).
- `src/lib/types.ts` — add `path` to the `SavedSearch` interface.

## Acceptance criteria (QA grades these)
1. `npx next build` passes (compile + typecheck), no new TS errors.
2. On `/aircraft` with at least one active filter, a **"Save this search"** button appears
   in the header action bar; on the bare `/aircraft` (no filters) it is hidden — same
   behavior as Partnerships.
3. Saving while **signed out** redirects to `/auth?next=/aircraft?...` (the aircraft path,
   not `/partnerships`).
4. Saving while **signed in** persists a row with `path = '/aircraft'` and the current
   aircraft `search_params`; the success ("Saved!") state shows.
5. On **/searches**, an aircraft saved search's **View** link points to `/aircraft?<params>`
   (NOT `/partnerships`), its description uses aircraft vocabulary (e.g. "Make: Cessna ·
   Model: 172 · ≤ 2000 hrs"), and an origin label distinguishes it from partnership searches.
6. Existing **partnership** saved searches are unchanged: still save with `path =
   '/partnerships'`, still View to `/partnerships?<params>`, still describe with partnership
   vocabulary. No regression on the Partnerships "Save this search" button.
7. No new console errors on `/aircraft` or `/searches` (pre-existing Wikimedia LCP image
   warning is acceptable). Mobile 375px: the new button does not cause horizontal overflow.

## Out of scope
- Per-listing favorites/hearts (that's the separate "Save / favorite listings" backlog
  item, and its primary surface `AircraftSaleCard.tsx` is human WIP — deferred).
- Email alerts / notifications for matched listings (the SignUpGate copy promises these;
  not built here).
- Any change to `AircraftSaleCard.tsx`, the scraper, auth flow, or admin gating.
- A new "Saved listings" table or view.
