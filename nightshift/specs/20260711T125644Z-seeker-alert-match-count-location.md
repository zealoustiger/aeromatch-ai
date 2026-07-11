# seeker-alert-match-count-location

## Goal
Make `/alerts/manage`'s "N pilots match right now" count honest for pilot-seeking
alerts saved with an airport or state filter, by teaching `alertMatchCounts.ts`'s
seeker branch to parse and apply `state`/`airport` the same way the digest cron
already does (`seeker-alert-airport-state`, shipped 2026-07-11).

## Scope
- `src/lib/alertMatchCounts.ts`:
  - Extend the `seeker` `AlertTarget` variant with `state?: string` and `icao?: string`.
  - `parseSourcePath`'s `/partnerships/seeking?...` branch: also read `state`/`airport`
    off the query string (mirrors `alert-digest/route.ts`'s parser exactly).
  - `countActiveSeekers`: apply `state` (exact `.eq`) and `icao` (OR match against
    `home_airport`/`additional_airports`, same `.or(...)` shape as the cron's
    `countNewSeekers`), with the same graceful-degrade retry (home_airport-only) if
    `additional_airports` isn't migrated live yet.
- No other files. No schema change (reuses existing columns, same as the cron).

## Acceptance criteria
- A seeker alert with `source_path` like `/partnerships/seeking?airport=KPAO` now
  counts only seekers whose `home_airport` or `additional_airports` includes KPAO
  (previously counted all active seekers regardless of location).
- A seeker alert with `?state=CA` counts only seekers with `state = 'CA'`.
- `?make=Cessna&airport=KPAO` combines both filters (AND), consistent with the cron.
- A bare `/partnerships/seeking` (or `?make=...` only) alert's count is unchanged
  from today (no regression).
- If `additional_airports` isn't live yet, the count query gracefully degrades to
  `home_airport`-only matching instead of erroring (no count line shown on hard error).
- `npx next build` + typecheck pass; `/alerts/manage` renders with no new console errors.

## Out of scope
- Multi-airport/radius seeker-alert matching (not supported anywhere else either).
- Changing the digest cron itself (`alert-digest/route.ts` is untouched — separate,
  already-shipped parser, same precedent as `alertEditCriteria.ts`).
- Any UI/layout change to `/alerts/manage` (count line already renders when present;
  this only fixes what number it shows for seeker rows with location filters).
