# alert-overlap-subscribe-hint

## Goal
When someone subscribes to a new alert that's already fully covered by one of
their existing confirmed alerts, tell them so right in the subscribe
success/confirmation panel — not just on `/alerts/manage`, which they may
never visit.

## Scope
- `src/lib/alertOverlap.ts` — add a pure `findBroaderOverlapContext(newTarget,
  existing)` helper on top of the existing `detectOverlappingAlerts` (no
  behavior change to the existing export).
- `src/lib/alertOverlap.test.ts` — unit tests for the new helper.
- `src/app/actions.ts` — `subscribeToAlerts` and `subscribeSignedInAlert`
  compute an overlap hint (via `fetchAlertsForEmail` + the new helper) right
  before returning success, and include it in the returned object as
  `overlapContext: string | null`.
- `src/components/AlertSignup.tsx` — surface `overlapContext` as a one-line
  hint in the two success states ("check your inbox" and the signed-in
  "alerts are on" panel), linking to `/alerts/manage`.

## Acceptance criteria
- Subscribing to an alert that's a strict subset of an existing *confirmed*
  alert for the same email (same rules as `/alerts/manage`'s overlap check:
  same type, every defined field on the broader alert matches, no hidden
  criteria on either side) shows "Heads up — your '{broader context}' alert
  already covers this — manage alerts" with a link to `/alerts/manage`.
- No existing overlapping alert (or the source_path isn't a recognized
  editable shape, or either side has a hidden criterion) → no hint renders,
  same success panel as before.
- The hint is informational only — it never blocks the subscribe, never
  auto-deletes/merges anything.
- No new `alert_subscribed` event shape change, no schema change.
- `npx tsc --noEmit` and `npx next build` stay clean; existing alertOverlap
  tests still pass plus new ones for the helper.

## Out of scope
- `NewAlertForm`'s add-alert-from-manage path (the `/alerts/manage` page
  already recomputes overlaps for every alert on load, including one just
  added there).
- Any change to `detectOverlappingAlerts`'s existing subsumption rules.
- Auto-merging/deleting the redundant alert.
