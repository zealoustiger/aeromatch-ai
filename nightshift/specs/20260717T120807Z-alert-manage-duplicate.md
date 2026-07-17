# Spec: "Duplicate this alert" on /alerts/manage

## Goal
Add a per-row "Duplicate" action on `/alerts/manage` that opens the existing
`NewAlertForm`, prefilled from the source row's criteria/frequency/price-drop
setting, so a subscriber can cover a sibling model/state without re-entering
everything from scratch.

## Scope
- `src/app/actions.ts` — extend `createManageAlert` with an optional 4th
  `opts` param (`frequency`, `priceDropOptIn`, `source`) so a duplicate can
  carry over the source alert's cadence/price-drop setting and tag itself
  `source: 'manage_duplicate'` (currently hardcoded to weekly/opt-in-true/
  `manage_new`). Existing callers (`NewAlertForm`'s plain "+ New alert") keep
  identical behavior via defaults.
- `src/components/NewAlertForm.tsx` — add optional `initial` (prefill
  make/model/state/minPrice/maxPrice/airport/frequency/priceDropOptIn),
  `source`, and `autoOpen`/`onClose` props so the same form can be mounted
  pre-filled-and-open per row instead of only via its own collapsed
  "+ New alert" trigger. No behavior change when these are omitted.
- `src/components/AlertEditForm.tsx` — add a "Duplicate" button next to
  Edit (same visibility gate: only when `target` is non-null, i.e. the row
  is a real editable aircraft/partnership/seeker search, not a single-listing
  watch). Clicking it mounts `NewAlertForm` prefilled from `target` (via the
  existing `targetToFields` helper) + the row's `frequency`/`price_drop_opt_in`,
  mutually exclusive with the Edit form (only one inline form open per row).
- `src/app/alerts/manage/page.tsx` — pass `frequency`/`priceDropOptIn` through
  to `AlertEditForm` (both already computed per-row, just not threaded yet).

## Acceptance criteria
- A confirmed/editable alert row on `/alerts/manage` shows a "Duplicate"
  button alongside View/Edit/Actions.
- Clicking it opens an inline form pre-filled with that row's make/model/
  state/price range (or airport, for partnerships) — the same fields the
  Edit form already shows for that row.
- Submitting creates a NEW alert row (does not mutate the source row) tagged
  `source: 'manage_duplicate'` in the DB, carrying over the source alert's
  frequency and price-drop opt-in, and fires `alert_subscribed` with
  `source: 'manage_duplicate'`.
- Submitting an exact duplicate (no edits) hits the existing
  `unique(email, source_path)` guard and returns the same graceful
  "already exists" idempotent success the plain New-alert form already gets
  — no duplicate row, no error shown to the user.
- The existing "+ New alert" flow (blank form, `source: 'manage_new'`) is
  unchanged.
- No regression to Edit/Pause/Resume/Snooze/Delete/Share on the same row;
  no 375px overflow in the row's action cluster (that class of bug was fixed
  last cycle — verify with real seeded rows, bounding-box style, not just
  `scrollWidth`).

## Out of scope
- Carrying over `target_price` (only applies to single-listing "watch"
  alerts, which have no `target` / no Edit-Duplicate UI at all today).
- Any change to the plain "+ New alert" form's own fields/UI.
- Price-drop-ONLY mode and the combined-digest-unsubscribe recovery item
  (separate backlog entries).
