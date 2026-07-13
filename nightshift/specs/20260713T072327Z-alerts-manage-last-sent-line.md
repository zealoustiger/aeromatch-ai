# alerts-manage-last-sent-line

## Goal
Show a "Last email sent / next check" expectation line on each alert row in
`/alerts/manage` so a subscriber can trust the alert is alive without having to
guess or send themselves a sample digest.

## Scope
- `src/lib/alertFrequency.ts` — add a small pure helper, e.g.
  `describeLastDigest(lastDigestAt: string | null, frequency: AlertFrequency): string`
  returning `"Last email Jul 10 · checks daily"` (has sent) or
  `"Nothing sent yet — checks weekly"` (never sent). Pure, deterministic (no
  `Date.now()` inside — date formatting only, no relative-to-now math needed for
  the format itself beyond what's already passed in).
- `src/lib/alertFrequency.test.ts` — unit tests for the new helper (sent vs never
  sent, daily vs weekly).
- `src/app/alerts/manage/page.tsx` — select `last_digest_at` (already a live,
  non-gated base column per `supabase/schema.sql`'s `alerts_double_opt_in`
  migration, so it goes in `baseCols`, not `OPTIONAL_COLS`) and render the new
  line per row, using `normalizeFrequency(a.frequency)` (already imported) so it
  degrades the same way `FrequencyToggle` already does when `frequency` isn't
  live yet.

## Acceptance criteria
- Every alert row on `/alerts/manage` shows a line reading either
  `Last email {short date} · checks {daily|weekly}` (when `last_digest_at` is
  set) or `Nothing sent yet — checks {daily|weekly}` (when it's null).
- No schema change (the column already exists live); no new capture point.
- `next build` + typecheck pass; `qa-smoke.mjs` passes on `/alerts/manage` at
  desktop 1280 + mobile 375 (HTTP 200, zero app-console errors, zero horizontal
  overflow) — new line must not overflow/wrap awkwardly at 375px.
- Unit tests for the new helper pass (`node --experimental-strip-types --test
  src/lib/alertFrequency.test.ts`).
- No live cron/email trigger; no DB writes during QA beyond the usual throwaway
  `@example.com` test alert (created + deleted) needed to exercise a populated
  row.

## Out of scope
- The other two open `[P2][goal]` items in the same BACKLOG section (stranded-
  pending confirm reminder, "widen this alert" zero-match nudge) — separate
  cycles.
- Any change to the digest cron itself or to when/whether it sends.
