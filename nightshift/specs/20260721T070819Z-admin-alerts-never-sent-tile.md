# admin-alerts-never-sent-tile

## Goal
Add a "No content sent yet" share tile to `/admin/alerts` so the human can see, at a
glance, what fraction of live (age-eligible) alert subscribers have never once received
a digest with real content — the leading indicator of "do our alerts feel dead?"

## Scope
- `src/lib/alertScoreboard.ts` — new `getNeverSentRollup()` rollup, following the exact
  optional-column graceful-fallback convention already used by
  `getCadenceMixRollup`/`getRepermissionRollup`/`getUnsubscribeReasonRollup` in this file.
- `src/app/admin/alerts/page.tsx` — one new read-only section/tile rendering the rollup.
- No schema change (reads existing `alerts.last_digest_at`, base schema; and the
  already-pending-migration `alerts.digest_sends_count` as a redundant confirmation via
  the standard retry-and-drop pattern).
- No new capture point, no action/mutation, no auth change (page stays behind the
  existing `src/app/admin/layout.tsx` gate — untouched, frozen).

## Acceptance criteria
- New tile on `/admin/alerts` reads "N of M live alerts (X%) have never gotten a
  listing", where M = live (`status` in `active`/`confirmed`) alerts old enough
  (confirmed_at, falling back to created_at, older than 7 days) to have had a real
  chance, and N = the subset of those whose `last_digest_at` is still null (and, when
  `digest_sends_count` is migrated live, whose count is also 0/null as a redundant
  check).
- Renders an honest "not enough data" state when M is 0 — never divides by zero, never
  fabricates a percentage.
- Works whether or not `alerts.digest_sends_count` is migrated live (graceful
  degrade — no crash, no misleading number either way, since `last_digest_at` alone is
  the load-bearing, always-present signal).
- `npx tsc --noEmit` and `npx next build` stay green.
- `/admin/alerts` still renders cleanly (HTTP 200, zero new console errors, zero
  horizontal overflow) at desktop 1280 + mobile 375, behind the existing admin gate.

## Out of scope
- Any change to admin auth/gating (frozen).
- Any new alert-capture UI or schema migration.
- Wiring this metric into the Monday admin funnel email (`alertFunnelWeekly.ts`) — a
  natural follow-up, not this slice.
