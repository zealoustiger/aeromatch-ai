# seeker-card-freshness

## Goal
Give pilot-seeking listing cards (`SeekerCard`) the same "Listed N days ago" +
"New" freshness signal that aircraft-for-sale and partnership browse cards
already have, closing a parity gap (seekers currently show only a raw
"Posted <full date>" line with no relative label or "New" badge).

## Scope
- `src/components/SeekerCard.tsx` only:
  - Add `isNew(createdAt)` / `listedAgo(createdAt)` helpers, mirroring the
    exact logic already in `PartnershipCard.tsx` (keyed off `created_at`,
    same day-math ladder, same 7-day "New" threshold).
  - Add a "New" badge (amber, `Sparkles` icon) next to the existing badge row
    when `isNew(seeker.created_at)` is true.
  - Replace the footer's raw `Posted {full date}` line with the same
    `CalendarDays` + relative "Listed N days ago" treatment used on
    `PartnershipCard`/`AircraftSaleCard`.
- No changes to `SeekerList.tsx`, the seeker detail page, or any query/schema
  — freshness is computed purely from `seeker.created_at`, already present on
  every `PartnershipSeeker` row.

## Acceptance criteria
- `/partnerships/seeking` renders a "New" badge on seeker cards whose
  `created_at` is within the last 7 days, and no badge on older ones.
- Every seeker card's footer shows a relative "Listed N days ago"-style label
  (today / N days / N weeks / N months / N years) instead of the raw date.
- No layout regression: badge row wraps cleanly, footer line doesn't overflow,
  at desktop 1280 and mobile 375.
- `npx next build` + `tsc --noEmit` clean.
- qa-smoke passes on `/partnerships/seeking` (HTTP 200, zero app-console
  errors, zero horizontal overflow, both viewports).

## Out of scope
- The seeker detail page's "Posted {date}" line (kept as an exact date by
  precedent — the prior `partnership-card-freshness` cycle also only touched
  browse cards, not the detail page).
- Any schema or query change — seekers already sort `created_at desc`.
