# alert-revive-resend-status-fix

## Goal
Fix a P0 alert-flow bug: `reviveIfUnsubscribed`'s post-revive confirmation email silently
never sends for the anonymous (`targetStatus === 'pending'`) revive path.

## Bug
`reviveIfUnsubscribed` (`src/app/actions.ts`) fetches the existing row (`status:
'unsubscribed'`, the only status that passes its guard), updates the DB row's `status` to
`targetStatus`, then calls:

```ts
await sendConfirmationResend(admin, { ...existing, confirm_token, unsubscribe_token, last_confirm_sent_at: null })
```

`existing` still carries the stale `status: 'unsubscribed'` (the spread never overrides
`status`), and `sendConfirmationResend`'s very first line is:

```ts
if (alert.status !== 'pending') return { error: 'This alert is already confirmed.' }
```

So every anonymous "re-subscribe after unsubscribe" revive rotates tokens and flips the DB
row to `pending` correctly, but the actual confirmation email is never sent — the visitor
sees the "check your email" success panel and nothing ever arrives. The caller (`subscribeToAlerts`'s
23505 branch) doesn't check `reviveIfUnsubscribed`'s return value, so this fails completely
silently. Confirmed by direct code read; not previously caught because prior QA passes
verified the DB row's `status`/tokens changed but did not verify actual email delivery.

## Scope
- `src/app/actions.ts` — `reviveIfUnsubscribed`: pass the correct post-update status
  (`targetStatus`) into `sendConfirmationResend` instead of the stale pre-update one.

## Acceptance criteria
- Reviving a previously-`unsubscribed` alert via the anonymous path (`targetStatus ===
  'pending'`) now actually sends a fresh confirmation email (verified live against a real
  throwaway `@example.com` row + a real Playwright browser watching the send/return path,
  not just the DB row's `status` column).
- The signed-in path (`targetStatus === 'confirmed'`) is unaffected — it never calls
  `sendConfirmationResend` (only fires when `targetStatus === 'pending'`).
- `npx tsc --noEmit` and `npx next build` pass.
- No other behavior of `subscribeToAlerts`/`subscribeSignedInAlert`/`reviveIfUnsubscribed`
  changes.

## Out of scope
- Extending revival to `bounced` rows (separate BACKLOG item, next cycle).
- Any UI/copy change — this is a pure server-action logic fix, no page touched.
