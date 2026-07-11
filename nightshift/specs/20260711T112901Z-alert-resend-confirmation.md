# Resend confirmation email for pending alerts

## Goal
Give a subscriber whose double-opt-in confirmation email got lost (spam filter,
mistyped-but-valid address, just missed it) a way to get it again, instead of
being permanently stranded in `status='pending'`.

## Scope
- `supabase/schema.sql` — additive `alerts.last_confirm_sent_at timestamptz` column
  (rate-limit bookkeeping), flagged `⚠️ HUMAN ACTION REQUIRED` same as the other
  pending `alerts.*` migrations.
- `src/app/actions.ts` — a shared `sendConfirmationResend` helper plus two entry
  points:
  - `resendAlertConfirmation(id)` — owner-scoped (signed-in email match, mirrors
    `loadOwnedAlert`'s pattern), for the Pending rows on `/alerts/manage`.
  - `resendAlertConfirmationByEmail(email, sourcePath)` — public, token-free
    (looked up by the email+source_path the visitor just submitted seconds ago,
    same trust level as the original signup), for `AlertSignup`'s post-submit state.
  - Rate limit: max 1 resend per alert row per 10 minutes. Gracefully degrades
    (allows the send but skips persisting the timestamp) if the new column isn't
    migrated live yet — never a hard error.
- `src/components/AlertActions.tsx` — a "Resend" button shown only when
  `status === 'pending'` on `/alerts/manage`.
- `src/components/AlertSignup.tsx` — a small "Didn't get the email? Resend it"
  link in the post-submit "check your inbox" state.

## Acceptance criteria
- On `/alerts/manage`, a pending alert row shows a Resend button; confirmed/paused
  rows do not.
- Clicking Resend re-sends the exact same confirm-link email (same token, so the
  original link still also works) and shows inline success/error feedback.
- Clicking Resend a second time within 10 minutes shows a friendly rate-limit
  message instead of sending again.
- After submitting `AlertSignup`, the "check your inbox" state shows a resend
  link; clicking it re-sends using the just-submitted email + this page's
  `sourcePath` with no re-entry of the email.
- `npx next build` + typecheck pass; QA smoke passes on `/alerts/manage` and one
  alert-capture page (desktop 1280 + mobile 375, no console errors, no overflow).
- No schema change breaks existing pause/resume/delete/edit actions if the new
  column isn't migrated yet (graceful fallback, consistent with every other
  pending `alerts.*` migration).

## Out of scope
- Resuming a resend for a token that's already been used to confirm (existing
  "already confirmed" branch just no-ops with a clear message).
- Any change to the confirm/unsubscribe route logic itself.
- The other three open `[goal]` items in this backlog section (seeker
  airport/state matching, partnership price-drop alerts, sibling-model cross-sell).
