# alert-resubscribe-after-unsubscribe

## Goal
Re-entering the same email at an alert capture point after having unsubscribed should actually resubscribe you, instead of silently staying dead forever.

## Scope
- `src/app/actions.ts`:
  - `subscribeToAlerts` (the anon/double-opt-in path `AlertSignup` uses when the visitor isn't signed in) — on a 23505 conflict, look up the conflicting row; if its `status` is `'unsubscribed'`, revive it to `'pending'` with fresh `confirm_token`/`unsubscribe_token` (clear `confirmed_at`) and send a real confirmation email via the existing `sendConfirmationResend` helper (reuses its `last_confirm_sent_at` cooldown so a resubmit loop can't spam confirmation mail).
  - `subscribeSignedInAlert` (the signed-in one-click path in the same `AlertSignup` component) — on a 23505 conflict, same lookup; if `'unsubscribed'`, revive straight to `'confirmed'` (no second opt-in needed — the session already proves the email, same precedent as this function's initial insert).
  - New small shared helper (e.g. `reviveIfUnsubscribed`) so both call sites share the lookup/update logic instead of duplicating it.
- No schema change. No new capture point. Every other capture path (`subscribeManageCrossSell`, `createManageAlert`, `subscribeToConfirmedAlert`, `subscribeSavedSearchAlert`) is unchanged this cycle — narrower-surface, ownership-scoped paths where this exact dead-end is lower-value; a natural follow-up.
- Out of scope: any UI/copy change — the fix is entirely server-side; the caller keeps seeing the same success state it always has.

## Acceptance criteria
- A fresh subscribe (no existing row) behaves byte-identical to today on both functions.
- A resubmit against an existing `pending`/`confirmed`/`paused` row still no-ops exactly as before (no email, `{ ok: true }`) — only `unsubscribed` rows get revived.
- A resubmit against an `unsubscribed` row via `subscribeToAlerts` flips it back to `pending` with new tokens, clears `confirmed_at`, and triggers a real confirm email (verified against a live throwaway `@example.com` row) — subject to the existing 10-minute resend cooldown.
- A resubmit against an `unsubscribed` row via `subscribeSignedInAlert` flips it back to `confirmed` with new tokens and a fresh `confirmed_at`, no email sent.
- `npx tsc --noEmit` and `next build` both stay clean.
- QA smoke passes on the pages that render `AlertSignup` (e.g. `/`, `/aircraft`).

## Out of scope
- The other 4 alert-insert action functions (documented above).
- Any schema/migration change.
- UI copy changes.
