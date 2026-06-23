# Re-theme homepage curated collections (stop leading with the cheapest planes)

## Goal
Replace the homepage `HomeRails` collection set (currently led by "Time-builders
under $100k" and a flat "Cessna for sale") with an **aspirational, no-cheap-lead**
set of real for-sale collections, per the human's P1 [want] request.

## Lane
[want] — last non-bug CHANGELOG cycle (`partnership-breadcrumb-jsonld`) pulled
[goal]; no blocker outstanding, so [want] is owed (1:1). Item:
**[P1][want] Re-theme collections — stop leading with the cheapest planes**
(Brainstorm 2026-06-22 — Zillow/Redfin marketplace, human-set).

## Scope (small — one file)
- `src/components/HomeRails.tsx` — rewrite the `RAILS` array only. New rails map to
  EXISTING `/aircraft` filter params (the same `fetchAircraftPage` source of truth),
  each with a matching `/aircraft?…` "See all" href. No component/markup/token change.

New aspirational rail set (all carry `min_price: '50000'` so only real, priced
aircraft show — honors "respect the $50k floor"; parts/projects are sub-$50k):
1. **Just listed this week** — newest priced aircraft (`min_price=50000`, default newest sort).
2. **Recently reduced** — genuine price drops (`drops=1&min_price=50000&sort=reduced`).
3. **Glass-panel cross-country** — `q=glass&min_price=50000`.
4. **Step-up performance (Cirrus SR22)** — `q=SR22&min_price=50000`.
5. **Family four-seaters (Cessna 172)** — `q=172&min_price=50000`.

Titles name the actual filter (e.g. "(Cirrus SR22)") so the rail is honest about
what it shows. The existing auto-drop guard (`MIN_PER_RAIL = 4`) silently drops any
rail that returns < 4 real listings — never padded, never fabricated.

## Acceptance criteria
- [ ] Homepage `/` no longer shows a "Time-builders under $100k" or "Cessna for sale"
      lead rail; the new aspirational rails render in order.
- [ ] Every rendered rail shows REAL listings (≥ 4) fetched via `fetchAircraftPage`;
      thin rails are dropped, none padded/fabricated.
- [ ] Each rail title + "See all" links to a working `/aircraft?…` page reflecting the
      same filters (clicking lands on matching results).
- [ ] `npx next build` + typecheck green (only pre-existing `.test.ts` baseline errors).
- [ ] QA smoke (production build) exit 0 on `/` at 1280 + 375: HTTP 200, zero
      app-origin console errors, zero horizontal overflow.
- [ ] Screenshots read: collections render on-brand, no cheap-lead theme, no overflow.

## Out of scope
- Layout redesign (Option A tile mosaic — separate "Redesign the collection layout" item).
- "Near your home airport" rail (needs geolocation / home airport — not available server-side).
- Any global $50k price floor across the whole site (separate [P1][bug] item).
- New filter params, new components, schema/DB, or any other homepage section.
