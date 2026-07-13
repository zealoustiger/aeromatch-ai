# alert-confirm-reminder

## Goal
Send exactly ONE "still want these alerts?" reminder email to double-opt-in subscribers
who signed up but never clicked the original confirm link, so a stranded-pending alert
isn't silently lost forever.

## Scope
- `supabase/schema.sql` — additive `alerts.confirm_reminder_sent_at timestamptz` column
  (⚠️ human must apply live, same pending-DDL pattern as `paused_until`/`frequency`/etc).
- `src/app/api/cron/alert-digest/route.ts` — new block in the cron `GET` handler: fetch
  `status='pending'` rows aged 24–72h since `created_at` with `confirm_reminder_sent_at`
  still null, send the existing `buildAlertConfirmEmail` (reusing the row's own
  `confirm_token`/`unsubscribe_token` + a live match preview via
  `getAlertDigestPreview`), then stamp `confirm_reminder_sent_at`. If the column isn't
  migrated live yet (`42703`/missing-column style error), skip sending entirely this
  pass — never risk a duplicate reminder once the column does land.
- No new UI, no new capture point, no change to the existing confirmed-alert digest loop.

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` both exit 0.
- A `status='pending'` alert with `created_at` 48h ago and `confirm_reminder_sent_at`
  null gets exactly one reminder email built via `buildAlertConfirmEmail` (same template
  as the original confirm + resend), and `confirm_reminder_sent_at` gets stamped after a
  successful send.
- A `status='pending'` alert younger than 24h or older than 72h is NOT reminded this pass.
- A `status='pending'` alert that already has `confirm_reminder_sent_at` set is NOT
  reminded again (no duplicate).
- A `status='confirmed'` row is never touched by this new block.
- If `confirm_reminder_sent_at` isn't live yet on the DB, the cron logs a warning and
  skips the reminder pass entirely (no crash, no fallback re-send without the guard).
- QA: `qa-smoke.mjs` passes on `/alerts` and `/aircraft` (pages that create pending
  alerts) — this is a cron-only, non-visual change; no page renders differently.

## Out of scope
- Any UI change to the confirm/resend flow.
- Changing the existing 10-minute `last_confirm_sent_at` resend-button cooldown.
- Reminding more than once, or reminding alerts outside the 24–72h window.
