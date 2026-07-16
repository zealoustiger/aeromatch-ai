# Edit/remove the target price on watch alerts (`/alerts/manage`)

## Goal
Let a subscriber who set a "watch this listing until price ≤ $X" alert change
or clear that target price from `/alerts/manage`, without deleting and
recreating the alert.

## Scope
- `src/app/actions.ts` — new `updateAlertTargetPrice(id, targetPrice: number | null, token?)`
  server action, mirroring `updateAlertPriceDropOptIn`'s ownership check +
  graceful-degrade-on-missing-column pattern.
- `src/components/TargetPriceEdit.tsx` (new) — small inline edit control:
  shows current target (if any) + a pencil to open a one-field number input,
  Save / Clear / Cancel.
- `src/app/alerts/manage/page.tsx` — render `TargetPriceEdit` next to the
  existing watch-status line for rows where `watch` is truthy (aircraft +
  partnership watch alerts both use the same `target_price` column).

## Acceptance criteria
- A watch-alert row with a `target_price` set shows its current target and an
  Edit affordance.
- A watch-alert row with no `target_price` set gets an "Add a target price"
  affordance (not just edit-when-present) — otherwise the only way to add one
  is still delete-and-recreate, which doesn't fully close the gap.
- Editing and saving a new target price persists it (verified via a live
  round-trip against a real, disposable test alert).
- Clearing the target price sets it back to `null` (watch alert still active,
  just without a price ceiling).
- Non-watch alert rows (family-search alerts) are unaffected — this control
  never renders for them.
- `npx tsc --noEmit` and `npx next build` both exit 0.

## Out of scope
- Editing any other field of a watch alert (it only ever watches one listing;
  no make/model/state to edit).
- Changing `AlertEditForm`/`buildAlertCriteriaUpdate` (family-search criteria
  machinery) — watch alerts stay a deliberately separate, narrower path, same
  precedent as `alertWatchStatus.ts`.
