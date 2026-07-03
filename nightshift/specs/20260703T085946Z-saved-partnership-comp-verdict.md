# saved-partnership-comp-verdict

## Goal
Show the same honest "~X% below/above market" buy-in comp chip on saved partnership
cards on `/saved` that already appears on every other partnership browse surface.

## Scope
- `src/app/saved/page.tsx` only:
  - Import `getPartnershipCompVerdicts` from `@/lib/partnershipComps`.
  - After hydrating the `partnerships` array, call
    `getPartnershipCompVerdicts(supabase, partnerships)` to get a
    `Map<string, PartnershipCompVerdict>` (skip the call when the array is empty).
  - Pass `compVerdict={verdicts.get(p.id)}` into the existing `<PartnershipCard p={p} saved />`.

## Acceptance criteria
- `/saved` (logged-in, with ≥1 saved partnership near other active same-make listings)
  shows the comp chip (e.g. "~44% below market · $25k · 4 comps") on the partnership
  card, identical styling/logic to `/partnerships`, `/partnerships/near/[icao]`, etc.
- When there are zero comps (near-market or insufficient comps), the chip self-suppresses
  exactly as it does elsewhere — no fabricated verdict.
- Aircraft saved cards and the notes affordance are unaffected (regression check).
- `next build` + typecheck pass.
- QA smoke passes on `/saved` (desktop 1280 + mobile 375): HTTP 200 (redirect for
  logged-out is fine/expected), zero app-origin console errors, zero horizontal overflow.
- No schema change, no new query pattern — reuses the existing helper verbatim.

## Out of scope
- Aircraft-side comp/deal-verdict chip on `/saved` (AircraftSaleCard already supports
  `comp`/`dealVerdict` props, but wiring that needs the aircraft-comp equivalent helper —
  separate follow-up, not this cycle).
- Any change to `getPartnershipCompVerdicts` itself.
