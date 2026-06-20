# Compare — SLICE 2: aircraft (planes-for-sale)

## Goal
Extend the existing listing-comparison system (CompareProvider / CompareToggle / CompareTray / `/compare`, shipped tonight for partnerships) to the `/aircraft` planes-for-sale marketplace, keeping the two marketplaces' comparisons cleanly separated by listing TYPE.

## Scope (files expected to touch)
- `src/components/CompareProvider.tsx` — add a listing TYPE to selection state; scope to one type at a time (switching type clears the prior selection; no silent mix).
- `src/components/CompareToggle.tsx` — accept a `type` prop, pass to `toggle`/`isSelected`.
- `src/components/CompareTray.tsx` — carry the current selection's type into the `/compare` link (`?type=aircraft|partnership&ids=...`).
- `src/components/AircraftSaleCard.tsx` — render `<CompareToggle type="aircraft">` in the badges row.
- `src/app/aircraft/page.tsx` — wrap in `<CompareProvider>` + mount `<CompareTray>`; add bottom padding for the fixed tray.
- `src/lib/aircraftForSale.ts` (NEW) — `getAircraftForSaleById` + `getAircraftForSaleByIds` (mirror `src/lib/partnerships.ts`).
- `src/app/compare/page.tsx` — read `?type`; render an AIRCRAFT side-by-side table (real fields only) when `type=aircraft`, else the existing partnership table.

## Acceptance criteria
1. On `/aircraft`, every for-sale card shows a sky "Compare" toggle wired into the SAME CompareProvider/tray (no fork). Selecting 2–3 aircraft populates the tray with chips + `N/3` + Clear + "Compare (N)".
2. Selection distinguishes type: an aircraft selection and a partnership selection never mix into one comparison. Starting a selection of the other type while one type is active clears the prior selection (obvious, no silent data loss) — picking the cleaner scoped UX.
3. `/compare?type=aircraft&ids=...` renders an aircraft table with only fields aircraft listings actually have (make/model/year, asking price, TTAF, SMOH, location/state, registration, engine, annual due, source, etc.; `—` when absent). Each column links to the listing's real link (source_url, else the make+model family page) — never a 404/invented route.
4. `/compare` stays noindex (already set). 0/1/invalid/>3 ids handled gracefully exactly as slice 1 does, for BOTH types.
5. Partnership comparison from `/partnerships` still works unchanged (no regression).
6. Mobile-first: usable at 375px (horizontal-scroll table, no page overflow); sky-blue accent only; no console/hydration errors.

## Out of scope
- No DB / schema change (selection stays client-side `sessionStorage`).
- No aircraft detail page (aircraft link out to source_url / make+model family page).
- No change to partnership table fields or behavior.
- `/compare` stays out of the sitemap / noindex.
