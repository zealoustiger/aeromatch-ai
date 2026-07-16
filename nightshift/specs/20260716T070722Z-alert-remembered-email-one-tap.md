# Remembered-email one-tap subscribe for returning anonymous subscribers

## Goal
Let a returning, signed-out visitor who has already subscribed to an alert on THIS
browser subscribe to a NEW alert (a different listing/search) with one tap — no
retyping their email — mirroring the one-click convenience signed-in visitors
already get.

## Scope
- `src/lib/alertLocalSubscriptions.ts` — add `getLocalEmail()` / `setLocalEmail()`
  storing the subscriber's own email in this browser's `localStorage` (separate key
  from the existing source-path list; same fail-soft/SSR-safe pattern).
- `src/components/AlertSignup.tsx` — when signed out, not already subscribed to
  this exact `sourcePath`, and a remembered email exists: render a one-tap
  "Alert me — you@x.com" button (styled like the signed-in button) instead of the
  typed email field, with a small "Not you? Use a different email" fallback that
  reveals the normal field. On any successful subscribe (typed or one-tap), persist
  the email via `setLocalEmail`. `alert_subscribed` gets a new `one_tap: true`
  property on the one-tap path only.
- `src/components/AlertMeChip.tsx` and `src/components/MobileStickyAlertBar.tsx` —
  today, a signed-out tap just scrolls to and focuses the page's `#alert-email`
  field. When a remembered email exists, subscribe directly with it instead
  (`subscribeToAlerts`, same double-opt-in path as typing it) and show an honest
  "Check {email} to confirm" state (not "Alerts on" — nothing is confirmed until
  the email link is clicked). No remembered email → unchanged scroll-to-field
  behavior.

## Acceptance criteria
- A fresh browser (no remembered email) sees the exact current behavior everywhere
  — no regression to the first-time flow.
- After one successful email-only subscribe anywhere, a NEW capture surface
  (different `sourcePath`) shows the one-tap button with the remembered email.
- One-tap submit calls the real subscribe action (double opt-in — a confirmation
  email is still required), shows the existing "check your inbox" success copy in
  `AlertSignup`, and an honest, non-"already on" equivalent in the chip/sticky bar.
- "Not you?" reveals the normal typed-email field and does not lose that capture
  point's ability to subscribe with a different address.
- `alert_subscribed` fires with `one_tap: true` on the one-tap path; unchanged
  (`undefined`) on the typed path.
- No new console errors; no hydration mismatch (remembered-email state starts
  `null` server-side, hydrates client-side only, same pattern as `locallySubscribed`).

## Out of scope
- Signed-in flow (already one-tap).
- WatchAlertButton itself (unchanged — it only toggles an `AlertSignup watchOnly`
  panel, which already inherits this change).
- Any schema/DB change — this is 100% client-side `localStorage`, no migration.
