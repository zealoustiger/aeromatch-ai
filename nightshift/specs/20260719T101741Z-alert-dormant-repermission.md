# alert-dormant-repermission

## Goal
Ship the last open plan-pass batch #9 `[P2][goal]` item: a one-time, honestly-gated
"still want these alerts?" re-permission email for confirmed alerts that are old enough,
have received enough real digest sends, and whose recipient has never opened/clicked a
single ClubHanger email — protecting sender reputation without ever mislabeling a
never-tracked address as "disengaged."

## Scope
- `supabase/schema.sql` — two additive columns (⚠️ human-apply, same fail-soft convention
  as every other `alerts.*` column): `alerts.digest_sends_count` (int, not null default 0)
  and `alerts.repermission_sent_at` (timestamptz, nullable).
- `src/app/api/cron/alert-digest/route.ts`:
  - `DigestAlertRow` gains optional `digest_sends_count`; added to `DIGEST_OPTIONAL_COLS`
    fetch/retry list (same drop-on-missing-column precedent as every sibling column).
  - New `markDigestSent(supabase, rows, nowIso)` helper replaces the two existing
    `last_digest_at`-only update call sites (single-alert path + combined-group path) —
    stamps `last_digest_at` AND increments each row's own `digest_sends_count` in one
    update per row (can't bulk-increment per-row via one query), with the same
    retry-drop-column fallback so an un-migrated `digest_sends_count` never breaks the
    pre-existing `last_digest_at` stamp.
  - New `sendDormantSubscriberRepermissionEmails(supabase, nowIso)` (mirrors
    `sendWidenSuggestionEmails`'s shape) calls `getDormantSubscribers`, sends
    `buildRepermissionEmail` to each, stamps `repermission_sent_at` on success. Wired into
    the `GET` handler after the main send loop, counted in the log line + JSON response
    (`repermissionsSent`) — not added to the `alert_cron_runs` health-log row this cycle
    (kept small; a natural follow-up once the column earns its keep).
- `src/lib/dormantSubscribers.ts` (new) — `getDormantSubscribers(nowIso, cap=25)`:
  queries confirmed/active alerts with `digest_sends_count >= 8`, `repermission_sent_at
  is null`, `confirmed_at <= now-90d`; a pure `isDormancyAgeAndSendEligible` helper
  (unit-testable, no DB) re-checks age/send-count/never-sent on each row. Honesty gate:
  if `email_engagement_events` has ZERO rows for ANYONE, tracking isn't live yet
  (webhook unregistered) — skip the whole run rather than call every subscriber
  "dormant" with no real signal. Once live for at least one address, a candidate's own
  zero rows (checked via `recipient`) is a genuine signal. Fails soft to `[]` on any
  un-migrated column/table.
- `src/lib/email.ts` — new `buildRepermissionEmail({context, manageUrl, unsubscribeUrl})`:
  "Still want alerts for {context}?" with one prominent "Yes, keep sending →" link to
  `manageUrl` (the existing `/alerts/manage` page already offers the cadence ladder,
  snooze, and unsubscribe — no new no-op endpoint needed) plus a plain unsubscribe
  footer link, same template shape as `buildWidenSuggestionEmail`.
- Unit tests: `isDormancyAgeAndSendEligible` (age/send-count/already-sent branches) and
  `buildRepermissionEmail` (subject/links/HTML-escaping), mirroring existing test style.

## Acceptance criteria
- `digest_sends_count` increments by exactly 1 on every real digest send (single-alert
  and combined-group paths alike); un-migrated column never blocks the pre-existing
  `last_digest_at` stamp (verified via the retry-drop fallback).
- `getDormantSubscribers` returns `[]` whenever `email_engagement_events` has zero rows
  total (tracking not live) — never flags anyone dormant with no real signal.
- A candidate alert is only returned when: `status` is confirmed/active, `confirmed_at`
  ≤ 90 days ago, `digest_sends_count` ≥ 8, `repermission_sent_at` is null, AND the
  recipient has zero rows in `email_engagement_events` while at least one OTHER address
  has real rows.
- `repermission_sent_at` is stamped on send success so the same alert is never emailed
  twice.
- `npx tsc --noEmit` and `npx next build` pass; full test suite passes including new
  cases.
- QA: production build serves `/alerts`, `/aircraft` clean (this cycle touches no page
  markup — non-visual, email/cron/lib only); no console errors; no overflow.

## Out of scope
- Wiring `digest_sends_count`/`repermissionsSent` into the `alert_cron_runs` health-log
  table or `/admin/alerts` panel — separate follow-up.
- Actually invoking the live cron in QA (would mass-email real subscribers) — verify the
  eligibility query + email builder directly instead.
- A dedicated no-op "keep" endpoint — reusing the existing `/alerts/manage` link covers
  keep/ladder/snooze/unsubscribe without new routes.
