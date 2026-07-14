# Auto-unsubscribe on spam complaints

## Goal
When Resend reports an `email.complained` webhook event, immediately and
permanently unsubscribe every alert for that address — a spam complaint is a
stronger signal than a bounce and continued sends after one damages sender
reputation for every other subscriber.

## Scope
- `src/lib/resendWebhook.ts` — add `extractComplainedEmails(body)`, mirroring
  the existing `extractHardBouncedEmails` shape/tests.
- `src/lib/alertBounce.ts` — add `unsubscribeAlertsForComplainedEmail(email)`,
  mirroring `pauseAlertsForBouncedEmail` but setting `status='unsubscribed'`
  (terminal — same status the one-click unsubscribe link already uses, so
  `/alerts/manage`'s existing `.neq('status', 'unsubscribed')` filter and the
  digest cron's `status='confirmed'` query already treat it correctly with no
  further code change).
- `src/app/api/webhooks/resend/route.ts` — after handling bounces, also
  extract + process complained emails in the same request. Do NOT touch the
  signature-verification block (frozen webhook auth is fine to extend, just
  not weaken).
- Unit tests mirroring the existing `resendWebhook.test.ts` /
  `alertBounce.test.ts` (if present) coverage patterns.

## Acceptance criteria
- `extractComplainedEmails` returns lowercased recipient emails only for
  `type === 'email.complained'` events, `[]` for anything else (unrelated
  types, malformed payloads).
- `unsubscribeAlertsForComplainedEmail` sets `status='unsubscribed'` on every
  non-unsubscribed alert row for that email (scoped `.in('status', [...])`,
  same fail-soft `{count}` return shape as the bounce helper).
- The webhook route processes both `email.bounced` and `email.complained` in
  one request, still gated by `RESEND_WEBHOOK_SECRET` / signature
  verification exactly as today; ships dark (204) until the secret is set,
  same as now.
- `npx tsc --noEmit` and `npx next build` clean.
- New unit tests pass (`node --experimental-strip-types --test
  src/lib/resendWebhook.test.ts`).
- QA smoke passes on the affected surfaces (`/alerts/manage`, `/aircraft`) —
  this is a backend/webhook change with no visible UI, so read screenshots
  only if something looks off.

## Out of scope
- Any change to `/alerts/manage` UI (already handles `unsubscribed` alerts
  correctly by omitting them).
- Resend dashboard configuration (human action, same as the existing bounce
  webhook note).
- The bounce-handling code path (untouched, just extended alongside it).
