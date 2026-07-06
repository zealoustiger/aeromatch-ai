# seeker-trust-ranking

## Goal
Apply the same completeness-weighted trust ranking that `/aircraft` and `/partnerships`
already have to `/partnerships/seeking`, so fuller, more-trustworthy seeker listings
(stated aircraft preference, disclosed budget, disclosed experience, member-posted) rank
above thin ones instead of pure newest-first.

## Scope
- `src/lib/seekersQuery.ts` — `getSeekers()`: after the existing query/fallback/model-filter
  steps, apply a new local `sortByTrust()` helper (stable sort: `evaluateSeekerTrust(s).score`
  DESC, original-index tie-break) to the final row set, mirroring `sortByTrust` in
  `AircraftSaleList.tsx` / `partnershipsQuery.ts` verbatim. Apply on the mock-data path too.
- No schema change. No change to `evaluateSeekerTrust`/`seekerTrust.ts` itself.
- Unlike the aircraft/partnership precedent, `getSeekers` has no explicit `sort` param today
  (always "newest first") — so there's no other sort mode to preserve; the trust order simply
  replaces the plain `created_at desc` order as the one and only ordering.

## Acceptance criteria
- `getSeekers()` returns rows ordered by trust score (desc), tie-broken by original
  (recency) order, across: the main query path, the `additional_airports`-missing fallback
  path, and the mock-data (`hasSupabase() === false`) path.
- Filters (airport/state/make/model/rating/min_hours/share_type) are completely unaffected —
  same rows match, only the order changes.
- `npx next build` + `npx tsc --noEmit` clean.
- New/extended unit test asserts a higher-scored seeker floats above lower-scored ones,
  with same-scored seekers keeping their relative (recency) order.
- QA smoke passes on `/partnerships/seeking` (+ one filtered URL) at desktop 1280 + mobile 375
  — HTTP 200, zero app-origin console errors, zero horizontal overflow.

## Out of scope
- Slice 4 of the trust-layer item (reducing off-platform redirects).
- Any change to the trust signal definitions or the visible `SeekerTrustBadge`.
- Adding an explicit user-facing sort control to the seeking page.
