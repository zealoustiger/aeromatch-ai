# saved-seeker-budget-verdict

## Goal
Show the same honest "Budget may be tight / comfortably above typical" comps-based
verdict chip on `/saved`'s seeker section that already appears on the main seeker
browse surface, closing a parity gap where `/saved` computes and passes this verdict
for its partnership and aircraft sections but not its seeker section.

## Scope
- `src/app/saved/page.tsx`:
  - Import `getSeekerBudgetCheckVerdicts` from `@/lib/partnershipComps` (already
    imports `PartnershipCardVerdict` from there, so just add to the existing import
    or add a new one — check the actual export name/type used, `PartnershipCompVerdict`
    per `SeekerList.tsx`'s usage).
  - After `seekers` is hydrated (line ~118), compute
    `const seekerBudgetVerdicts = seekers.length > 0 ? await getSeekerBudgetCheckVerdicts(supabase, seekers) : new Map()`.
  - Pass `budgetVerdict={seekerBudgetVerdicts.get(s.id)}` into the existing
    `<SeekerCard seeker={s} saved />` call (~line 224).
- No other files. No schema change, no new query shape — reuses the exact helper
  already proven in `SeekerList.tsx`.

## Acceptance criteria
- `/saved` (logged-in, with at least one saved seeker listing whose preferred make
  clears the existing 4-comp honesty floor) shows the same budget verdict chip on
  the seeker card that `/partnerships/seeking` already shows for the same listing.
- When the honesty floor isn't cleared (ambiguous preference, <4 comps), the chip
  self-suppresses exactly as it already does elsewhere — no fabricated verdict.
- Partnership and aircraft sections of `/saved` are unaffected (same verdicts,
  same rendering).
- `npx next build` + typecheck clean.
- QA smoke passes on `/saved` at desktop 1280 + mobile 375 (HTTP 200, zero
  app-origin console errors, zero horizontal overflow).

## Out of scope
- `/airports/[icao]` and `DeviceSavedListings.tsx` (logged-out `/saved`) — both
  flagged by the same audit as related but larger-footprint gaps; left for a
  future cycle.
- Any change to `SeekerCard`, `SeekerList`, or the comp-verdict helper itself —
  they're already correct and unchanged.
