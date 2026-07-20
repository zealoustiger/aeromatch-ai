# Cadence-mix tile on /admin/alerts

## Goal
Give the admin `/admin/alerts` scoreboard a tile showing the live-alert cadence
split (daily / weekly / monthly) plus the paused/snoozed count, so frequency-ladder
adoption (the fewer-emails ladder, snooze/vacation mode) is visible mid-week instead
of unmeasurable.

## Scope
- `src/lib/alertScoreboard.ts` — new `getCadenceMixRollup()` export + `CadenceMixRollup`
  interface. Reads `alerts.status` (always present, base schema) and `alerts.frequency`
  (optional — may be unmigrated live), using the same `OPTIONAL_COLS` retry-and-drop
  pattern as `getRepermissionRollup`/`getUnsubscribeReasonRollup` in the same file.
  Buckets live (`LIVE_STATUSES`) rows by `normalizeFrequency` (from `alertFrequency.ts`,
  the exact function the real digest cron uses) into daily/weekly/monthly counts, and
  counts `status === 'paused'` rows separately.
- `src/app/admin/alerts/page.tsx` — one new `<section>` tile (same shell/pattern as the
  neighboring "Instant-alerts interest" tile), added to the existing `Promise.all` call
  and import block.

## Acceptance criteria
- New tile renders on `/admin/alerts` showing: live-alert count broken into
  daily/weekly/monthly (bar or stat layout matching existing tiles), plus a separate
  paused/snoozed count.
- Honest three-state handling: if `alerts.frequency` isn't migrated live, the tile still
  renders (using the real cron's own fallback-to-weekly semantics — `normalizeFrequency`
  already treats an unmigrated/missing value as `weekly`, matching what the digest cron
  actually does) but shows a caveat note that the split reflects default behavior, not a
  per-alert-configured cadence, until the column is migrated. If there are 0 live alerts,
  show an honest "not enough data" message, never a fabricated number.
- No schema change (`frequency`/`status` already exist or degrade gracefully if
  `frequency` is unmigrated).
- `npx tsc --noEmit` and `npx next build` both exit 0.
- QA smoke passes on `/admin/alerts` at desktop 1280 + mobile 375 (HTTP 200 — after
  admin auth — zero console errors, zero horizontal overflow). Non-visual-adjacent but
  a real rendered tile, so screenshots are read this cycle to confirm no overlap/broken
  layout.

## Out of scope
- Any change to the cadence picker itself (`FrequencyToggle`) or the digest cron.
- The still-blocked "real instant alerts" send path (separate, human-call-gated item).
- Any new DB column/migration.
