# searches-inline-alert-settings

## Goal
On `/searches`, a saved-search row that already has an alert should show its Weekly/Daily
and price-drop settings inline, plus a "Turn off alerts" action — instead of forcing the
user to `/alerts/manage` to see or change them.

## Scope
- `src/lib/savedSearchAlerts.ts` — replace/extend `getAlertedSourcePaths(email)` so it
  returns per-source_path alert details (`id`, `frequency`, `price_drop_opt_in`, marketplace
  type for the price-drop gate), not just a `Set` of paths.
- `src/app/searches/page.tsx` — for each row with a matching confirmed alert, render
  `FrequencyToggle` + `PriceDropToggle` (aircraft only, mirroring `/alerts/manage`'s gate)
  inline, and a "Turn off alerts (keep the search)" button.
- New small client component `SavedSearchAlertControls.tsx` (or extend
  `SavedSearchAlertButton.tsx`) wrapping the toggles + the turn-off action, calling the
  existing `pauseAlert(id)` server action — mirrors `/alerts/manage`'s resume/pause pattern.
- No schema change (`alerts.frequency`/`alerts.price_drop_opt_in` already exist).

## Acceptance criteria
- A saved-search row with a confirmed alert shows its current Weekly/Daily frequency as a
  toggle, and (aircraft searches only) its price-drop opt-in as a toggle, inline in the row.
- Toggling either updates the underlying alert via the existing `updateAlertFrequency` /
  `updateAlertPriceDropOptIn` actions (optimistic UI, same as `/alerts/manage`).
- A "Turn off alerts (keep the search)" button calls `pauseAlert(id)`; after pausing, the row
  reverts to the pre-alert state (e.g. the original "Get alerts" button reappears) — the saved
  search itself is untouched.
- Rows with no matching alert are unaffected (no new UI renders for them).
- `next build` + typecheck pass; QA smoke clean on `/searches` desktop 1280 + mobile 375.
- No new console errors, no schema/migration change.

## Out of scope
- Any change to `/alerts/manage` itself.
- Paused alerts on `/searches` do not need a "resume" affordance this cycle (out of scope —
  resuming already works via `/alerts/manage`).
- Editing alert criteria inline (only frequency + price-drop + turn-off).
