# alert-instant-first-digest

## Goal
When a subscriber confirms an aircraft/partnership/seeker alert that already has ≥1 live
match, send their first real digest email immediately (instead of making them wait up to a
day/week for the next cron pass), while keeping the copy honest — this is a "here's what
matches right now" send, not a fabricated "new this week" claim.

## Scope
- `src/lib/email.ts` — extend `buildAlertDigestEmail` with an optional `firstSend` flag that
  renders honest "N match(es) right now" / "sent the moment you confirmed" copy (no
  "Sample:" prefix, no sample banner — this is a real send) instead of the periodic
  "new this week" framing.
- `src/app/api/alerts/confirm/route.ts` — on a genuine pending→confirmed transition (not a
  repeat click on an already-confirmed link), fetch the alert's `source_path`/`context`/
  `email`/`frequency`/`unsubscribe_token`, call `getAlertDigestPreview` (same helper "Send
  sample" already uses in prod), and if it returns ≥1 live match, build+send the real digest
  via `buildAlertDigestEmail({..., firstSend: true})` and set `last_digest_at` so the cron
  doesn't double-send in its next pass. Zero matches → no extra email (the confirm page's
  existing "None match right now" copy already sets expectations). Any email-send failure is
  caught and logged, never blocks the confirm redirect.
- `src/lib/email.test.ts` — unit test(s) for the new `firstSend` framing.

## Acceptance criteria
- Confirming a *pending* alert whose `source_path` has ≥1 live match sends one real digest
  email (no "Sample:" prefix, no sample banner) within the confirm request, and sets
  `last_digest_at` on that alert row so the next cron pass doesn't re-send for the same window.
- Confirming a pending alert with 0 live matches sends no extra email and does not touch
  `last_digest_at` (cron still sends the first real digest once a match exists).
- Re-clicking an already-confirmed link (idempotent re-confirm) never re-sends the instant
  digest a second time.
- A failure in the preview/send path (e.g. transient DB error) is caught, logged, and the
  visitor still redirects to `/alerts/status?state=confirmed` — never a broken confirm flow.
- `npx tsc --noEmit` and `npx next build` both pass; `src/lib/email.test.ts` passes.
- QA smoke on `/alerts/status` (and a fresh confirm round-trip against a throwaway
  `@example.com` test alert, cleaned up after) shows HTTP 200 / no console errors / no
  horizontal overflow at 1280 + 375.

## Out of scope
- Changing the cron's periodic (weekly/daily) digest framing or matching logic.
- Any new capture point or `alert_subscribed` event (this is entirely post-capture).
- Schema changes (`last_digest_at` already exists and is nullable).
