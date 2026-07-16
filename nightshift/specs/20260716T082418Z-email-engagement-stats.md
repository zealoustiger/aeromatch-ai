# Email engagement stats — open/click webhook → /admin/alerts

## Goal
Tag every outgoing alert-system email with its type, extend the existing Resend
webhook to log `email.opened`/`email.clicked` events, and roll up open/click
counts per email type on `/admin/alerts` — so we can finally see which alert
emails actually get read (GOAL.md's "prove it converts," the email half).

## Scope
- `src/lib/email.ts` — add `emailType?: string` to `SendEmailInput`; when
  present, pass `tags: [{ name: 'type', value: emailType }]` in the Resend
  send request (Resend echoes tags back on webhook events for that email).
- All current `sendEmail()` call sites (`src/app/actions.ts`,
  `src/app/api/cron/alert-digest/route.ts`, `src/app/api/cron/match-alert-digest/route.ts`,
  `src/app/api/alerts/confirm/route.ts`) — add the matching `emailType` string
  (one per builder: `alert-confirm`, `alert-digest`, `combined-digest`,
  `price-drop`, `widen-suggestion`, `listing-unavailable`, `manage-link`,
  `email-change-confirm`, `new-message`, `seed-inquiry`, `match-alert`).
- `supabase/schema.sql` — additive `email_engagement_events` table
  (`create table if not exists`): `id uuid default gen_random_uuid() primary key`,
  `created_at timestamptz default now()`, `event_type text not null` (`opened`/`clicked`),
  `email_type text` (nullable — untagged/legacy sends), `resend_email_id text`,
  `link_url text` (clicked events only). Index on `created_at desc`.
- `src/lib/resendWebhook.ts` — new `extractEngagementEvent(body)` returning
  `{ eventType, emailType, resendEmailId, link } | null` for `email.opened`/
  `email.clicked`, reading `data.tags` for the `type` tag. Unit-tested like the
  existing bounce/complaint extractors.
- `src/app/api/webhooks/resend/route.ts` — call the new extractor; on a match,
  fail-soft insert one row into `email_engagement_events` (same
  message-substring-ignore pattern as `alert_cron_runs`'s insert in
  `alert-digest/route.ts`). Existing bounce/complaint handling unchanged.
- `src/lib/emailEngagement.ts` (new) — `getEmailEngagementRollup()`: fetch
  recent rows (capped, e.g. 2000), aggregate opened/clicked counts per
  `email_type` in JS (mirrors `getDigestVoteRollup`'s fetch-then-reduce
  pattern), fail-soft (`[]` on any error / un-migrated table).
- `src/app/admin/alerts/page.tsx` — new "Email engagement" section (same
  `rounded-xl border ... shadow-sm` card shape as the existing panels),
  listing open/click counts per email type with an honest "No engagement
  events received yet" fallback when the rollup is empty — note this needs
  both the DB migration AND a human ticking the `email.opened`/`email.clicked`
  boxes in the Resend dashboard webhook config.

## Acceptance criteria
- `sendEmail()` includes a `tags` field in the Resend request body only when
  `emailType` is passed; omitting it changes nothing (back-compat).
- Every existing `sendEmail()` call site passes an `emailType` matching its
  builder.
- `extractEngagementEvent` correctly parses `email.opened`/`email.clicked`
  events (including tag lookup) and returns `null` for unrelated event types
  or malformed payloads; unit tests cover both events + defensive cases.
- The webhook route inserts one `email_engagement_events` row per
  opened/clicked event; a missing table never 500s the route (matches
  existing bounce/complaint error posture — always 200s once signature is
  verified).
- `/admin/alerts` renders a new engagement panel; shows real aggregated
  counts when rows exist, an honest empty state otherwise. No fabricated
  numbers.
- `npx next build` + `tsc --noEmit` pass; existing + new unit tests pass.
- QA smoke passes on `/admin/alerts` (desktop 1280 + mobile 375); visual
  cycle — screenshots reviewed.

## Out of scope
- Backfilling `email_type` tags onto emails already in flight/sent before
  this ships.
- A "resend this email" or drill-down-by-recipient view.
- Applying the schema migration against live Supabase (flagged as a human
  action, same as every other pending `alerts.*`/log-table migration).
- Registering the new event types in the Resend dashboard (human action).
