# Spec: Change the email address on your alerts (`/alerts/manage`)

## Goal
Let a subscriber move every alert tied to their old email address to a new one, via a
double-opt-in confirmation sent to the NEW address — closing the biggest remaining CRUD gap
on `/alerts/manage` (today the only option is delete-and-resubscribe-blind).

## Scope
- `supabase/schema.sql` — additive migration: `alerts.pending_email text`,
  `alerts.email_change_token text` (both nullable, no default). Human-apply, same pattern as
  every prior `alerts.*` column (graceful fail-soft until applied).
- `src/lib/email.ts` — new `buildAlertEmailChangeConfirmEmail()` builder.
- `src/app/actions.ts` — new `requestAlertEmailChange(newEmail, token?)` and
  `cancelAlertEmailChange(token?)` server actions, reusing `resolveOwnerEmail`'s trust
  boundary (session email or `unsubscribe_token`).
- `src/app/api/alerts/confirm-email-change/route.ts` — new GET route: looks up the
  `email_change_token`, flips `email` to `pending_email` for every row sharing that token,
  clears the pending columns, redirects to `/alerts/status?state=email_changed`. Falls back
  to a per-row retry if a unique-constraint conflict hits (target email already has an alert
  with the same `source_path`) so a conflicting row is skipped rather than losing data or
  failing the whole batch.
- `src/app/alerts/status/page.tsx` — new `email_changed` state.
- `src/app/alerts/manage/page.tsx` — select `pending_email`, render the new form.
- `src/components/UpdateAlertEmailForm.tsx` — new small client component (collapsed by
  default; shows a pending-change banner + cancel button when a change is already in flight).

## Acceptance criteria
- On `/alerts/manage`, a subscriber can enter a new email and submit; a confirmation email
  is sent to the NEW address (old address is untouched and keeps receiving digests).
- Clicking the confirmation link moves every one of that owner's alerts to the new email in
  one shot and lands on a friendly `/alerts/status?state=email_changed` page; the old
  manage-link token keeps working afterward (token identity is independent of the `email`
  column value).
- A pending change is visible on `/alerts/manage` (banner naming the new address) with a
  "Cancel" action that clears it without sending any email.
- If the DB migration hasn't been applied yet, the request action fails soft with a clear
  message — never a 500, never a silent no-op that looks like success.
- `npx tsc --noEmit` and `npx next build` both pass; QA smoke passes on `/alerts/manage` and
  `/alerts/status` at desktop 1280 + mobile 375, zero console errors, zero overflow.

## Out of scope
- Notifying the OLD address that a change happened/completed.
- Rate-limiting repeated change requests (mirrors the existing lack of a hard rate limit on
  `subscribeToAlerts`'s resend paths beyond the existing `last_confirm_sent_at` cooldown,
  which this slice does not wire in here to keep the change small).
- Any auth/account email change — this only touches the alerts table, not `auth.users`.
