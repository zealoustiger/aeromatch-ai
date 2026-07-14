# Market-pulse line in the aircraft digest email

## Goal
Add one honest market-context sentence ("14 Cessna 172s listed right now, median
asking $89k") to the weekly/daily aircraft alert digest email, so a subscriber's
email is visibly smarter than a bare listing count — reusing the exact honesty
floor (`MIN_SNAPSHOT_LISTINGS`) and `priceStats` aggregator already shipped for
the make/model page's "Market snapshot" block.

## Scope
- `src/lib/aircraftComps.ts` — no change (reuse existing exported `priceStats`).
- `src/lib/alertMatchCounts.ts` — new exported `getMarketPulseLine(supabase, make,
  modelLabel, modelPattern, notModelPattern?)` — admin-client query for active,
  priced listings in the family, then `priceStats` → formatted sentence, or
  `null` below the honesty floor.
- `src/app/api/cron/alert-digest/route.ts` — aircraft `AlertTarget` gets a new
  optional `marketPulseModel` field (display model name), set only for a
  curated make+model family (`resolveAircraftMakeModel`'s `seoEntry` branch) or
  a single (non-comma) `model` query param on `/aircraft?make=&model=`. The
  per-alert prepare loop computes `marketPulse` for aircraft alerts that will
  actually send (skips make-only / uncurated / multi-model alerts — no line for
  those), threaded into both the single-alert and combined-email builds.
- `src/lib/email.ts` — `buildAlertDigestEmail` and `AlertDigestSection` /
  `buildCombinedAlertDigestEmail` accept an optional `marketPulse` string,
  rendered as a small muted line under the count heading (HTML + text).
- `src/app/api/dev/email-preview/alert-digest/route.ts` — add a fixture
  `marketPulse` so the dev preview route shows the new line.

## Acceptance criteria
- `getMarketPulseLine` returns `null` (never a fabricated number) when the
  family has fewer than `MIN_SNAPSHOT_LISTINGS` (8) real priced listings.
- The digest email (single-alert and combined) renders the market-pulse line
  only for aircraft alerts with a clean, curated make+model target — no line
  for make-only, uncurated-slug, or multi-model alerts.
- The rich single-listing price-drop template (`buildPriceDropEmail`) and
  listing-watch sends are unaffected (out of scope, per item description —
  "digest surface only").
- `npx tsc --noEmit` and `npx next build` both pass.
- Existing `email.test.ts` suite still passes; new cases cover
  `marketPulse` rendering (present/absent) in both digest builders.
- No schema change, no new capture point, no `alert_subscribed` payload change.

## Out of scope
- Make-only market pulse (e.g. "142 Cessnas listed right now").
- Applying market pulse to `buildPriceDropEmail` / listing-watch emails.
- The Resend bounce-webhook item (separate backlog line, needs human action).
