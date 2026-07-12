# One-click "get fewer emails" link in alert-email footers

## Goal
Give a daily-frequency alert subscriber a one-click "switch to weekly" option
right in the digest/price-drop email footer, before they ever reach the
unsubscribe link — completing GOAL.md's "fewer instead of none" *inside the
email itself*.

## Scope
- `src/app/api/alerts/frequency/route.ts` (new) — GET-only, token-scoped,
  mirrors `/api/alerts/unsubscribe`'s GET pattern: reuses the already-shipped
  `updateAlertFrequencyByToken(token)` (src/app/actions.ts), redirects to
  `/alerts/status?state=weekly&token=<token>` (or `?state=invalid`).
- `src/lib/email.ts` — `buildAlertDigestEmail` and `buildPriceDropEmail` gain
  an optional `frequencyUrl` param; when present, the footer renders a third
  link ("Get fewer emails (switch to weekly)") next to Manage/Unsubscribe, in
  both HTML and plain-text bodies.
- `src/app/api/cron/alert-digest/route.ts` — computes
  `frequencyUrl = frequency === 'daily' && unsubToken ? \`${SITE_URL}/api/alerts/frequency?token=${unsubToken}\` : undefined`
  and passes it to both email builders. Only shown for daily-cadence alerts —
  a weekly alert has no "fewer" option to offer.
- `src/app/alerts/status/page.tsx` — new `weekly` state ("You're on weekly
  emails now") alongside the existing `confirmed`/`unsubscribed`/`invalid`
  states, following the exact same icon/tint/title/body pattern.

## Acceptance criteria
- A daily-frequency alert's digest/price-drop email footer shows a third
  "Get fewer emails" link; a weekly alert's footer is unchanged (Manage +
  Unsubscribe only, `frequencyUrl` undefined → no third link rendered).
- Clicking the link (no session required) flips the alert's `frequency` to
  `weekly` (status stays whatever it already was — no side effect on
  status) and lands on `/alerts/status?state=weekly` with an honest
  confirmation.
- Invalid/missing token → `/alerts/status?state=invalid`, same as the
  existing unsubscribe route's fallback.
- Graceful-degrades exactly like `updateAlertFrequencyByToken` already does
  if `alerts.frequency` isn't migrated live yet (no crash, same precedent).
- `npx tsc --noEmit` and `npx next build` both pass.
- No new capture point, no schema change, no PII exposed via the token
  (same token already mailed to the subscriber).

## Out of scope
- Any change to `buildAlertConfirmEmail`/`buildManageLinkEmail` (one-shot
  emails, not recurring digests — no "too many emails" complaint to address).
- A UI toggle anywhere other than the email footer + status-page landing.
- Migrating `alerts.frequency` live (pending human DDL, tracked elsewhere).
