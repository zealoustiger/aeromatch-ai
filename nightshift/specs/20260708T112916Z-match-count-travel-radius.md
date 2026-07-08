# match-count-travel-radius

## Goal
Wire the seeker's stated `willing_to_travel_nm` travel radius into the compatibility-matching
engine's "N matches" counts, so an owner's/seeker's match count only counts listings within a
genuinely reasonable commute — the explicitly-flagged remaining gap in the backlog's
`[P2][want] Compatibility matching engine` item.

## Scope
- `src/lib/airports.ts` — export the existing private `haversineNm` helper (no behavior change
  to `getAirportsWithinRadius`/`resolveAirportCoords`).
- `src/lib/matching.ts` — add a new pure `isWithinTravelRadius(seekerCoord, partnershipCoord,
  willingToTravelNm)` honesty-gated helper (missing coords/radius never disqualify, mirroring
  `isCompatibleMatch`'s existing convention). `isCompatibleMatch` itself is untouched.
- `src/lib/matchingQuery.ts` — `countMatchingSeekersForPartnership` and
  `countMatchingPartnershipsForSeeker` batch-resolve airport coords (one `resolveAirportCoords`
  call each, via the existing `airports` table lookup) and additionally filter by
  `isWithinTravelRadius`.
- `src/lib/matching.test.ts` — add unit tests for `isWithinTravelRadius`.
- No page/component changes — `MatchCountNudge`'s two call sites (`/partnerships/[id]`,
  `/partnerships/seeking/[id]`) already just consume the two query functions' return counts.
- No schema/DB change.

## Acceptance criteria
- A seeker with `willing_to_travel_nm` set is excluded from a partnership's match count (and
  vice-versa) when the two home airports are farther apart than that radius, even if every other
  `isCompatibleMatch` criterion passes.
- A seeker/partnership pair with no stated travel radius, or an unresolvable airport code, is
  never disqualified by this criterion (honesty gate — consistent with every other criterion in
  `isCompatibleMatch`).
- `isCompatibleMatch` itself is unchanged (same signature, same existing tests still pass).
- `npx tsc --noEmit` and `npx next build` are clean.
- `qa-smoke` passes on `/partnerships/[id]` and `/partnerships/seeking/[id]` (a real listing of
  each type) at 1280 + 375 — HTTP 200, zero app-console errors, zero horizontal overflow.

## Out of scope
- `additional_airports` (a seeker's secondary airports) — only the primary `home_airport` is
  used for distance, matching how the item's own note scopes it ("needs an airport lat/lng join
  for seeker rows").
- A standalone `/matches` view, match badges on browse cards, or new-match alerts — separate,
  already-noted follow-up slices.
