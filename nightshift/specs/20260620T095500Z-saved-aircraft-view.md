# Saved aircraft on /saved (favorites slice 2)

## Goal
Surface a logged-in user's saved for-sale aircraft on `/saved`, alongside their saved partnerships, in clearly distinguishable sections (newest-saved first).

## Scope
- `src/app/saved/page.tsx` — add a second `saved_listings` query for `listing_type='aircraft'`, hydrate via `getAircraftForSaleByIds`, drop inactive/missing aircraft, render with `AircraftSaleCard` under a "Saved aircraft" section heading. Restructure the page into "Saved partnerships" + "Saved aircraft" sections with a combined empty state.

## Acceptance criteria
- Logged-out `/saved` still redirects to `/auth?next=/saved`.
- Saved partnerships render exactly as before (regression-safe): same `PartnershipCard`, newest-saved first, orphan/inactive rows dropped.
- Saved aircraft render with `AircraftSaleCard` (filled heart via `saved`), newest-saved first, resolved through `getAircraftForSaleByIds`; aircraft whose row is missing or not `status==='active'` drop out.
- Section headings only appear when that section has ≥1 item (no empty heading). If neither type has items, the existing combined empty state shows.
- Sky-blue accent only; zero horizontal overflow at 375px; `/saved` robots/noindex status unchanged.
- `npx next build` + `npx tsc --noEmit` pass with no new errors in touched files.

## Out of scope
- No schema/DB change (`saved_listings` + `listing_type='aircraft'` already exist from slice 1).
- No change to `SaveListingButton`, `AircraftSaleCard`, or `PartnershipCard`.
- No change to robots/sitemap status for `/saved`.
- No new card variants or compare wiring.
