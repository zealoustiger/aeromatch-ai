# seeker-trust-badge

## Goal
Give "pilot seeking a partnership" listings the same honest, data-grounded
"listing trust" completeness signal that aircraft-for-sale and partnership
listings already have — today seeker listings are the one listing type with
zero Pillar-3 trust/completeness coverage.

## Scope
- New `src/lib/seekerTrust.ts` — mirrors `aircraftTrust.ts`/`partnershipTrust.ts`
  exactly (flat signal table + pure `evaluateSeekerTrust()` scorer), 4 signals,
  all computed from existing `PartnershipSeeker` columns, no schema change:
  1. `aircraft_preference` — a make, model, or aircraft category is specified
     (not "any aircraft, no preference").
  2. `budget_disclosed` — a real number for `max_buy_in`, `max_monthly`, or
     `max_hourly` (not "contact me").
  3. `experience_disclosed` — `total_hours` AND at least one rating in
     `ratings_held` are both stated (mirrors `maintenance_disclosed`'s
     two-fields-both-present pattern).
  4. `member_posted` — `poster_id != null` (posted by a signed-up member, not
     a seed/concierge profile).
- New `src/components/SeekerTrustBadge.tsx` — compact-only chip (mirrors the
  original `AircraftTrustBadge` slice-1 shape exactly: no checklist variant
  yet, since there's no seeker detail-page slot for one this cycle).
- Render the chip in `src/components/SeekerCard.tsx`'s badge row (next to the
  existing New/hours/ratings/budget-verdict chips).
- New `src/lib/seekerTrust.test.ts` — unit tests mirroring `aircraftTrust.test.ts`.

## Acceptance criteria
- `evaluateSeekerTrust()` returns a score 0–4 and per-signal met/unmet state,
  matching the shape of `evaluateAircraftTrust`/`evaluateTrust`.
- A seeker listing with make/model, a stated budget, hours+ratings, and a real
  `poster_id` scores 4/4; a bare seed listing with none of these scores 0/4.
- The chip renders on every `SeekerCard` (browse `/partnerships/seeking`,
  `/saved`, `/airports/[icao]`) with no layout shift/overflow at 375px or 1280px.
- No fabricated data — every signal reads a real existing column; nothing is
  invented when data is missing.
- `npx next build` + `tsc --noEmit` pass; QA smoke passes on affected pages.

## Out of scope
- Seeker detail-page checklist variant (no page slot to design/verify this
  cycle — natural next slice, mirrors how aircraft's checklist followed its
  card chip in a separate cycle).
- Owner-facing "improve your profile" nudge for seekers.
- Any change to `/listing-quality`'s copy (currently describes only aircraft
  and partnership signals) — a follow-up once the seeker checklist exists too.
