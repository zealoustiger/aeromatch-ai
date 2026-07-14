# alert-capture-impression-events

## Goal
Give the two tap-to-open alert capture affordances — the listing-card price-drop
bell (`card_watch` / `partnership_card_watch`) and the active-filter "Alert me for
this search" chip (`filter_toolbar`) — a real per-placement **view denominator** and
a middle-funnel **open** step, so their conversions can be measured the same way the
always-mounted `AlertSignup` boxes already are.

## Why
`alert_capture_viewed` today only fires from `AlertSignup` (always mounted). The bell
and chip mount their `AlertSignup` panel *only on tap*, so those placements record
`alert_subscribed` with no view denominator — you can't compute their conversion rate.
This closes that gap on 3 existing surfaces (GOAL.md's "prove it converts"). No new
capture point, no schema change.

## Scope (small)
- `src/components/WatchAlertButton.tsx` — add optional `source`/`sourcePath`/`context`
  props; fire `alert_capture_viewed` once via IntersectionObserver when the bell scrolls
  into view, and `alert_capture_opened` on the tap that *expands* the panel (not the
  collapse). Same payload shape as `AlertSignup`'s existing `alert_capture_viewed`.
  Events only emit when a `source` is supplied — the button stays purely presentational
  for any unattributed caller.
- `src/components/AircraftSaleCard.tsx` — pass `source="card_watch"` +
  `sourcePath={watchSourcePath}` + `context={watchContext}` (all already in scope) to
  `WatchAlertButton`.
- `src/components/PartnershipCard.tsx` — same with `source="partnership_card_watch"`.
- `src/components/AlertMeChip.tsx` — fire `alert_capture_viewed` via IntersectionObserver
  while the chip is still actionable (not already-subscribed), and `alert_capture_opened`
  on tap.

## Acceptance criteria
- Scrolling a listing-card bell into view fires exactly one `alert_capture_viewed`
  with `{ context, source_path, source: 'card_watch' | 'partnership_card_watch' }`.
- Tapping a bell to OPEN its watch panel fires one `alert_capture_opened` with the same
  payload; tapping again to close fires nothing.
- The `AlertMeChip` fires one `alert_capture_viewed` (`source: 'filter_toolbar'`) when it
  scrolls into view while still actionable, and one `alert_capture_opened` on tap.
- No change to any rendered UI (markup/appearance of the bell, card, or chip is identical);
  no new console errors; no 375px horizontal overflow.
- `next build` + `tsc --noEmit` clean.

## Out of scope
- The DB-persisted `alerts.source` column (separate `[P1][goal]` item — needs human DDL).
- Per-placement conversion ranking on `/admin/alerts` (blocked on that column).
- Any new capture point or copy/visual change to the bell, chip, or cards.
- The already-instrumented always-mounted `AlertSignup` boxes (unchanged).
