# alert-digest-frequency

## Goal
Let a subscriber choose how often they get their alert digest — weekly (today's
behavior, default) or daily — instead of everyone being locked into a fixed 7-day
cadence, at both capture time and on `/alerts/manage`.

## Scope
- `supabase/schema.sql`: additive `alerts.frequency text not null default 'weekly'
  check (frequency in ('daily','weekly'))` column, human-action comment block
  matching the existing `price_drop_opt_in`/`airport_facility_ratings` convention.
- New `src/lib/alertFrequency.ts`: pure `intervalDaysFor(frequency)` +
  `isDigestDue(lastDigestAt, frequency, now)` helpers, unit-tested.
- `src/app/actions.ts`:
  - `subscribeToAlerts(...)` gains a 5th `frequency` param (default `'weekly'`),
    inserted with the same missing-column retry-fallback pattern as
    `price_drop_opt_in`.
  - New `updateAlertFrequency(id, frequency)` owner-scoped action, mirrors
    `updateAlertPriceDropOptIn` exactly (same `loadOwnedAlert` check, same
    missing-column no-op fallback).
- `src/components/AlertSignup.tsx`: a subtle "How often?" select (Weekly digest /
  Daily digest, default Weekly) below the email field, for every `noun` (not
  gated like the price-drop checkbox — digest cadence applies to all 3 listing
  types). Wired into `subscribeToAlerts` + the `alert_subscribed` track event
  payload.
- New `src/components/FrequencyToggle.tsx`: mirrors `PriceDropToggle`'s
  button-toggle pattern, renders on every alert row on `/alerts/manage`
  (unlike price-drop, not type-gated).
- `src/app/alerts/manage/page.tsx`: select `frequency` (with fallback-without-
  column retry), render `FrequencyToggle`.
- `src/app/api/cron/alert-digest/route.ts`: fetch `frequency` (with fallback),
  replace the single fixed 7-day window with a per-alert due-check via
  `isDigestDue` — daily alerts fire after 1 day since `last_digest_at`, weekly
  after 7 (unchanged default behavior for everyone who doesn't touch the new
  control).

## Honesty scoping note
The backlog item's original wording ("instant | daily | weekly") assumed an
instant option; the live send path is a single daily cron
(`vercel.json`: `0 8 * * *`) gated per-alert by `last_digest_at`, with no
event-driven/real-time trigger. Offering "instant" today would be a fabricated
capability — mirrors the honesty gate that scoped down `aircraft-price-drop-alerts`
earlier this drain. Scoped to **daily | weekly** only; "instant" is a real next
slice but needs an actual event-driven send path, not just a column.

## Acceptance criteria
- `alerts.frequency` column added additively (`add column if not exists`), default
  `'weekly'` — zero behavior change for every existing subscriber until they
  explicitly pick "Daily."
- `AlertSignup` shows a Weekly/Daily selector under the email field on all
  surfaces (aircraft, partnership, seeker); submitting writes `frequency` and
  fires `alert_subscribed` with it in the payload.
- `/alerts/manage` shows a Weekly/Daily toggle per alert row that persists via
  `updateAlertFrequency`.
- `alert-digest` cron sends daily-frequency alerts at most once per ~1 day and
  weekly-frequency alerts at most once per ~7 days (unit-tested `isDigestDue`).
- Every new/changed DB read or write path degrades gracefully (no error) against
  the current live DB, which does not yet have this column applied.
- `npx next build` + typecheck clean; QA smoke passes on `/aircraft`, `/alerts`,
  `/alerts/manage` at desktop 1280 + mobile 375.

## Out of scope
- An actual "instant" per-listing send trigger (needs event-driven infra).
- Backfilling/migrating existing subscribers' preference (default weekly is a
  no-op for them, which is correct — nobody's cadence changes unless they touch it).
- Digest-email copy changes beyond what's needed to keep sends honest.
