# alert-aircraft-filter-honesty

## Goal
Make aircraft alert matching (the digest cron + the live match-count/preview
helpers) honor `min_tt`, `airport`, and `model_like` — three filters the
`/aircraft` browse page's alert capture already promises (via `source_path` +
`describeAircraftFilters`' copy) but that the matching logic silently ignores
today, so a subscriber's digest can over-match what they were told.

## Scope
- `src/app/api/cron/alert-digest/route.ts` — aircraft `AlertTarget` type,
  `resolveTarget`'s bare `/aircraft?...` branch, `applyAircraftFilters`, the
  duplicated filter block in `countNewAircraft`'s non-deal-only path. Add a
  one-time airport→state resolution (same coarse resolution
  `fetchAircraftPage`'s `filters.airport` already uses — aircraft has no
  lat/lng radius helper the way partnerships' `resolveIcaoList` does) called
  once right after `parseSourcePath` produces the target.
- `src/lib/alertMatchCounts.ts` — same three fields on its own (deliberately
  separate) aircraft `AlertTarget` type, `parseSourcePath`'s bare-path branch,
  `countActiveAircraft`, `previewAircraft`.
- No schema change. No new capture point — `source_path` already carries
  these three params verbatim (`/aircraft/page.tsx`'s `alertSourcePath`
  preserves every active query param).

## Acceptance criteria
- An alert whose `source_path` is `/aircraft?make=Cessna&min_tt=2000` only
  counts/digests active Cessnas with `ttaf >= 2000` (previously ignored
  `min_tt` entirely).
- An alert whose `source_path` includes `airport=KHWD` only counts/digests
  listings in KHWD's state (mirrors `fetchAircraftPage`'s own coarse
  airport→state resolution).
- An alert whose `source_path` includes `model_like=sr22` only counts/digests
  models matching the `sr22%` ilike pattern (mirrors the browse page's
  smart-search family match).
- `/alerts/manage`'s live "N match now" line and the digest cron's actual send
  agree for an alert carrying any of these three params.
- Existing aircraft alerts with none of these three params behave identically
  to before (no regression to make/model/state/price/year/max_tt matching).
- `npx tsc --noEmit` and `npx next build` both clean.

## Out of scope
- `q` (free-text), `grade`, `avionics` — the harder, separate `[P1][goal]`
  backlog item ("Honor-or-strip q/grade/avionics").
- Any partnership/seeker matching changes.
- Any capture-point/UI change — `source_path` already carries these params.
