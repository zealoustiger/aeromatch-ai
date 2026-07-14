# Honor `avionics` in aircraft alert matching

## Goal
Stop silently dropping the `avionics` filter (glass panel / ADS-B / autopilot / WAAS / GPS)
from aircraft alerts — honor it end-to-end (capture → match count → digest cron) instead of
stripping it at capture, so a glass-panel-filtered visitor's alert actually only fires on
glass-panel matches.

## Scope
- `src/lib/avionicsClassify.ts` — extract `parseAvionicsFilter` / `avionicsMatch` /
  `fetchAvionicsMatchIds` as shared exports (single source of truth for the id-narrowing scan).
- `src/components/AircraftSaleList.tsx` — use the shared helpers instead of its local copies
  (no behavior change on the browse page itself).
- `src/lib/alertMatchCounts.ts` — parse `avionics` into the aircraft `AlertTarget`, apply the
  same id-narrowing scan in `countActiveAircraft` + `previewAircraft`.
- `src/app/api/cron/alert-digest/route.ts` — same: parse `avionics` into the aircraft
  `AlertTarget`, apply the id-narrowing scan in `countNewAircraft` (both branches) and
  `countRecentAircraftPriceDrops`.
- `src/app/aircraft/page.tsx` — stop excluding `avionics` from `alertSourcePath`.
- `src/lib/seo.ts` (`describeAircraftFilters`) — mention the selected avionics categories in
  the alert context sentence (e.g. "Cessna 172 with glass panel").

## Acceptance criteria
- An `/aircraft?avionics=glass` alert's `source_path` now includes `avionics=glass` (no longer
  stripped).
- `/alerts/manage`'s live match count for such an alert only counts listings whose avionics
  classify to "glass panel" (verified against real DB data).
- The digest cron's `countNewAircraft` / `countRecentAircraftPriceDrops` apply the same
  narrowing (code-reviewed + unit-style verification of the shared helper; the cron itself is
  a live send path, not exercised end-to-end this cycle).
- The alert confirmation/digest context sentence names the avionics filter when set.
- No behavior change to `/aircraft`'s own avionics filter (still exact same matches).
- `npx tsc --noEmit` and `npx next build` both exit 0.

## Out of scope
- No new capture-point UI (the avionics checkboxes on `/aircraft` already exist; this only
  makes the alert honor what's already selectable there).
- No change to `/alerts/manage`'s edit form (avionics stays a non-editable, pass-through param,
  same precedent as `min_year`/`max_tt`).
