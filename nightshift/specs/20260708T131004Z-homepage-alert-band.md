# Homepage alert band

## Goal
Give homepage visitors who aren't ready to browse a tasteful, one-field "get alerts"
capture, closing the last major page in the alert-experience goal (GOAL.md 🔔) that
has zero alert entry point today.

## Scope
- `src/app/page.tsx` — add one new `<section>` between the `DealsRail` rail and the
  "Three ways to fly more for less" explore-cards section, using the existing
  `AlertSignup` component (`src/components/AlertSignup.tsx`, no `context` prop → its
  general "Get new-listing alerts" copy) with `sourcePath="/"`.
- No new components, no schema/action changes — `AlertSignup` already wires
  `subscribeToAlerts` (existing `alerts` table insert) and fires the
  `alert_subscribed` PostHog event on submit.

## Acceptance criteria
- `/` renders a new "Get alerts" band between the deals rail and the "Three ways to
  fly more for less" section, both desktop (1280) and mobile (375).
- The band uses the existing `<AlertSignup sourcePath="/" />` (general, no-context
  copy) — submitting a valid email inserts a row via the pre-existing
  `subscribeToAlerts` server action and fires `alert_subscribed` with
  `source_path: "/"`.
- No new console errors and no horizontal overflow at 375px.
- No schema, action, or dependency changes — purely additive JSX on the homepage.
- Every other homepage section (hero, featured listings, rails, FAQ, bottom CTA)
  renders unchanged.

## Out of scope
- Geolocation/personalized homepage alert copy.
- A/B testing or dismissal/localStorage state for the band.
- Redesigning any other homepage section.
