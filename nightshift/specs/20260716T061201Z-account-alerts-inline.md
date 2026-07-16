# account-alerts-inline

## Goal
Show a signed-in user's real email-alert subscriptions (the `alerts` table) inline on `/account`, read-only, so "Your alerts" is no longer copy-only — the first slice of GOAL.md's "signed-in users see saved-search ↔ alert unified."

## Scope
- New `src/lib/alertsForOwner.ts`: extract the existing `fetchAlertsForEmail` (+ `AlertRow` type) out of `src/app/alerts/manage/page.tsx` verbatim (same optional-column retry logic) so both pages share one implementation. Update `alerts/manage/page.tsx` to import it instead of defining it locally — no behavior change there.
- `src/app/account/page.tsx`:
  - Fetch `fetchAlertsForEmail(user.email)` for the signed-in user alongside the existing `saved_searches` fetch.
  - Add a new "Your alerts" section (Bell icon, same `ch-panel` styling) rendering each alert row: context (`a.context || 'New listings'`), the same status-badge convention as `/alerts/manage` (bounced/paused/confirmed/pending colors), and the `describeLastDigest(a.last_digest_at, normalizeFrequency(a.frequency))` cadence line. No edit/pause/delete controls — every row is a plain summary; a "Manage alerts" link at the bottom goes to `/alerts/manage`.
  - Honest empty state ("No alerts yet") mirroring the existing saved-searches empty state, pointing at the same three marketplaces.
  - Retitle the existing saved-searches section from "Email alerts" to "Saved searches" and trim its copy so it no longer doubles as the alerts explainer (that's now the new section's job) — no change to its query, rows, or links.
- No schema change. No new capture point. No `alert_subscribed` event (read-only display of existing subscriptions).

## Acceptance criteria
- Signed-in `/account` renders a "Your alerts" section listing every non-unsubscribed `alerts` row for the session email, each showing context + status badge + cadence line, matching `/alerts/manage`'s conventions.
- Zero alerts renders an honest empty state, not an error or blank section.
- Every alert row and the section itself link to `/alerts/manage` for any action (no edit/pause/delete UI added here).
- The "Saved searches" section still renders exactly the same saved-search rows/links as before (retitled only).
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/account` and `/alerts/manage` (desktop 1280 + mobile 375, zero app-origin console errors, zero horizontal overflow); this is a visual/component change, so screenshots are read for both pages.

## Out of scope
- Any edit/pause/delete/frequency-toggle control on `/account` itself (stays on `/alerts/manage`).
- Merging saved-searches and alerts into one unified list/model (later slice).
- Any new alert capture point or analytics event.
