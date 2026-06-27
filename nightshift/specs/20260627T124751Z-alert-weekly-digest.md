# Spec: alert-weekly-digest

**UTC timestamp:** 20260627T124751Z  
**Slug:** alert-weekly-digest  
**Pillar:** Frictionless signup / auth — Pillar 2 adjacent (closes the email-alert retention loop)

## Goal
Complete the email alert system by adding a weekly digest cron job. Confirmed subscribers who have new matching listings in their alert category get a "N new listings" email linking back to the page they signed up on. Gated behind `RESEND_API_KEY`; no-ops safely without it.

## Background
Slices 1-2 of the email alerts system are already shipped:
- Slice 1: capture UI + `alerts` table (anon insert, no account required)
- Slice 2: double-opt-in confirmation email on signup + `/api/alerts/confirm` + `/api/alerts/unsubscribe` routes

Slice 3 (this cycle): the weekly digest that closes the loop — without it, confirmed subscribers never receive a notification even when new matching aircraft/partnerships are listed.

## Scope (files to create/edit)

- **New** `src/app/api/cron/alert-digest/route.ts` — GET route called by Vercel cron daily; queries confirmed alerts, counts new matching listings, sends digest emails, updates `last_digest_at`
- **Edit** `src/lib/email.ts` — add `buildAlertDigestEmail` helper
- **New** `vercel.json` — Vercel cron config (daily at 08:00 UTC)

No DB schema changes. No client components. Non-visual cycle.

## Acceptance criteria

1. GET `/api/cron/alert-digest` returns HTTP 200 with `{processed, sent, skipped}` JSON
2. Only `status='confirmed'` alerts with `last_digest_at < now() - 7 days` (or null) are processed
3. For each alert, the route counts listings with `first_seen_at > last_digest_at` (or `created_at` when null) matching the alert's make/model/state/icao
4. When `count > 0` and `sendEmail` succeeds: `last_digest_at` is updated to now; `sent` counter incremented
5. When `count == 0`: alert is skipped; `last_digest_at` is NOT updated (re-check next day)
6. Route is protected: requires `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set; logs a warning (not error) when unset (dev/staging safety valve)
7. `vercel.json` schedules daily at 08:00 UTC

## Out of scope

- Per-listing details in the email body (just count + link back to page)
- Mission pages (`/aircraft/mission/*`) — source path skipped (complex preset filter)
- Parsing raw `/aircraft?make=...` query-string paths (alert UI doesn't produce these)
- Partnerships near-airport radius filtering (digest counts any new partnership with matching `home_airport`)
- Actual email delivery (requires human to set `RESEND_API_KEY` + verify sender domain in Resend)
