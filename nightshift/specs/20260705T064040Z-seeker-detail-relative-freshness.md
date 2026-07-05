# seeker-detail-relative-freshness

## Goal
Replace the absolute "Posted {Month Day, Year}" date on the pilot-seeking-a-partnership
detail page (`/partnerships/seeking/[id]`) with the same relative "Listed N days ago"
freshness label its own browse card (`SeekerCard`) already shows, closing a copy-consistency
gap flagged in the `partnership-card-price-drop` CHANGELOG entry (2026-07-04) and matching
the pattern the aircraft-for-sale detail page already uses in its header.

## Scope
- `src/app/partnerships/seeking/[id]/page.tsx` — replace the absolute-date `<span>` (currently
  `Posted {new Date(s.created_at).toLocaleDateString(...)}`) with a relative label computed by
  a local `listedAgo()` helper copied verbatim from `SeekerCard.tsx` (same duplication pattern
  the aircraft/partnership detail pages already use for their own local `listedAgo` copies —
  no new shared module).
- No other files. No schema change, no new query — reuses `s.created_at`, already fetched.

## Acceptance criteria
- The detail page header no longer renders an absolute "Posted {date}" string.
- It instead renders "Listed today" / "Listed N day(s) ago" / "Listed N week(s) ago" / etc.,
  using the identical bucketing logic as `SeekerCard.listedAgo` (so the card and its own
  detail page always agree).
- The `Calendar` icon and surrounding layout are unchanged.
- `npx next build` and `npx tsc --noEmit` pass clean.
- QA smoke (production build) passes on a real `/partnerships/seeking/[id]` URL at desktop
  1280 + mobile 375: HTTP 200, zero app-origin console errors, zero horizontal overflow.
- Screenshots read and confirm the header renders cleanly (visual/copy cycle).

## Out of scope
- Any change to `SeekerCard.tsx` itself (it's already correct — this cycle just brings the
  detail page in line with it).
- Adding a separate sidebar/analysis freshness panel (unlike the partnership detail page,
  which has both a header date AND a sidebar "Listed N days ago" market-check row) — the
  seeker page has no equivalent sidebar analysis panel to extend; this cycle only fixes the
  header.
- Any change to the aircraft or partnership detail pages' own date displays.
