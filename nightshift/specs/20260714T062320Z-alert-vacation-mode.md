# Vacation mode — bulk pause/resume on `/alerts/manage`

## Goal
Let a subscriber with multiple alerts pause (and later resume) all of them in one click, instead of snoozing each row individually — the "fewer, not none" management polish called for in GOAL.md and BACKLOG.md's plan-pass batch.

## Scope
- `src/app/actions.ts` — new server actions `pauseAllAlerts(untilIso, token?)` and `resumeAllAlerts(token?)`, reusing the existing `resolveOwnerEmail` trust boundary (session email or `unsubscribe_token`-resolved email) and the existing `paused_until` column / graceful missing-column fallback already used by `snoozeAlert`/`resumeAlert`.
- `src/components/VacationModeControl.tsx` (new) — client component: a date picker + "Pause all (N)" button, and a "Resume all (N)" button when any alert is currently paused. Works identically in the session-scoped and token-scoped (`?token=`) manage views (same `token` prop threading as `AlertActions`/`PriceDropToggle`).
- `src/app/alerts/manage/page.tsx` — render the control above the alert list, only when there are ≥2 alerts and at least one is confirmed or paused (with 0 or 1 alert, per-row pause/snooze already covers it — no bulk control needed).

## Acceptance criteria
- On `/alerts/manage` (signed-in) with ≥2 alerts where ≥1 is `confirmed`, a "Pause all" control with a date picker (defaulting to 2 weeks out) is visible; clicking it sets every `confirmed` alert for that email to `status='paused'` with the chosen `paused_until`, and the page updates to show each row's real "Paused until <date>" state.
- When ≥1 alert is `paused`, a "Resume all" button is visible; clicking it sets every `paused` alert for that email back to `status='confirmed'`, `paused_until=null`.
- Existing per-row pause/snooze/resume (`AlertActions`) is untouched and still works.
- Works in both the session-scoped and `?token=` manage views, scoped only to that owner's own alerts (never another subscriber's).
- With 0 or 1 alerts, no bulk control renders (avoids clutter for the common case).
- `paused_until` already exists in `supabase/schema.sql` (added for the earlier snooze feature) — no new migration; falls back to a plain status-only update if the live DB doesn't have the column yet, exactly like `snoozeAlert`.
- `npx tsc --noEmit` and `npx next build` pass; QA smoke clean on `/alerts/manage` at desktop 1280 + mobile 375, zero console errors, zero overflow.

## Out of scope
- Per-alert vacation dates (this is all-or-nothing, matching the existing single-alert pause/snooze model).
- Any new DB column/migration.
- The other plan-pass batch items (sample digest preview, comparison-page capture, market-pulse line, bounce webhook).
