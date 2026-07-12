# saved-page-alert-capture

## Goal
Add an alert-capture entry point to `/saved` (both the signed-in view and the
logged-out device-saves view) — the page currently shows saved listings with zero
way to subscribe to alerts, despite a save being strong purchase intent.

## Scope
- `src/lib/savedAlertContext.ts` (new) — pure helper that derives a family-scoped
  alert suggestion (make + noun + sourcePath) from a visitor's saved partnerships
  + aircraft-for-sale, honesty-gated (returns `null` — "too mixed to name" — on a
  tie for the most-saved make, or when there are no makes at all).
- `src/app/saved/page.tsx` — signed-in view: render `<AlertSignup>` after the
  listing sections (family-scoped when `deriveSavedAlertContext` returns a result,
  else the generic no-context box), and also in the zero-saves empty state.
- `src/components/DeviceSavedListings.tsx` — same treatment for the logged-out
  device-saves view (client-side, same helper run over its hydrated state).

## Acceptance criteria
- `/saved` (signed-in, has saves) renders an `AlertSignup` naming the visitor's
  most-common saved make when there's an unambiguous plurality; falls back to the
  generic box when saves are empty or tied across makes.
- `/saved` (signed-in, zero saves) still renders a generic `AlertSignup`.
- `/saved` (logged-out, device saves) gets the same two behaviors via
  `DeviceSavedListings.tsx`.
- Submitting the box fires `subscribeToAlerts` → `alert_subscribed` exactly as the
  existing component already does elsewhere (no changes to `AlertSignup.tsx` itself).
- `next build` + typecheck pass; QA smoke passes at desktop 1280 + mobile 375 with
  zero console errors / zero overflow.
- No schema change, no new dependency, no `AlertSignup.tsx` change.

## Out of scope
- Model-level (not just make-level) family scoping.
- Seeker-listing saves feeding the make signal (a seeker's `preferred_makes`
  describes what THAT pilot wants, not the saver's own taste — excluded).
- `alertCount` / `matchCount` social-proof props on this surface.
