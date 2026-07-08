# saved-page-social-proof-parity

## Goal
Bring `/saved` to parity with the browse pages (`/aircraft`, `/partnerships`,
`/partnerships/seeking`) by wiring the existing, already-shipped "Saved by N
pilots" and "Rare find — only N like this" honesty-gated chips into the three
card types rendered there — currently `/saved` renders `PartnershipCard`,
`AircraftSaleCard`, and `SeekerCard` with comp/deal-verdict data but never
passes `saveCount` (any type) or `familyCount` (aircraft), so a pilot never
sees the same real trust signals on their own saved listings that they saw
when they saved them.

## Scope
- `src/lib/aircraftComps.ts` — add `familyCount: number | null` to the
  `AircraftCompVerdict` interface returned by `getAircraftCompVerdicts`
  (reuses the family map already built inside that function; today the
  function only records an entry when `dealVerdict || comp` is truthy, which
  by construction excludes every rare family — `compVsMarket`/
  `clubHangerDealVerdict` both require `MIN_OTHER_COMPS = 4`, so a family of
  size 1-3 never gets either, and RARE_FIND_MAX is also 1-3 — so this must be
  fixed to record `familyCount` independent of comp/dealVerdict, else the
  "Rare find" chip could never appear on `/saved` for a genuinely rare plane).
- `src/app/saved/page.tsx` — for the signed-in branch:
  - call `getSaveCounts` (`@/lib/saveCounts`) once per listing type
    (`partnership`, `aircraft`, `seeker`) with the already-collected id
    arrays, in parallel with the existing comp-verdict fetches.
  - pass `saveCount={...}` to `PartnershipCard`, `AircraftSaleCard`, and
    `SeekerCard` (all three already accept this prop with a `0` default —
    zero component changes needed).
  - pass `familyCount={...}` to `AircraftSaleCard` from the updated
    `AircraftCompVerdict`.

## Out of scope
- `/aircraft/deals` — every listing there already clears `MIN_OTHER_COMPS`
  (>= 5 total family members) to qualify as a "deal," so `familyCount` would
  always exceed `RARE_FIND_MAX` (3) and the chip could never render there —
  not worth wiring.
- `AircraftRailCard` (homepage/rail cards) and the logged-out
  `DeviceSavedListings` client component — different card component / data
  path; a separate follow-up slice, not touched this cycle.
- Any change to `PartnershipCard`, `AircraftSaleCard`, or `SeekerCard` itself
  — they already render these chips correctly; this is pure data-wiring on
  one page.

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` both clean.
- `/saved` (signed-in) renders `AircraftSaleCard`/`PartnershipCard`/
  `SeekerCard` with real `saveCount` values (>= `MIN_SAVES_TO_SHOW` shows the
  chip, matching the exact same real `saved_listings` data used elsewhere).
- A saved aircraft belonging to a genuinely rare (1-3 total active priced
  listings) make+model family shows the "Rare find" chip on `/saved` — verify
  directly against live DB data (a Grumman AA-1, same family used to verify
  the original feature).
- No console errors, no horizontal overflow at 1280/375 on `/saved`.
- Logged-out `/saved` (device-saves view) is unaffected (out of scope, not
  touched).
