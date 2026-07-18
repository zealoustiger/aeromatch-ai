# Spec: "Demand with no supply" line in the Monday admin email

## Goal
Surface confirmed/live alert searches that currently have zero matching listings in the
Monday admin alert-funnel email, so the human sees a free inventory-acquisition shopping
list instead of that demand signal going unread.

## Scope
- `src/lib/alertFunnelWeekly.ts` — add `source_path` to the base query, group live
  (`active`/`confirmed`) alerts by exact `source_path`, take the top ~10 by subscriber
  count, live-verify each via the existing `getAlertMatchCount` (from `alertMatchCounts.ts`),
  and expose the ones with a real 0 current matches as a new `demandWithNoSupply` field on
  `AlertFunnelWeeklySnapshot`. Label each row via `describeLocalAlertContext` (falling back
  to the raw `source_path` for shapes it can't phrase).
- `src/lib/email.ts` — render a new "Demand with no supply" section in
  `buildAdminAlertFunnelEmail` (HTML + text), after "Top sources this week".
- `src/lib/email.test.ts` — extend `ADMIN_FUNNEL_BASE` fixture + add coverage for the new
  section and its honest empty states.
- `src/app/api/dev/email-preview/admin-alert-funnel/route.ts` — update the static preview
  fixture so it stays buildable and shows the new section.

## Acceptance criteria
- The Monday admin email renders a "Demand with no supply" list: each row shows a
  human-readable label for the search + "N subscribers waiting · 0 live matches".
- Never fabricates a count: an unparseable/uncheckable `source_path` is silently excluded,
  not guessed at; a path is only listed when `getAlertMatchCount` really returns 0.
- Two distinct honest empty states: "no confirmed alerts yet" (nothing to check) vs.
  "every top search has live matches" (checked, nothing to report) — never the same
  fabricated blank for both.
- Query volume is bounded (checks at most ~10 source_paths per run), no schema change, no
  new capture point.
- `npx tsc --noEmit` and `npx next build` pass clean; full `node --test` suite passes.
- QA: non-visual, internal-email-only cycle — production build smoke on `/` and
  `/admin/alerts` (2 pages, 2 viewports), plus curling the dev email-preview route to
  confirm the new section renders.

## Out of scope
- The other open `[P1][goal]` item (instant-alerts demand probe on the frequency picker) —
  separate slice.
- Surfacing the demand-gap list anywhere on-site or in `/admin/alerts` itself (this cycle
  is the admin-email surface only, matching the backlog item's scope).
- Any change to how `source_path` is captured or normalized.
