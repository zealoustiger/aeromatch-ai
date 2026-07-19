# email-engagement-recipient-attribution

## Goal
Attribute Resend `email.opened`/`email.clicked` webhook events to the recipient address so the
admin "Email engagement" panel can show a distinct-subscriber reach count per email template,
not just raw open/click counts (BACKLOG.md plan-pass batch #7, `[P1][goal]`).

## Scope
- `supabase/schema.sql` — additive `alter table email_engagement_events add column if not exists
  recipient text;` migration (⚠️ human-apply, same fail-soft convention as every other
  `alerts.*`/table column addition in this file).
- `src/lib/resendWebhook.ts` — `extractEngagementEvent` reads `data.to[0]` (same shape
  bounce/complained events already use) into a new lowercased `recipient: string | null` field.
- `src/app/api/webhooks/resend/route.ts` — pass `recipient` into the `email_engagement_events`
  insert; on a `recipient`-column-not-found error, retry the insert without it (mirrors the
  existing `contact_phone` retry-on-42703 precedent in `actions.ts`) so a real event is never
  dropped just because the column isn't migrated yet.
- `src/lib/emailEngagement.ts` — `getEmailEngagementRollup` selects `recipient` in addition to
  `event_type, email_type` and returns a `recipients: number` (count of distinct non-null
  recipients) per email type; retries the select without `recipient` on a column-not-found
  error, returning `recipients: 0` for that fallback path (never a fabricated count).
- `src/app/admin/alerts/page.tsx` — render the distinct-recipient count next to each row's
  opened/clicked numbers (e.g. "14 opened · 6 clicked · 9 people").
- Unit tests for the new `extractEngagementEvent` field and the rollup's distinct-count logic.

## Acceptance criteria
- `extractEngagementEvent` returns `recipient: 'buyer@example.com'` (lowercased) when
  `data.to` is a non-empty array of strings; `recipient: null` when `data.to` is missing/empty/
  not an array (defensive, matches existing bounce/complained handling).
- The webhook insert includes `recipient` when present; a `42703`/`PGRST204` error on that
  column triggers exactly one retry without it, so the event still logs (opened/clicked count
  unaffected) even pre-migration.
- `getEmailEngagementRollup` returns a `recipients` count per email type that is the number of
  *distinct* non-null `recipient` values for that type (not total events) — two opens by the
  same address count as 1, not 2.
- If the `recipient` column doesn't exist yet, the rollup still returns `opened`/`clicked`
  counts exactly as before (no regression), with `recipients: 0`.
- `/admin/alerts` renders the new count without changing existing opened/clicked numbers or
  layout meaningfully; no console errors; no horizontal overflow at 1280/375.
- `npx tsc --noEmit` and `npx next build` both pass; full test suite passes including new cases.

## Out of scope
- The `send_failures` per-run column / cron reliability work (separate open batch #7 item).
- The `alerts.digest_day` weekly-day-of-week item (separate open batch #7 item, also
  human-migration-gated).
- Any re-permission/auto-quiet email flow built on top of this data — this cycle is
  attribution + admin surfacing only, per the backlog item's own scoping note.
- `alertFunnelWeekly.ts` / the Monday admin email — this slice only touches the always-live
  `/admin/alerts` rollup, not the weekly digest email (kept small; that's a natural follow-up
  once real recipient data exists).
