# alert-unsubscribe-reason-chips

## Goal
Learn *why* a subscriber unsubscribes from an alert by adding four optional one-tap
reason chips to the `/alerts/status` unsubscribe-recovery box, each firing a single
analytics event — closing the "prove it converts" churn-side blind spot.

## Scope
- `src/components/UnsubscribeRecover.tsx` — add a small "Mind telling us why?" chip
  row (Too many emails / Not relevant / Found my aircraft / Just done) below the
  existing recovery actions + "Manage all your alerts" link. Clicking a chip fires
  `track('alert_unsubscribe_reason', { reason, count: alertCount, source_path })`
  (via the existing `@/lib/analytics` `track` helper — same one used for
  `alert_unsubscribe_recovered`/`alert_found_aircraft` two lines above) and swaps
  the chip row to a brief "Thanks — that helps." line. One shot per page view
  (local component state, no persistence needed). Renders only in the idle/error
  state (not after a recovery action is taken — at that point the visitor didn't
  actually leave).
- `src/app/alerts/status/page.tsx` — thread the already-computed `unsubSourcePath`
  down into `<UnsubscribeRecover sourcePath={unsubSourcePath} ... />` (new optional
  prop) so the event carries `source_path` like every other alert analytics event.

## Acceptance criteria
- On `/alerts/status?state=unsubscribed&token=...`, the recovery box shows 4 chips:
  "Too many emails", "Not relevant", "Found my aircraft", "Just done".
- Clicking any one chip fires exactly one `alert_unsubscribe_reason` PostHog event
  with `{ reason, count, source_path }` and swaps the row to a thanks message —
  no page reload, no DB write, no email.
- Chips are optional/skippable — not clicking one has zero effect, and the primary
  recovery actions (weekly/snooze/pause/found-my-aircraft) work exactly as before,
  unaffected by this change.
- Chips disappear once the visitor takes a recovery action (`status === 'done'`
  branches) — no double-asking after they've already told us via an action.
- No schema change, no new DB table/column, no email template change.
- `npx tsc --noEmit` and `npx next build` pass; QA smoke passes on `/alerts/status`.

## Out of scope
- The other plan-pass batch #3 item ("Delete all my alerts & data" self-serve) —
  separate item, separate cycle.
- Wiring the reason into the digest 👍/👎 `feedback` DB table — this is
  analytics-only per the backlog item's own scoping.
- Any change to the primary recovery actions' behavior or copy.
