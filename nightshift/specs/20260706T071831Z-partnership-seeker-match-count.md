# partnership-seeker-match-count

## Goal
Ship slice 1 of the backlog's "Compatibility matching engine" [want] item: a pure,
honest match-scoring function plus an owner-only "N matches" count on both the
partnership detail page and the seeker detail page — using only existing columns,
no schema change, no new page.

## Scope
- New `src/lib/matching.ts`: `isCompatibleMatch(seeker, partnership)` — a pure
  boolean compatibility check using make, budget (buy-in/monthly/hourly), min
  hours, ratings required, and share type. A criterion only counts against a
  match when BOTH sides have data to compare (honesty gate — missing data is
  never treated as a mismatch, matching the existing buyer-analysis convention).
  Plus two small async helpers that fetch active rows via the existing
  `getSeekers`/`getPartnershipListings` query helpers and filter with
  `isCompatibleMatch`: `countMatchingSeekersForPartnership`,
  `countMatchingPartnershipsForSeeker`.
- New small component `MatchCountNudge.tsx` (or folded into existing owner-nudge
  area) rendering "N pilots seeking a partnership match your listing" (partnership
  owner view) / "N available partnerships match what you're looking for" (seeker
  owner view), linking to the filtered browse page (`/partnerships/seeking?make=…`
  / `/partnerships?make=…`), self-suppressing at 0 (a promised zero is a bad first
  impression, not an honest signal).
- Wire into `src/app/partnerships/[id]/page.tsx` (near the existing
  `ListingOwnerNudge`, owner-only) and `src/app/partnerships/seeking/[id]/page.tsx`
  (near `SeekerListingOwnerNudge`, owner-only).

## Out of scope
- Distance/airport-proximity criterion (`willing_to_travel_nm`) — deferred, needs
  an airport lat/lng join not yet wired for seeker rows.
- A dedicated `/matches` view or match badges on browse cards — later slices.
- Any change to non-owner-facing UI (visitors don't see this).
- Schema changes.

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` pass clean.
- `isCompatibleMatch` covers make/budget/hours/ratings/share-type with the
  honesty gate (missing data never fails a criterion) — spot-checked with a
  standalone script against a few hand-built cases.
- Owner viewing their own partnership listing sees an honest count of currently
  active, compatible seeker listings (0 → hidden, not shown as "0 matches").
- Owner viewing their own seeker listing sees the symmetric count of compatible
  active partnership listings.
- Non-owners see no change to either page.
- QA smoke passes (HTTP 200, no console errors, no horizontal overflow) at
  desktop 1280 + mobile 375 on `/partnerships/[id]` and
  `/partnerships/seeking/[id]`.
