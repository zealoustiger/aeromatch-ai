# alert-manage-actions-aria-live

## Goal
Make the three highest-frequency async feedback surfaces on `/alerts/manage` (per-row
pause/resume/snooze/delete/resend/send-sample actions, the frequency toggle, and the
target-price edit control) announce their result to screen-reader users instead of
swapping silently.

## Scope
- `src/components/AlertActions.tsx` — error message (`role="alert"`), "Sent!" resend/
  send-sample confirmations (`role="status"`/`aria-live="polite"`), wrap the whole action
  row's live-changing text so a status flip (Pause → Resume, etc.) is announced.
- `src/components/FrequencyToggle.tsx` — announce the new cadence after a successful
  toggle (`aria-live="polite"` region); on failure the button silently reverts today —
  make that revert audible too.
- `src/components/TargetPriceEdit.tsx` — error text (`role="alert"`), and announce a
  successful save/remove (the control collapses back to the button state with the new
  price in its label — add a live region so that's not the only signal).
- Pure `aria-*`/`role` attribute additions. **No className/layout/copy/behavior change.**

## Out of scope
- `AlertEditForm`'s own live match-count preview / save success-error (separate, larger
  component — future slice).
- `NewAlertForm`, `UpdateAlertEmailForm`, `DeleteAllAlertsControl`, `DownloadAlertDataLink`,
  `/alerts/status`'s `UnsubscribeRecover` — named in the backlog item but left for a
  follow-up slice to keep this cycle small (mirrors the precedent set by
  `alert-capture-aria-live`, which also shipped a partial sweep and named the rest as
  "Next").
- No new component, no schema/DB change, no visual change.

## Acceptance criteria
- Every error state in the three components above is wrapped in `role="alert"`.
- Every success/confirmation state (resend "Sent!", send-sample "Sent!", frequency
  change, target-price save) is announced via `role="status"` or `aria-live="polite"`.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- `qa-smoke.mjs` passes (HTTP 200, zero app-origin console errors, zero horizontal
  overflow) on `/alerts/manage` at desktop 1280 + mobile 375, served from a production
  build (`next start`).
- No visual/layout regression (non-visual cycle — screenshots saved for the audit trail,
  not required reading for the QA verdict).
