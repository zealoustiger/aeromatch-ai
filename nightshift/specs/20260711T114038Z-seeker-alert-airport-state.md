# Seeker alerts: airport/state criteria matching

## Goal
A pilot-seeking alert (`/partnerships/seeking?...`) currently matches on `make` only — an
alert saved with an `airport` or `state` filter silently ignores it and fires on any new
seeker anywhere, which is a genuine over-matching / honesty bug (GOAL.md: "only fire on
genuine matches"). Extend the digest cron's seeker matcher to honor `airport`/`state`, and
make the `/partnerships/seeking` page's inline alert capture carry those filters into its
`sourcePath` so new signups are scoped correctly.

## Scope
- `src/app/api/cron/alert-digest/route.ts`:
  - Extend the `seeker` `AlertTarget` variant with optional `state` and `icao`.
  - `parseSourcePath`'s `/partnerships/seeking?...` branch: read `state`/`airport` off the
    query string (mirrors the existing partnership branch's `g('state')`/`g('airport')`).
  - `countNewSeekers`: filter by `state` (exact match) and `icao` (match the seeker's
    `home_airport` OR `additional_airports`, matching `seekersQuery.ts`'s existing OR
    semantics) — single ICAO, no radius (mirrors `countNewPartnerships`'s existing
    single-icao, no-radius scope for partnerships). Graceful-degrade if the
    `additional_airports` column isn't migrated live yet (same retry-without-column
    precedent already used elsewhere in this file / in `seekersQuery.ts`).
- `src/app/partnerships/seeking/page.tsx`: extend the existing `alertContext`/`alertQuery`/
  `alertSourcePath` construction (currently make/model only) to also include `state` and the
  legacy single `airport` param, mirroring `/partnerships/page.tsx`'s exact pattern (uses
  `params.airport`, not the multi-select `params.airports`, since the cron matcher — like the
  existing partnership matcher — only understands one ICAO with no radius).

## Acceptance criteria
- An alert saved from `/partnerships/seeking?airport=KPAO` or `?state=CA` only counts new
  seekers whose `home_airport`/`additional_airports` includes KPAO, or whose `state` is CA,
  respectively — not every new seeker.
- Make+airport / make+state combine (AND), matching the existing make+model combination
  behavior.
- A plain `/partnerships/seeking` (no filters) alert is unaffected — still matches all new
  seekers.
- No regression to existing aircraft/partnership matching in the same file.
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke passes on `/partnerships/seeking` (this is the only visibly-changed page; the
  cron route itself has no UI).

## Out of scope
- Radius/multi-airport seeker alert matching (existing partnership alerts don't have this
  either — consistent, not a regression).
- Updating `alertMatchCounts.ts` (the separate live-match-count parser on `/alerts/manage`)
  to also honor airport/state — flagged as a natural follow-up, not required here.
- Any UI change to the seeking page's visible filters (only the alert capture's hidden
  `sourcePath`/`context` change).
