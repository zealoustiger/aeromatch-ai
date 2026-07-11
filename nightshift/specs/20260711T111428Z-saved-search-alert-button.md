# One-click "Get email alerts" on saved searches (saved-search ↔ alert unification, slice 1)

## Goal
Let a signed-in user turn on real email alerts for any of their saved searches with one click on `/searches`, and stop `/account`'s "Email alerts" section from claiming (falsely) that saving a search already does this.

## Context
`saved_searches` and `alerts` are today completely disjoint tables — nothing reads `saved_searches` to send email. `/searches` says "We'll notify you when new listings match your criteria" and `/account`'s "Email alerts" section says "Saving a search turns on its alerts automatically, no extra step" — both false. GOAL.md explicitly calls for saved-search ↔ alert unification for signed-in users. `subscribeToConfirmedAlert` (actions.ts) already establishes the "no second opt-in for an already-verified email" precedent this reuses (there via a confirm token; here via the signed-in session).

## Scope
- `src/app/actions.ts` — new `subscribeSavedSearchAlert(searchId: string)` server action: auth-gated, looks up the caller's own `saved_searches` row (RLS-scoped), inserts a `status='confirmed'` row into `alerts` (email = the account's own verified email, context = the search's own name, source_path = `${path}?${search_params}`), idempotent on the `(email, source_path)` unique violation.
- `src/lib/savedSearchAlerts.ts` (new) — small read-only helper, service-role, returning the set of `source_path`s the user already has a confirmed alert for (so the button can render correctly on load without a second opt-in prompt).
- `src/components/SavedSearchAlertButton.tsx` (new) — client button: idle → "Get email alerts"; pending → spinner state; done → "✓ Alerts on"; fires `alert_subscribed` (source: `saved_search`) on success.
- `src/app/searches/page.tsx` — wire the button into each saved-search row (populated-list branch only).
- `src/app/account/page.tsx` — fix the "Email alerts" section's false copy ("Saving a search turns on its alerts automatically") to be honest and point at `/searches` to actually turn them on.

## Acceptance criteria
- A signed-in user with ≥1 saved search sees a "Get email alerts" button on each row on `/searches`.
- Clicking it creates a real `status='confirmed'` `alerts` row for the account's own email with `source_path` matching that saved search's filters, with no second opt-in email round-trip, and the button flips to "✓ Alerts on".
- Clicking again (or reloading after subscribing) does not create a duplicate row and does not error.
- `alert_subscribed` fires with `context`/`source_path`/`source: 'saved_search'` on a genuinely new subscribe.
- `/account`'s "Email alerts" section no longer claims saved searches auto-email; it accurately describes the flow.
- `npx next build` + typecheck pass; QA smoke clean at desktop 1280 + mobile 375 on `/searches` and `/account` (signed-in state), no new console errors, no horizontal overflow.

## Out of scope
- Editing/pausing/deleting the created alert from `/searches` itself (already covered by `/alerts/manage`).
- Auto-creating an alert at save-search time (this is an explicit opt-in click, not implicit).
- Any change to the anonymous/no-account `AlertSignup` capture flow.
