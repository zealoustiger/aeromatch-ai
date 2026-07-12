# Seeker sample cards in the alert digest email

## Goal
Give pilot-seeking-a-partnership alerts the same rich preview-card treatment in
the digest email that aircraft and partnership alerts already get, instead of
the CTA-only fallback.

## Scope
- `src/lib/email.ts`: add an optional `lookingFor?: string | null` field to
  `AlertDigestSample` (seeker samples only — e.g. "Cessna, Cirrus · 172, SR22"),
  rendered in `specsLine`/the plain-text sample line in place of `shareType`/`ttaf`
  when present. Minor robustness fix: don't render the empty `<p>` wrapper when
  a sample has no price (seeker cards never have one).
- `src/app/api/cron/alert-digest/route.ts`: add `fetchNewSeekerSamples`
  mirroring `countNewSeekers`'s filter logic (make overlap, state equality,
  `additional_airports`-aware icao OR with the same graceful-degrade retry,
  free-text model match via `matchesModelFilter`) but selecting the columns a
  card needs (`title`, `preferred_makes`, `preferred_models`,
  `home_airport`/`city`/`state`) instead of a head-only count. Wire it into the
  `samples` selection in the `GET` handler for `target.type === 'seeker'` when
  `newCount > 0` (seekers have no price-drop path).
- No schema change, no new capture point, no live cron invocation (would email
  real subscribers).

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` both exit 0.
- A seeker alert whose digest has `newCount > 0` now gets up to 3 real preview
  cards (title = the seeker's own listing title, "looking for" line built from
  `preferred_makes`/`preferred_models`, location, no price/TTAF fabricated, no
  photo slot) instead of the bare CTA-only email.
- Aircraft and partnership digest emails are byte-for-byte unchanged (samples
  logic untouched for those types; the only shared change is the harmless
  empty-`<p>` guard).
- `fetchNewSeekerSamples` filters match `countNewSeekers` exactly (make/state/
  icao/model), verified by code review + a local unit-style check (not live —
  would touch prod `partnership_seekers` rows unnecessarily for a read-only
  verification).
- qa-smoke passes on unrelated regression pages (this is a non-visual,
  no-page-rendered cycle — email/cron logic only).

## Out of scope
- The other open `[P1][goal]` item, "Partnership single-listing buy-in-drop
  email" — separate slice, not attempted this cycle.
- Any change to seeker alert *matching* (radius/model filtering) — sample
  cards only, reusing the exact filters `countNewSeekers` already applies.
- Live-firing the cron (would email real subscribers).
