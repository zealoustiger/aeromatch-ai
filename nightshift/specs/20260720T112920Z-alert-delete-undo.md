# Undo for alert delete on /alerts/manage

## Goal
Deleting an alert on `/alerts/manage` is a hard, irreversible DB delete with no
recovery — give the owner a real "Alert deleted — Undo" window that restores the
exact same row (same criteria, status, frequency, digest history) if they mistap.

## Scope
- `src/app/actions.ts` — `deleteAlert` now snapshots the full row before deleting
  and returns it; new `restoreAlert(snapshot, token?)` action re-inserts it
  verbatim after proving ownership (session email match, or the alert's own
  `unsubscribe_token` — since the row is gone, we can't re-resolve ownership via
  a DB lookup on the now-deleted token anchor row, so the snapshot's own token is
  compared directly).
- New `src/components/AlertUndoProvider.tsx` — client context + a small fixed
  toast ("Alert deleted — Undo", auto-dismisses after ~8s) that lives at a stable
  position in the tree (wrapping the alert list) so it survives the server
  re-render that removes the deleted row's `<li>`.
- `src/components/AlertActions.tsx` — delete handler now also notifies the
  provider with the deleted snapshot.
- `src/app/alerts/manage/page.tsx` — wrap the alert list section in the new
  provider.
- No schema change (snapshot round-trip via `select('*')` + `insert`, not a
  tombstone column) — works regardless of which optional `alerts.*` columns are
  migrated live, since the snapshot only ever contains columns that actually exist.

## Acceptance criteria
- Deleting an alert on `/alerts/manage` still removes it immediately (same as
  today) but now shows an "Alert deleted — Undo" toast.
- Clicking Undo within the window restores the alert with identical criteria/
  status/frequency; it reappears in the list with no new confirmation email.
- The toast auto-dismisses after ~8s with no action needed; dismissing (X) also
  clears it.
- Works both for a signed-in session and a token-scoped (`?token=`) visitor,
  including the edge case of deleting the alert whose own token authenticated
  the current page load.
- No regression to pause/resume/snooze/edit/other row actions; `npx next build`
  + typecheck clean; QA smoke passes (HTTP 200, no console errors, no overflow)
  at desktop 1280 + mobile 375 on `/alerts/manage`.

## Out of scope
- A toast/undo pattern for other destructive actions (delete-all, unsubscribe).
- Any change to the digest cron or `alerts` schema.
