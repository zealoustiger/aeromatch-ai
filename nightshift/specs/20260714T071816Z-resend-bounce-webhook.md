# Auto-pause alerts on hard email bounces (Resend webhook)

## Goal
Add a Resend webhook endpoint that, on a verified hard (`Permanent`) bounce
event, pauses every alert subscribed with that email under a distinct
`bounced` status — so a typo'd or dead address stops getting digests forever
(never-spam / deliverability, GOAL.md), instead of building the pager-fatigue
of a `[bug]` that never happens because bad addresses only ever silently
under-deliver.

## Scope
- `src/lib/resendWebhook.ts` (new) — pure, unit-testable: Svix-style HMAC
  signature verification (`verifyResendWebhookSignature`) + hard-bounce
  payload parsing (`extractHardBouncedEmails`).
- `src/lib/alertBounce.ts` (new) — `pauseAlertsForBouncedEmail(email)`,
  DB write via the service-role client, mirrors `pauseAllAlerts`'s
  scoped-update shape in `src/app/actions.ts`.
- `src/app/api/webhooks/resend/route.ts` (new) — `POST` handler: graceful
  204 no-op when `RESEND_WEBHOOK_SECRET` isn't set; 401 on a missing/invalid
  signature; on a verified `email.bounced` event with `bounce.type ===
  'Permanent'`, pauses alerts for every address in `data.to`.
- `src/app/actions.ts` — `resumeAlert` accepts `status === 'bounced'` as
  resumable, not just `'paused'`.
- `src/components/AlertActions.tsx` — show the existing "Resume" action for
  `status === 'bounced'` too.
- `src/app/alerts/manage/page.tsx` — distinct red "Bounced" badge + a
  "Your email bounced — resume once it's fixed" line, instead of falling
  into the amber "Pending confirmation" bucket bounced rows would otherwise
  render as.
- `src/lib/resendWebhook.test.ts` (new) — signature verification +
  payload-parsing unit tests.

## Acceptance criteria
- No `RESEND_WEBHOOK_SECRET` set → `POST /api/webhooks/resend` returns 204,
  no DB write, no crash (mirrors `visitor-webhook`'s no-op convention).
- A request with a missing or invalid `svix-signature` (when the secret IS
  set) returns 401 and writes nothing.
- A correctly-signed `email.bounced` payload with `bounce.type ===
  'Permanent'` sets every matching, non-unsubscribed `alerts` row for that
  email to `status = 'bounced'`.
- A correctly-signed `email.bounced` payload with `bounce.type ===
  'Transient'` (soft bounce) is a no-op — never pauses on a bounce that may
  still resolve.
- `/alerts/manage` renders a bounced alert with a distinct badge/copy (not
  reused "Paused" text) and its own working "Resume" action.
- `npx next build` + `npx tsc --noEmit` stay clean; the digest cron needs no
  change (it already only queries `status = 'confirmed'`, so `'bounced'`
  rows are automatically excluded).

## Out of scope
- Registering the webhook URL/secret in the Resend dashboard — human action,
  flagged in the CHANGELOG; the endpoint ships dark (`RESEND_WEBHOOK_SECRET`
  unset in every environment right now, so it 204s until a human wires it up).
- Any UI surfacing of *why* a bounce happened (`bounce.message`) — the row
  just shows "bounced," not the raw Resend diagnostic text.
- Soft/transient bounce handling (e.g. a warning after N soft bounces) —
  only hard bounces pause, per the backlog item's own scope.
