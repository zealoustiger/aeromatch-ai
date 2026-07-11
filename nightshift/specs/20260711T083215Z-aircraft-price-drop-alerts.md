# aircraft-price-drop-alerts

## Goal
Make the weekly alert digest also notify on genuine price drops (not just new
listings) for aircraft-for-sale alerts, closing the "new-listing AND price-drop
alerts" gap GOAL.md calls out explicitly, using the price-change columns the
scraper already writes — no schema change needed.

## Scope
- `src/lib/priceDrops.ts` (new): pure `hasRecentPriceDrop()` / `priceDropAmount()`
  helpers over `previous_price` / `asking_price` / `price_changed_at` (columns
  already on `aircraft_for_sale`, written by `scraper/lib/ingest-core.mjs` on every
  detected price change — confirmed `previous_price`/`price_changed_at` stay `null`
  on first insert, so a brand-new listing can never also register as a "drop").
- `src/lib/priceDrops.test.ts` (new): deterministic unit tests (fixed `now`,
  no DB/network).
- `src/app/api/cron/alert-digest/route.ts`: add `countRecentAircraftPriceDrops()`
  (mirrors `countNewAircraft`'s filter params — make/model/state/price/year/ttaf —
  but matches on `price_changed_at >= since` + a genuine decrease). Aircraft-type
  alerts now count price drops alongside new listings; partnership/seeker alerts
  are unaffected (partnerships have separate `previous_buy_in_price` columns —
  next slice, not this one).
- `src/lib/email.ts`: `buildAlertDigestEmail()` takes `newCount` + `dropCount`
  instead of a single `count`, with copy that names both plainly when both are
  present (e.g. "2 new listings + 1 price drop") — never conflates a price drop
  into "new listing" (GOAL.md: alert content must be honest).

## Out of scope
- No new DB table/migration — a full multi-row `price_history` table isn't
  needed for "was there a recent drop," only the existing single-previous-value
  columns are.
- Partnerships/seeker price-drop alerts (partnerships use different columns;
  seekers have no price at all).
- A per-alert opt-out/opt-in toggle for price-drop notifications (separate
  backlog item, needs its own migration).
- Redesigning the digest email's visual template (separate backlog item; this
  cycle only changes the copy/count logic).

## Acceptance criteria
- `npx next build` (typecheck + build) passes clean.
- `node --experimental-strip-types --test src/lib/priceDrops.test.ts` passes,
  covering: genuine drop within window → true; price increase → false; drop
  outside the window → false; missing `previous_price`/`price_changed_at` → false.
- `countRecentAircraftPriceDrops` reuses the same filter fields as
  `countNewAircraft` (make/model/state/price/year/ttaf) so a price-drop alert
  respects the same criteria as the existing new-listing match.
- The digest is skipped only when both `newCount === 0` and `dropCount === 0`.
- No behavior change for partnership/seeker alerts.
- QA smoke passes on representative pages that import the touched shared files
  (`/aircraft`, `/aircraft/listing/[id]`) — non-visual cycle (backend + email
  copy only), no page UI changes.
