# alert-bounced-revive

## Goal
Re-subscribing with an email address whose alert row previously bounced now revives it (fresh tokens, back to `pending`/`confirmed`, real confirm email) instead of silently staying a permanent `status='bounced'` dead end.

## Scope
- `src/app/actions.ts` — `reviveIfUnsubscribed` (the shared 23505-conflict reviver used by `subscribeToAlerts`, `subscribeSignedInAlert`, `subscribeSavedSearchAlert`, `subscribeManageCrossSell`, `subscribeToConfirmedAlert`): extend the guard from `status === 'unsubscribed'` to also match `status === 'bounced'`, and clear `bounced_at` (fail-soft retry if the column isn't migrated live, same pattern used elsewhere in this file) alongside the existing `unsubscribed_at: null` clear.
- No schema change (`bounced_at` already exists in `supabase/schema.sql`, already read/written elsewhere in this file — this cycle doesn't add a new column, just widens an existing revive path to cover it).
- No new capture point, no new UI, no analytics change.

## Acceptance criteria
- A `bounced` alert row that receives a new matching insert (23505 conflict) is revived exactly like an `unsubscribed` row is today: fresh `confirm_token`/`unsubscribe_token`, `status` set to the caller's `targetStatus` (`pending` for anon capture, `confirmed` for signed-in/saved-search/cross-sell paths), `bounced_at` cleared.
- When `targetStatus === 'pending'`, a real confirmation email is sent via the existing `sendConfirmationResend` path (unchanged from the unsubscribed-revive case).
- A row that isn't `unsubscribed` or `bounced` (e.g. `paused`, `pending`, `confirmed`) is still left untouched — true no-op, no regression to the existing guard.
- Fail-soft: if `bounced_at` isn't migrated live on a given environment, the revive (status/tokens) still succeeds — same graceful-degrade precedent as every other `alerts.*` optional column in this file.
- `npx tsc --noEmit` and `npx next build` both pass.

## Out of scope
- The `/alerts/manage` "wrong address? move to a new email" affordance on bounced rows (separate backlog item, `alert-manage-bounced-email-change` slice).
- Capping confirmation emails per address (separate backlog item).
- Persisting unsubscribe reasons (separate backlog item).
- Any UI/copy change — this is a server-action logic fix only, same shape as the prior `alert-revive-resend-status-fix` cycle.
