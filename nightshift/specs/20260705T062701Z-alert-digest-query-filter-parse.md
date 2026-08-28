# alert-digest-query-filter-parse

## Goal
Fix a silent correctness bug in the scheduled alert-digest cron: query-parameterized
alert `source_path` values (e.g. `/aircraft?make=Cessna&model=172`) lose their
make/model/state/price/year filters entirely, so the subscriber gets counted/emailed
against ALL new aircraft instead of the specific search they signed up for.

## Context
Two very recent, unlogged commits (`aa65f7a`, `10d18c7` — a Slack-analytics UTM change
and a nav CTA swap to "Get alerts" + new `/alerts` landing page) landed on staging
outside the normal nightshift spec/CHANGELOG process. Verified via production build +
`qa-smoke` that both render cleanly with no console errors/overflow (screenshots in
`nightshift/screenshots/alerts-nav-audit/`) — no regression there. While auditing the
new `/alerts` page (now the primary site-wide nav CTA) end-to-end, found that its
interest chips and the existing `/aircraft` browse page's inline `AlertSignup` both
produce `source_path` values shaped like `/aircraft?make=Cessna&model=172` — but the
ONLY actually-scheduled digest sender (`src/app/api/cron/alert-digest/route.ts`, wired
via `vercel.json`'s daily cron) parses `source_path` with
`raw.split('?')[0]` at the very top of `parseSourcePath`, discarding the entire query
string before any matching. `/aircraft?make=Cessna&model=172` becomes bare `/aircraft`,
which matches the "all aircraft, no filters" branch. Every model-specific `/alerts`
chip (Cessna 172, Cirrus SR22, Piper Cherokee, Beechcraft Bonanza) and every filtered
`/aircraft` search alert is silently downgraded to "any new aircraft" — the subscriber
never gets what the UI promised. This is a trust/data-integrity bug on the app's newest
and now-primary conversion path, not a cosmetic gap.

(Note: a separate, apparently-unscheduled script `scraper/send-alerts.mjs` already has
its own correct query-param parser for this shape — but it is not the system wired to
`vercel.json`'s cron, so it doesn't help in production/staging.)

> **[CORRECTION 2026-08-27]** `scraper/send-alerts.mjs` was NOT unscheduled/dead code — `nightshift/bin/run-scrape.sh` ran it nightly on the VPS (systemd `nightshift-scrape.timer`), making it a second live sender racing `/api/cron/alert-digest` over the same `alerts` rows and the same `last_digest_at` cursor. Resolved by `scraper-send-alerts-retire` (2026-08-27): its send step is removed, the file is now `scraper/sync-saved-searches.mjs` (saved-search → alert sync only), and the Vercel cron is the sole owner of alert email. The scope decision below still stands; only its stated premise was wrong.
> It was also not "correct" for SEO paths: `path.startsWith('/aircraft')` matched
> `/aircraft/cessna/172` and then applied zero filters, i.e. an unfiltered firehose.

## Scope
- `src/app/api/cron/alert-digest/route.ts` only:
  - Extend `AlertTarget` with optional `model`, `minPrice`, `maxPrice`, `minYear`,
    `maxYear`, `maxTt` fields.
  - In `parseSourcePath`, before falling through to the path-segment SEO matchers,
    detect a bare `/aircraft` or `/partnerships` path WITH a query string and parse
    the known filter keys (`make`, `model`, `state`, `min_price`, `max_price`,
    `min_year`, `max_year`, `max_tt` for aircraft; `make`, `state`, `airport` for
    partnerships) — mirroring the exact param names `src/app/aircraft/page.tsx`'s
    `alertSourcePath` and `AlertsLanding.tsx`'s chips already produce.
  - `countNewAircraft`: apply the new fields with the same semantics as the live
    browse query (`AircraftSaleList.tsx`): `model` → `.eq`, `min_price`/`max_price` →
    `.gte`/`.lte` on `asking_price`, `min_year`/`max_year` → `.gte`/`.lte` on `year`,
    `max_tt` → `.lte` on `ttaf`.
- No schema change. No change to `AlertSignup`/`AlertsLanding` (their output is
  already correct — the bug is purely in how the cron consumes it).
- Out of scope: touching `scraper/send-alerts.mjs` (unclear if/where it's actually
  scheduled — not the live path); the `/api/alerts/confirm`/`unsubscribe` routes;
  any UI/nav change (already shipped and verified clean this cycle).

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` pass clean.
- A direct unit-style check (temporary script, not committed) confirms
  `parseSourcePath('/aircraft?make=Cessna&model=172')` now returns
  `{ type: 'aircraft', make: 'Cessna', model: '172' }`-equivalent (not the bare
  all-aircraft target), and a bare `/aircraft` / `/aircraft/cessna/172` (existing
  SEO-page shape) still parse exactly as before (no regression).
- `qa-smoke` passes on `/`, `/alerts`, `/aircraft` (this route has no UI, but the
  build must stay green and the pages it's linked from must keep working).
- Manually invoking the route locally (`curl /api/cron/alert-digest`) returns 200
  with no new errors vs. before the change.

## Out of scope
- Rewriting or scheduling `scraper/send-alerts.mjs`.
- Any new alert-target dimensions (e.g. seeker-listing alerts) — this cycle is a
  bug fix, not a feature addition.
- Any further nav/`/alerts` landing UI changes.
