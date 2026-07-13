# alert-status-funnel-events

## Goal
Emit `alert_confirmed` and `alert_unsubscribed` analytics events from `/alerts/status` so the
"prove it converts" funnel (`alert_capture_viewed` → `alert_subscribed`) no longer goes dark at
the moment an alert actually goes live or dies.

## Scope
- New tiny client component `src/components/AlertStatusTracker.tsx` — fires exactly one `track()`
  call on mount for a given `(event, token)` pair, gated by a `sessionStorage` flag keyed on the
  token so a page refresh (or the double-render some browsers do) never double-counts.
- `src/app/alerts/status/page.tsx` — mount `AlertStatusTracker` when `key === 'confirmed'` (event
  `alert_confirmed`) or `key === 'unsubscribed'` (event `alert_unsubscribed`), passing the alert's
  `source_path` as a property so it can be joined against `alert_subscribed`/`alert_capture_viewed`
  per placement. For the `unsubscribed` branch, extend the existing `frequency` lookup query to
  also select `source_path` (no new query, just one more column).
- No schema change, no new UI, no new dependency. `weekly` state intentionally untouched (it's a
  frequency change, not a new funnel stage) — noted as a possible follow-up.

## Acceptance criteria
- Visiting `/alerts/status?state=confirmed&token=<valid confirm_token>` fires exactly one
  `alert_confirmed` event (verified via console-level `track` call / network request), carrying
  `source_path` when resolvable.
- Visiting `/alerts/status?state=unsubscribed&token=<valid unsubscribe_token>` fires exactly one
  `alert_unsubscribed` event, carrying `source_path` when resolvable.
- Refreshing the same URL does NOT fire a second event (sessionStorage gate).
- `/alerts/status?state=weekly` and `?state=invalid` fire no new event (unchanged behavior).
- `npx next build` + typecheck pass; QA smoke (desktop 1280 + mobile 375) passes with zero
  app-origin console errors and no horizontal overflow on `/alerts/status` across all 4 states.
- No regression to the existing `UnsubscribeRecover` / `AlertCrossSell` rendering or their own
  `alert_unsubscribe_recovered` tracking.

## Out of scope
- The `weekly` state's own funnel event (separate future slice if wanted).
- Any change to the confirm/unsubscribe token endpoints (`/api/alerts/*`) themselves.
- UTM attribution on alert-email links (separate open backlog item).
