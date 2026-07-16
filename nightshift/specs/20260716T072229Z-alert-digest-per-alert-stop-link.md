# alert-digest-per-alert-stop-link

## Goal
Give subscribers with 2+ due alerts a per-alert "Stop just this alert" link in the
combined digest email, instead of forcing an all-or-nothing unsubscribe.

## Scope
- `src/lib/email.ts` — `AlertDigestSection` type gains an optional `stopUrl` field;
  `buildCombinedAlertDigestEmail`'s per-section HTML + text render a small
  "Stop just this alert" link when the section carries one.
- `src/app/api/cron/alert-digest/route.ts` — where `sections` is built from `group`,
  pass `stopUrl: ${SITE_URL}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}`
  per section (omit when the row has no token yet, same graceful-degrade precedent as
  `frequencyUrl`/`digestFeedbackUpUrl`).
- `src/app/api/dev/email-preview/alert-digest-combined/route.ts` — add sample
  `stopUrl` values to the fixture sections so the dev preview shows the new link.

No new route, no new page, no schema change: the link reuses the existing
`/api/alerts/unsubscribe?token=<single-alert-token>` route (already supports a
single token, not just the comma-joined combined one) and the existing
`/alerts/status?state=unsubscribed&token=<token>` page, which already offers
pause/snooze/switch-to-weekly recovery (`UnsubscribeRecover`) and a "Manage your
alerts" link scoped to that one alert.

## Acceptance criteria
- A combined digest email (2+ due alerts for one subscriber) renders one
  "Stop just this alert" link per section, next to that section's own
  "See all matches" / "View listings" CTA.
- Clicking a section's stop link unsubscribes ONLY that alert (its own
  `unsubscribe_token`), not the subscriber's other alerts in the same email.
- The overall footer "Unsubscribe from these" link (comma-joined tokens, stops
  every alert in the email) is unchanged.
- A section whose alert row has no `unsubscribe_token` yet renders with no stop
  link (fails soft, no broken link).
- `npx tsc --noEmit` and `npx next build` both pass.
- No console errors / no overflow at desktop 1280 + mobile 375 on the pages the
  smoke test can reach (this is an email-only, non-visual-page change — the
  affected surface is the email HTML/text, verified via the dev preview route
  and a direct render check, not a live page QA-smoke target).

## Out of scope
- The single-alert (non-combined) digest email — it's already fully scoped to
  one alert, so "stop just this alert" is already what its existing unsubscribe
  link does.
- Any new database column or migration.
- Changing the combined email's overall "Unsubscribe from these" footer link.
