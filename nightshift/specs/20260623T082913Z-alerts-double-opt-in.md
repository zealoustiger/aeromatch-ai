# Email alerts — double-opt-in confirmation flow (slice 2 of [P1][want] email alerts)

## Goal
When a visitor opts into new-listing alerts, send a double-opt-in confirmation email
(via a Resend-or-noop `lib/email.ts`) and give them working **confirm** and
**unsubscribe** links — so the alerts list is CAN-SPAM/GDPR-clean and ready to send
the moment the human drops in a `RESEND_API_KEY`. Nothing actually sends until that
key exists (no-op + log), so this ships safely.

## Context
- `alerts` table already carries the double-opt-in columns (migration applied):
  `confirm_token` / `confirmed_at` / `unsubscribe_token` / `last_digest_at`.
- Slice 1 (capture UI + `subscribeToAlerts` anon insert, rows land `status='pending'`)
  already shipped. This is slice 2 (confirmation send + confirm/unsubscribe routes).
- Provider = Resend (human's choice). Build gated behind `RESEND_API_KEY`; do NOT block on it.
- The weekly digest job (slice 3) is OUT of scope this cycle.

## Scope (files)
- `src/lib/email.ts` (NEW) — `sendEmail()` POSTs to Resend when `RESEND_API_KEY` is set,
  else logs `[email:noop]` and returns `{ sent:false }`. Plus `buildAlertConfirmEmail()`.
- `src/app/actions.ts` — `subscribeToAlerts`: generate `confirm_token` + `unsubscribe_token`
  in-app (`crypto.randomUUID()`), insert them with the row, and on a genuinely NEW row
  (not a 23505 dedupe) send the confirmation email. Idempotency preserved.
- `src/app/api/alerts/confirm/route.ts` (NEW) — GET `?token=`; service-role set
  `status='confirmed', confirmed_at=now()`; redirect to the status page.
- `src/app/api/alerts/unsubscribe/route.ts` (NEW) — GET `?token=`; service-role set
  `status='unsubscribed'`; redirect to the status page.
- `src/app/alerts/status/page.tsx` (NEW) — one small branded, `noindex` page that renders
  confirmed / unsubscribed / invalid messages off `?state=`.
- `src/components/AlertSignup.tsx` — success copy → "check your inbox to confirm".

## Acceptance criteria
- [ ] `npx next build` + typecheck green.
- [ ] Opting in still succeeds; a NEW subscription writes `confirm_token` +
      `unsubscribe_token` and (with no key) logs an `[email:noop]` confirmation send —
      no crash, no actual email.
- [ ] `/api/alerts/confirm?token=<confirm_token>` flips that row to
      `status='confirmed'` (+ `confirmed_at`) and lands on a branded confirmed page;
      an unknown/empty token lands on an "invalid" message, not a 500.
- [ ] `/api/alerts/unsubscribe?token=<unsubscribe_token>` flips the row to
      `status='unsubscribed'` and lands on a branded unsubscribed page.
- [ ] `/alerts/status` renders correctly at desktop 1280 + mobile 375 (no overflow,
      no app-origin console errors) and is `noindex`.
- [ ] AlertSignup success state tells the user to check their email to confirm.

## Out of scope
- The weekly "N new matches" digest job (slice 3) and any actual email delivery
  (no `RESEND_API_KEY` in this environment — sends are no-ops by design).
- Changing the `alerts` schema (already migrated) or the slice-1 capture UI layout.
- Resend domain/sender verification (human does that later).
