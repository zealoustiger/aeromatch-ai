# Monday admin alert-funnel week-over-week summary email

## Goal
Give the admin a weekly, DB-derived summary of the alert funnel (signups, confirms, and
current pause/unsubscribe totals) delivered to their inbox every Monday, so "judge alerts
week-over-week" (GOAL.md) doesn't require a manual `/admin/alerts` visit.

## Scope
- `src/lib/alertFunnelWeekly.ts` (new) — pure-ish data function `getAlertFunnelWeeklySnapshot()`
  that reads the `alerts` table (admin client) and computes:
  - `createdThisWeek` / `createdLastWeek` (by `created_at`, rolling 7-day windows — same
    windows `alertScoreboard.ts` already uses)
  - `confirmedThisWeek` / `confirmedLastWeek` (by `confirmed_at`)
  - `liveTotal` / `pendingTotal` / `pausedTotal` / `unsubscribedTotal` / `bouncedTotal` —
    **current snapshot totals**, not WoW deltas (the `alerts` table has no
    `unsubscribed_at`/`paused_at` timestamp, so an honest WoW delta for those statuses isn't
    derivable — labeled "current total" in the email, never presented as "this week").
  - `topSourcesThisWeek` — top 5 `source` values by `createdThisWeek` count with their
    `createdLastWeek` count alongside, same graceful degrade as `alertScoreboard.ts` when the
    `source` column isn't migrated live yet (falls back to a single "(untagged)" bucket).
- `src/lib/email.ts` — new pure `buildAdminAlertFunnelEmail(snapshot)` builder (subject + html
  + text), styled consistently with the existing digest/widen templates.
- `src/app/api/cron/alert-digest/route.ts` — after the existing digest-send loop, if
  `new Date(nowIso).getUTCDay() === 1` (Monday, UTC) AND `process.env.ADMIN_EMAILS` is set,
  build the snapshot once and `sendEmail` it to each address in `ADMIN_EMAILS` (comma-split,
  same parsing as `admin-auth.ts`). No new cron entry (piggybacks the existing daily
  `alert-digest` cron, dodging the Hobby-tier daily-only cron limit already flagged in the
  backlog). Logged, never fatal to the rest of the run — wrapped so an email-summary failure
  can't affect the digest sends that already completed.
- `src/app/api/dev/email-preview/admin-alert-funnel/route.ts` (new) — static-fixture dev
  preview route, same pattern as the existing `email-preview/*` routes, for QA/visual review
  without touching the DB or Monday-gating.

## Acceptance criteria
- On a cron run where `new Date().getUTCDay() === 1` and `ADMIN_EMAILS` is non-empty, one
  email is sent per admin address with real created/confirmed WoW counts and current
  paused/unsubscribed/bounced/live totals pulled from the `alerts` table.
- On any other day of the week, or when `ADMIN_EMAILS` is unset, no summary email is sent —
  the existing digest-send behavior is completely unchanged (verified by code path: the
  Monday check is a pure guard around new code, not a change to any existing branch).
- The email never fabricates a "this week" number for unsubscribed/paused — those render
  as an explicitly-labeled current total.
- `getAlertFunnelWeeklySnapshot()` degrades gracefully (falls back to an "(untagged)" source
  bucket) if the `source` column isn't live yet, mirroring `alertScoreboard.ts`'s existing
  precedent — never throws, never breaks the digest run.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- `/api/dev/email-preview/admin-alert-funnel` renders the built HTML with fixture data,
  confirmed via a fetch against the running production build (visual QA).

## Out of scope
- No new `unsubscribed_at`/`paused_at` schema columns this cycle (would let a future cycle
  make those WoW too — noted as a "Next" follow-up).
- No `/admin/alerts` UI change — the page's existing `getAlertScoreboard()` read is untouched;
  this cycle only adds the email delivery of a similar (but distinctly-computed, WoW-focused)
  snapshot.
- No change to `vercel.json` (no new cron entry).
