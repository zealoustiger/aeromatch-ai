# admin-email-engagement-wow

## Goal
Surface week-over-week email open/click engagement (already being ingested from Resend
webhooks into `email_engagement_events`) in the Monday admin alert-funnel email, so the
human can see whether the digests/alerts themselves get opened — the missing "send → open"
middle of the funnel that GOAL.md's "prove it converts" pillar calls for.

## Scope
- `src/lib/emailEngagement.ts` — add a new week-windowed rollup function
  (`getEmailEngagementWeeklyRollup`) alongside the existing all-time `getEmailEngagementRollup`
  (used by `/admin/alerts`, left untouched). Same fail-soft convention: table not migrated /
  query error → an honest empty result, never a fabricated 0.
- `src/lib/alertFunnelWeekly.ts` — call the new rollup (parallel with the existing
  `getDigestVoteRollup` call) and add `emailOpened*`/`emailClicked*` fields to
  `AlertFunnelWeeklySnapshot`.
- `src/lib/email.ts` — `buildAdminAlertFunnelEmail`: add an "Email engagement (opened/clicked)"
  row directly below the existing "Digest feedback" row, same shape (WoW deltas + an honest
  "No engagement events yet" empty state when nothing has ever been recorded).
- `src/lib/email.test.ts` — extend the `ADMIN_FUNNEL_BASE` fixture + add coverage mirroring
  the existing digest-feedback tests (has-data WoW render, honest zero-state).

## Acceptance criteria
- New `getEmailEngagementWeeklyRollup(now)` in `emailEngagement.ts` returns
  opened/clicked counts for this week, last week, and all-time-within-query-window totals;
  returns an honest all-zero result (never fabricated) on any DB error or un-migrated table,
  matching `getEmailEngagementRollup`'s existing fail-soft pattern.
- `getAlertFunnelWeeklySnapshot` includes the new fields, computed via the new rollup — no
  duplicated query logic.
- `buildAdminAlertFunnelEmail` renders an "Email engagement (opened/clicked)" row (HTML + text)
  with real WoW deltas when any engagement has ever been recorded, and an honest "No
  engagement events yet" line when none has — never a fabricated 0/0.
- No schema change (table already exists per `supabase/schema.sql`; still human-gated to apply
  live, unrelated to this cycle).
- `npx tsc --noEmit` and `npx next build` both pass.
- `node --test` passes, including new tests for the email-engagement row.
- QA: non-visual (internal admin-email-only) cycle — smoke-test `/` and `/admin/alerts` on the
  production build, confirm 200 + no console errors; curl the admin-alert-funnel email preview
  route to confirm the new row renders.

## Out of scope
- Per-`email_type` breakdown in the admin email (the rollup keeps that shape internally
  available as a natural follow-up; the email itself renders one aggregate row, matching the
  existing digest-feedback row's scope).
- Any change to `/admin/alerts`' existing all-time `getEmailEngagementRollup` panel.
- Applying the `email_engagement_events` migration live or toggling Resend's webhook checkboxes
  (both already flagged as human actions in `schema.sql`).
