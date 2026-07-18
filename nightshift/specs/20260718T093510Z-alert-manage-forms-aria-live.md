# alert-manage-forms-aria-live

## Goal
Finish the `/alerts/manage` + `/alerts/status` screen-reader sweep (slice 2 of the
standing `[P2][goal]` backlog item) by adding `aria-live`/`role` announcements to the
remaining components named in its own "Next" note: `AlertEditForm`, `NewAlertForm`,
`UpdateAlertEmailForm`, `DeleteAllAlertsControl`, and `UnsubscribeRecover` (on
`/alerts/status`). `DownloadAlertDataLink` is a plain download `<a>` with no client
state to announce — verified by reading it, no change needed there.

## Scope
- `src/components/AlertEditForm.tsx` — save success, hidden-criteria removal, error,
  and the debounced live match-count preview.
- `src/components/NewAlertForm.tsx` — create success + error.
- `src/components/UpdateAlertEmailForm.tsx` — email-change-request sent, cancel, error.
- `src/components/DeleteAllAlertsControl.tsx` — deletion confirmation, error.
- `src/components/UnsubscribeRecover.tsx` — pause/snooze/weekly/found-aircraft result,
  error.
- Pure `aria-*`/`role` attribute additions (a persistent `sr-only role="status"
  aria-live="polite"` region per component, mirroring `AlertActions`/`FrequencyToggle`/
  `TargetPriceEdit` already shipped, plus `role="alert"` on existing visible error
  text) — **no className/layout/copy/behavior change.**

## Acceptance criteria
- Every async success/failure result in the 5 components above is announced to
  screen readers via an `aria-live` region or `role="alert"`, matching the slice-1
  pattern exactly.
- No visual/layout/behavior change — `git diff` shows only attribute + minimal
  state-plumbing additions.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- `node --test` full suite still passes (no `src/lib` files touched, so no test
  changes expected).
- QA smoke (`qa-smoke.mjs`) passes on `/alerts/manage` and `/alerts/status` at
  desktop 1280 + mobile 375: HTTP 200, zero app-origin console errors, zero
  horizontal overflow.
- Non-visual cycle — screenshots saved for the audit trail, not read into the QA
  verdict.

## Out of scope
- `DownloadAlertDataLink` (no state to announce).
- Any new capture point, schema change, or copy/behavior change.
- The other two open `[P2][goal]` alert-experience items (narrow-alert nudge,
  digest vote counts) — separate cycles.
