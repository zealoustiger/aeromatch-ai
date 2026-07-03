# saved-aircraft-comp-verdict

## Goal
Show the same "vs. market" comp / Deal Check chip on saved **aircraft-for-sale**
cards on `/saved` that every other aircraft browse surface already shows, closing
the aircraft-side half of the parity gap the `saved-partnership-comp-verdict`
cycle left open (that cycle did the partnership side).

## Scope
- `src/lib/aircraftComps.ts` — add an exported `getAircraftCompVerdicts(supabase, listings)`
  helper (mirrors `getPartnershipCompVerdicts` in `src/lib/partnershipComps.ts`): given a
  hydrated list of `AircraftForSale` rows, scopes one query to the makes present,
  buckets by make+model family (`familyKey`), and returns a
  `Map<id, { comp: CompResult | null; dealVerdict: ClubHangerDealVerdict | null }>` using
  the exact same precedence `AircraftSaleList.tsx` already uses (`dealVerdict` — narrowed
  by year/hours — wins; fall back to the plain family `comp` pill; neither when data is
  too thin).
- `src/app/saved/page.tsx` — call the new helper once on the hydrated `aircraft` array
  (skipped when empty) and thread `comp`/`dealVerdict` into the existing `<AircraftSaleCard>`
  (which already accepts both props, used elsewhere).
- No new component, no new color, no schema/DB change, no new dependency.

## Acceptance criteria
- `/saved` aircraft cards render a Deal Check chip (or the plain comp pill, whichever
  the same honesty-gated logic picks) exactly like `/aircraft`, `/aircraft/for-sale/[state]`,
  etc. — same thresholds (`MIN_OTHER_COMPS`, `DEAD_BAND`, deal-comp year/hours bands).
- Thin/sparse families (or unpriced listings) render no chip — never a fabricated number.
- Partnership saved cards and the rest of `/saved` (notes, device-saved fallback, empty
  state) are unchanged.
- `npx next build` + `tsc --noEmit` clean.
- QA smoke (production build) passes on `/saved` at desktop 1280 + mobile 375: HTTP 200,
  zero app-origin console errors, zero horizontal overflow.

## Out of scope
- Any change to the partnership side (already shipped).
- Any change to `AircraftSaleCard`, `compVsMarket`, `clubHangerDealVerdict` themselves.
- Auth/signup flow (frozen).
