# alert-signin-one-click

## Goal
When a visitor is signed in with a verified email, every `AlertSignup` capture point on the
site skips the email-retype step and creates the alert immediately (already-confirmed) with
one button click, instead of showing an email field the signed-in user has to fill in again.

## Scope
- `src/app/actions.ts` — new server action `subscribeSignedInAlert(context, sourcePath,
  priceDropOptIn, frequency)`: resolves the signed-in session's email
  (`createServerSupabaseClient().auth.getUser()`), inserts the alert directly as
  `status: 'confirmed'` (same no-second-opt-in precedent as `subscribeSavedSearchAlert` /
  `subscribeToConfirmedAlert`), with the same graceful price_drop_opt_in/frequency
  not-yet-migrated-column retry `subscribeToAlerts` already does. Idempotent on 23505
  (already subscribed → `{ ok: true }`). No confirmation email sent (ownership already proven).
- `src/components/AlertSignup.tsx` — client-side auth check (mirrors `Nav.tsx`'s
  `createClient()` + `auth.getUser()` / `onAuthStateChange` pattern). When a session with a
  verified email exists: render "Alert me — we'll email {email}" as a single button in place
  of the email input + submit button; price-drop checkbox and frequency select stay as-is
  (not text retyping, no friction to remove there). On click, calls
  `subscribeSignedInAlert`, tracks `alert_subscribed` with `signed_in: true` added to the
  payload, and shows an immediate "You're set — alerts are on" confirmation (no "check your
  inbox" copy, since there's no pending confirmation step). Signed-out visitors see the
  existing unchanged email-field flow.

## Acceptance criteria
- Signed-out: `AlertSignup` renders exactly as today (email field + button); no behavior change.
- Signed-in (verified session): `AlertSignup` renders a single "Alert me — we'll email
  {email}" button, no email input; clicking it creates a `status: 'confirmed'` alert row for
  the session's own email/context/sourcePath and shows a confirmed-state message (not the
  "check your inbox" pending copy).
- Re-clicking (or an already-subscribed context) is idempotent — no duplicate row, no error
  shown to the user.
- `alert_subscribed` still fires on every successful subscribe, signed-in path adds
  `signed_in: true` to the event payload.
- `npx next build` (typecheck + build) passes clean.
- No regression on any existing `AlertSignup` call site (aircraft/partnership/seeker pages,
  `/alerts` landing) — smoke-tested signed-out (can't easily seed a signed-in smoke session
  for every call site; verify signed-in behavior via a real magic-link test session against
  one representative page).

## Out of scope
- Saved-search ↔ alert inline settings, cross-sell suggestions, other open `[goal]` items.
- Changing the price-drop/frequency controls' UI.
- The digest-cron price-drop wiring (separate backlog item).
