# partnership-detail-alert-cta

## Goal
Add an email-only "get alerts" capture block to `/partnerships/[id]` (the partnership detail page), pre-filled with that listing's make/model context — closing the last major listing-detail-page gap in the alert-experience rollout (aircraft listing detail already has this; partnership detail doesn't).

## Scope
- `src/app/partnerships/[id]/page.tsx` — import `AlertSignup` and render it in the sidebar (mirrors the aircraft-listing-detail placement: a direct sibling card after the contact/source card).
- No other files. No schema/action change — reuses the existing `AlertSignup` component and `subscribeToAlerts` action as-is.

## Acceptance criteria
- `/partnerships/[id]` renders an `<AlertSignup>` block in the sidebar for every partnership listing (on-platform or otherwise).
- `context` is the make+model string (e.g. "Cirrus SR22"), matching the aircraft-listing-detail pattern; falls back gracefully if make is missing.
- `sourcePath` routes to the partnerships browse/search surface scoped by make(+model) — `/partnerships?make=...&model=...` — mirroring the aircraft-listing-detail convention (not a listing-id-scoped path), so the resulting alert is a real, matchable search.
- `noun="partnership"` so the copy reads correctly.
- Submitting the form persists the alert (existing `subscribeToAlerts` action, unchanged) and fires `alert_subscribed` (existing behavior in `AlertSignup`, unchanged).
- No console errors, no horizontal overflow at 1280px/375px, smoke gate passes on `/partnerships/[id]` for a real listing id.

## Out of scope
- Any new PostHog event payload shape or `source` tag beyond the existing `context`/`source_path` fields.
- Alerts on the seeker detail page (already shipped).
- Any schema change.
