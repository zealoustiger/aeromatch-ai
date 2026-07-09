# Spec: alert-unsubscribe-recover

## Goal
Give a visitor who clicks an alert email's one-click "Unsubscribe" link an easy way to
recover — "get fewer emails" (pause) instead of "none" — right on the landing page,
without requiring sign-in, so we don't lose subscribers who just wanted less noise.

## Scope
- `src/app/api/alerts/unsubscribe/route.ts` — forward the same `token` used to look up
  the alert into the `/alerts/status` redirect (still sets `status='unsubscribed'`
  immediately, same as today — no behavior regression on the actual unsubscribe action).
- `src/app/actions.ts` — new public, token-scoped server action `pauseAlertByToken(token)`
  (admin client, matches by `unsubscribe_token`, sets `status='paused'`). Does NOT reuse
  `loadOwnedAlert` (that path requires a signed-in session; this is a public email-link flow).
- New client component (e.g. `src/components/UnsubscribeRecover.tsx`) rendering a "Get
  fewer emails instead of none" button when a token is present on the unsubscribed state;
  calls the new action, swaps to an inline confirmation on success, tracks a PostHog event.
- `src/app/alerts/status/page.tsx` — render the new component under the existing
  "unsubscribed" copy when `token` is present in the URL.

## Acceptance criteria
1. The unsubscribe email link still immediately sets the alert to `status='unsubscribed'`
   server-side, exactly as before — no regression to the existing one-click semantics.
2. `/alerts/status?state=unsubscribed&token=...` shows a new "Changed your mind? Get fewer
   emails instead of none" recovery action beneath the existing copy; absent when no token.
3. Clicking it sets that alert's row to `status='paused'` (already skipped by the digest
   cron, same as the authenticated pause flow) via a new public, token-scoped server
   action — no session/login required.
4. On success, the button is replaced by an inline "You're paused, not gone" confirmation
   without a full page reload; on failure (invalid/reused token) shows a soft error, no crash.
5. No schema change (`status` already supports `'paused'`). No change to the authenticated
   `/alerts/manage` pause/resume/delete flow.
6. Fires a PostHog event (e.g. `alert_unsubscribe_recovered`) on successful pause so this
   surface's conversion is measurable, matching GOAL.md's "every alert surface emits an
   analytics event" guardrail.

## Out of scope
- Changing the "confirmed" or "invalid" states' copy/behavior.
- A full digest-frequency ("fewer" as in less-often, not just paused) setting — that's a
  separate, bigger `alerts` schema addition; this slice is binary pause/unsubscribe only,
  matching the existing `paused` status already wired everywhere else.
- Resuming a *paused* alert back to `confirmed` from this public token flow (only the
  authenticated `/alerts/manage` page does full resume today) — recovering to "fewer" is
  the whole ask for this slice.
- Email template copy/design changes (confirmation/digest email polish is its own backlog
  item, "Confirmation-email + confirm-landing polish").
