# Spec: similar-aircraft-deal-chips

**UTC:** 2026-06-27T07:14:39Z  
**Pillar:** 3 — Proprietary buyer analysis on listing pages  
**Slug:** similar-aircraft-deal-chips

## Goal
Add honest "Good deal" / "Priced high" verdict chips to the Similar Aircraft rail cards on the listing detail page, so buyers can compare price positioning across similar listings at a glance — without leaving the page.

## Scope
- `src/components/SimilarAircraft.tsx` — after fetching similar listings, batch-fetch family asking prices for each unique make+model family (parallel), compute `clubHangerEstimate` per listing, pass verdict to each card
- `src/components/AircraftRailCard.tsx` — add `compVerdict?: 'below' | 'above'` prop; render emerald "Good deal" chip for 'below', amber "Priced high" chip for 'above'; keep existing `discountPct` for homepage deals rail (backward compat)

## Acceptance criteria
1. On a listing detail page with similar aircraft, cards for listings priced below the family-wide median (≥4 comps, outside the dead band) show a small emerald "Good deal" chip on the photo
2. Cards for listings priced above the family-wide median show an amber "Priced high" chip
3. Cards for listings near the median (within ±5% dead band) or with fewer than 4 comps show NO chip — honesty floor respected
4. Homepage deals rail (using `discountPct` prop) unchanged — "~X% below average" chip still appears there
5. `npx next build` passes (no TypeScript errors); smoke passes on `/aircraft/listing/[id]` at 1280 + 375px

## Out of scope
- Deal Check (year+hours controlled) — uses only the simpler family-median estimate (same as the CompPill on browse cards)
- Adding new DB tables or schema changes
- Showing verdict on the homepage rails (those already have `discountPct`)
- Partnership or seeker listing pages
