# alert-monthly-cadence

## Goal
Add a `monthly` digest cadence as a real, honest "fewer" rung under `weekly` so the
unsubscribe-recovery ladder (and general cadence controls) can offer a genuine low-touch
option to long-horizon shoppers instead of bottoming out at weekly → snooze → pause.

## Scope
- `src/lib/alertFrequency.ts` — widen `AlertFrequency` to `'daily' | 'weekly' | 'monthly'`;
  `INTERVAL_DAYS.monthly = 28`; `normalizeFrequency` recognizes `'monthly'`.
- `src/components/AlertSignup.tsx` — add a "Monthly digest" option to the existing "How
  often?" select.
- `src/components/FrequencyToggle.tsx` — cycle daily → weekly → monthly → daily (was a
  binary daily/weekly toggle); digest-day picker stays weekly-only (unchanged).
- `src/components/UnsubscribeRecover.tsx` + `src/app/actions.ts`
  (`updateAlertFrequencyByToken`) + `src/app/alerts/status/page.tsx` — add a "Switch to
  monthly instead" recovery option alongside the existing "Switch to weekly instead",
  gated on at least one covered alert not already being monthly.
- `src/components/NarrowAlertNudge.tsx` + `src/app/alerts/manage/page.tsx` — when a
  high-volume alert's narrow-nudge is showing, also offer "or switch to monthly" as an
  alternative to narrowing criteria.
- `supabase/schema.sql` — additive, human-apply-flagged migration widening the
  `alerts_frequency_check` CHECK constraint to include `'monthly'`. Every write path
  already retries dropping the `frequency` key when the error message names it (matches
  both a missing-column AND a CHECK-constraint-violation error), so this is fail-soft
  identically to every prior `alerts.*` migration until the human applies it.

## Acceptance criteria
- `AlertFrequency` type includes `'monthly'`; `normalizeFrequency('monthly') === 'monthly'`;
  unknown/garbage values still normalize to `'weekly'`.
- `isDigestDue` treats a `monthly` alert as due only after ~28 elapsed days (existing unit
  test file extended, not broken).
- `AlertSignup`'s "How often?" select offers Weekly / Daily / Monthly.
- `FrequencyToggle` cycles through all three cadences and shows a distinct label/state for
  monthly.
- The unsubscribe-recovery box on `/alerts/status` offers "Switch to monthly instead" when
  at least one covered alert isn't already monthly, and the resulting DB row is
  `status='confirmed', frequency='monthly'` (verified live against a throwaway
  `@example.com` alert, deleted after).
- `NarrowAlertNudge` (rendered only for high-volume alerts on `/alerts/manage`) offers a
  "switch to monthly" alternative alongside its existing narrow-criteria suggestions.
- `npx next build` + `tsc --noEmit` pass; QA smoke passes on `/alerts/status` and
  `/alerts/manage` at desktop 1280 + mobile 375, no new console errors, no overflow.

## Out of scope
- Any change to the live digest cron's schedule/infra (still the single daily cron; a
  `monthly` alert is simply skipped by `isDigestDue` until ~28 days have elapsed).
- Applying the CHECK-constraint migration against the live Supabase project (flagged
  ⚠️ human-apply, per every prior `alerts.*` DDL in this file).
- Any change to the daily→weekly "busy digest" upgrade nudge (`shouldOfferDailyUpgrade`)
  or the `digest_day` weekly-only preference picker.
