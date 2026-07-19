# alert-bounced-email-change

## Goal
When a subscriber whose alert address `bounced` moves their alerts to a new email via the
existing "Change the email these alerts go to" flow, the moved rows should come back as
`confirmed` (not stay stuck as `bounced`), and `/alerts/manage` should surface that path
directly from a bounced row instead of only offering "Resume" (which just re-bounces a
dead address).

## Scope
- `src/app/api/alerts/confirm-email-change/route.ts` — on a successful email-change
  confirm, any row that was `status='bounced'` before the move is also reset to
  `status='confirmed'` and `bounced_at=null` (the new address's double-opt-in confirm
  click is the honest re-verification, same logic as the `alert-bounced-revive` cycle).
  Fail-soft (retry without `bounced_at`) if that column isn't migrated live, same pattern
  as `alertBounce.ts`/`reviveIfUnsubscribed`. Non-bounced rows' statuses are untouched.
- `src/app/alerts/manage/page.tsx` / `src/components/UpdateAlertEmailForm.tsx` — a bounced
  row's helper text gets a "move these alerts to a new email" link pointing at the
  page's existing (owner-level) change-email form; the form now defaults to open when any
  alert is `bounced` (not just when a change is already pending), so the link lands on an
  already-open form.

## Acceptance criteria
- Confirming an email change moves every eligible row to the new address (unchanged
  behavior) AND flips any row that was `bounced` to `confirmed` with `bounced_at` cleared.
- A row that fails to move (23505 per-row retry conflict) keeps its original status/email —
  never marked confirmed on the OLD, unmoved row.
- Non-bounced rows moved by the same confirm keep their pre-existing status (pending stays
  pending, paused stays paused).
- `/alerts/manage`: a bounced row shows a "move these alerts to a new email" link; clicking
  it reveals the already-open change-email form (no extra click required to open it).
- `npx tsc --noEmit` and `npx next build` both pass.
- QA smoke (desktop 1280 + mobile 375) passes on `/alerts/manage` with zero console errors
  and zero horizontal overflow.

## Out of scope
- Any other 🔔 alert-experience backlog item (confirm-mail-bombing cap, unsubscribe-reason
  persistence, reply-to, monthly cadence, pre-bounced heads-up at capture).
- Changing what triggers a bounce in the first place.
