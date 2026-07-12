# alert-capture-viewed-event

## Goal
Fire a once-per-mount `alert_capture_viewed` impression event when an alert capture box actually scrolls into view, so per-placement conversion rate (`alert_subscribed` / `alert_capture_viewed`) becomes computable — today only the numerator (subscribes) is tracked.

## Scope
- `src/components/AlertSignup.tsx` — add an `IntersectionObserver`-driven, fire-once impression event carrying the same `context`/`source_path`/`source`/`match_count` shape as the existing `alert_subscribed` call.
- `src/components/QuickStartSearchForm.tsx` — same impression event for its own inline alert-capture form (it doesn't render `AlertSignup`, so needs its own instrumentation), using its initial (pre-interaction) `source_path`.
- No schema change. No new UI. No change to any existing event payload or behavior.

## Acceptance criteria
- `alert_capture_viewed` fires exactly once per component mount, only when the capture box scrolls into the viewport (not immediately on mount for below-the-fold placements) — implemented via `IntersectionObserver`.
- Fires regardless of which internal state the box renders in (idle capture form / already-subscribed / existing-alert) since it measures placement visibility, not funnel state.
- Payload includes `context`, `source_path`, `source`, `match_count` — same field shape/naming as `alert_subscribed` so the two can be joined per placement.
- Does not fire twice for the same mount (guard against duplicate `IntersectionObserver` callbacks / re-renders).
- `QuickStartSearchForm`'s own alert-capture UI on `/searches` emits the same event once visible.
- `npx next build` + typecheck clean; no new console errors on any page rendering `AlertSignup`.

## Out of scope
- Any dashboarding/reporting of the new event (PostHog-side, not this repo).
- Wiring `matchCount` into additional `AlertSignup` call sites that don't already pass it (separate open backlog item).
- Any change to `alert_subscribed`'s existing payload or the Slack visitor-webhook event copy (the new event flows through the existing generic `track()`/`notifyVisitor()` pipeline unchanged, same as other view-type events like `listing_viewed`).
