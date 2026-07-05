# airport-hub-comp-verdicts

## Goal
Show the same honest "vs. market" comp chips on `/airports/[icao]` partnership and seeker cards that every sibling browse surface (`/partnerships`, `/partnerships/near/[icao]`, `/saved`) already shows.

## Scope
- `src/app/airports/[icao]/page.tsx` only:
  - Import `getPartnershipCompVerdicts` and `getSeekerBudgetCheckVerdicts` from `@/lib/partnershipComps`.
  - After building `allListings`/`allSeekers`, batch-fetch verdicts once for the full listing set (`atAirport` + `nearby`) and once for `seekersHere`.
  - Pass `comp={compVerdicts.get(p.id)?.comp ?? null}` / `dealVerdict={compVerdicts.get(p.id)?.dealVerdict ?? null}` into every `PartnershipCard` (both the "Based at" and "Within 50 miles" sections).
  - Pass `budgetVerdict={seekerBudgetVerdicts.get(s.id)}` into every `SeekerCard`.
- No schema change, no new query shape — reuses the exact batch helpers already proven in `/partnerships/near/[icao]/page.tsx` and `/saved/page.tsx`.

## Acceptance criteria
- `/airports/[icao]` partnership cards (both "Based at X" and "Within 50 miles" sections) show the same below/above-market comp pill or Deal Check chip that `/partnerships/near/[icao]` cards show, for listings whose make clears the existing 4-comp honesty floor.
- `/airports/[icao]` seeker cards show the same budget-verdict chip that `/partnerships/seeking` and `/saved` seeker cards show, honesty-gated the same way.
- No verdict renders when data doesn't clear the existing floors (self-suppresses, same as every sibling surface) — no fabricated numbers.
- `npx next build` + typecheck pass clean.
- QA smoke passes (HTTP 200, zero console errors, zero horizontal overflow) at desktop 1280 + mobile 375 on a real `/airports/[icao]` page with active inventory.
- No regression to the rest of the page (airport overview, seeker section links, nearby cross-links, JSON-LD).

## Out of scope
- `/members/[id]`'s persona partnership card (separate, noindex, lower-value — flagged for a future cycle).
- `DeviceSavedListings.tsx` (logged-out `/saved`) verdict-threading gap — separate, needs a new `hydrateDeviceSaves` return shape, its own cycle.
- Adding aircraft-for-sale cards to this page (pre-existing scope choice, not a regression).
