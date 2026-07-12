# Spec: RFC 8058 `List-Unsubscribe` one-click headers on alert emails

## Goal
Add `List-Unsubscribe` / `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers to
every alert email (confirm, digest, price-drop, manage-link) so Gmail/Yahoo's native
"Unsubscribe" affordance works and bulk-sender deliverability rules are met — a throttled
or spam-foldered alert email is an alert that never fired.

## Scope
- `src/lib/email.ts` — new pure `buildListUnsubscribeHeaders(unsubscribeUrl?)` helper;
  `SendEmailInput` gains optional `unsubscribeUrl`; `sendEmail` threads it into the Resend
  request's `headers` field when present.
- `src/app/api/alerts/unsubscribe/route.ts` — factor the token→unsubscribe DB update into
  a shared helper; add a `POST` handler (RFC 8058 requires the one-click target accept
  POST and return a fast, non-interactive 200 — no redirect/interstitial).
- `src/app/actions.ts` — pass the already-computed `unsubscribeUrl` into `sendEmail` at
  the confirm-email send (`subscribeToAlert`) and confirm-resend (`sendConfirmationResend`)
  call sites; compute + pass one for the manage-link email (`requestAlertsManageLink`,
  which has `alert.unsubscribe_token` in scope but never built the URL before).
- `src/app/api/cron/alert-digest/route.ts` — pass the existing `unsubscribeUrl` into
  `sendEmail` for both the price-drop and aggregate-digest send.
- `src/lib/email.test.ts` — unit tests for `buildListUnsubscribeHeaders`.

## Out of scope
- The "one-click get fewer emails" footer link (separate backlog item).
- `buildNewMessageEmail` / `buildMatchAlertEmail` sends — not part of the alerts
  unsubscribe-token system, no unsubscribe URL exists for them.
- Any change to unsubscribe *semantics* (still flips `status='unsubscribed'`, still
  recoverable via `/alerts/status`'s existing "Pause instead" box).

## Acceptance criteria
- `sendEmail` includes `List-Unsubscribe: <url>` and
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click` in the Resend payload's `headers`
  field whenever `unsubscribeUrl` is passed; omits `headers` entirely when it isn't
  (no behavior change for `buildNewMessageEmail`/match-alert sends).
- `POST /api/alerts/unsubscribe?token=...` flips the row to `status='unsubscribed'` and
  returns `200` with no redirect (mail clients must not be shown an interstitial).
- `GET /api/alerts/unsubscribe?token=...` behavior is byte-for-byte unchanged (still
  redirects to `/alerts/status`).
- All four alert email sends (confirm, confirm-resend, manage-link, digest/price-drop)
  now pass `unsubscribeUrl` to `sendEmail`.
- `npx tsc --noEmit` and `npx next build` both pass.
- New unit tests for `buildListUnsubscribeHeaders` pass.
