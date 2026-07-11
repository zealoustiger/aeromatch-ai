# Partnership price-drop alerts (detect + digest count)

## Goal
Extend the alert-digest cron's price-drop detection — already live for aircraft-for-sale
alerts — to partnership alerts, using the `previous_buy_in_price`/`buy_in_price_changed_at`
columns `updatePartnershipListing` already writes on an edited buy-in.

## Scope
- `src/app/api/cron/alert-digest/route.ts`: new `countRecentPartnershipPriceDrops` (mirrors
  `countRecentAircraftPriceDrops`, filtered by `target.make`/`target.state`/`target.icao`),
  wired into the existing `dropCount` computation for `target.type === 'partnership'`. Reuses
  the existing `hasRecentPriceDrop` helper from `src/lib/priceDrops.ts` by remapping partnership
  field names (`buy_in_price`→`asking_price`, `previous_buy_in_price`→`previous_price`,
  `buy_in_price_changed_at`→`price_changed_at`) — no changes to `priceDrops.ts` itself, the
  helper is already generic. Graceful-degrade on the not-yet-migrated
  `previous_buy_in_price`/`buy_in_price_changed_at` columns (same pending-DDL retry precedent
  as `additional_airports`): a missing-column error returns 0 drops rather than failing the
  whole digest send.
- `src/lib/email.ts`: `buildAlertDigestEmail` gets an optional `dropNoun` param (default
  `'price drop'`, pluralized with a trailing `s`) so partnership drops render as "1 buy-in
  drop" / "N buy-in drops" instead of "price drop(s)" — an honest label, since a partnership
  listing's price is a buy-in share, not an asking price.
- `src/app/api/cron/alert-digest/route.ts`: pass `dropNoun: 'buy-in drop'` when
  `target.type === 'partnership'` in the `buildAlertDigestEmail` call.
- `src/lib/email.test.ts`: add a unit test for the custom `dropNoun` rendering.

## Out of scope
- No new capture point / UI change — this is purely digest-cron send-path logic.
- No `price_drop_opt_in` UI for partnerships (the checkbox stays aircraft-only per
  `AlertSignup`; the column already defaults `true` at the DB level, so partnership alerts
  get drop detection "on" by default with no explicit opt-in surface, matching how the toggle
  never existed for partnerships until now).
- No preview-card samples for partnership drops (aircraft-only today, per
  `alert-digest-email-redesign`) — CTA-only copy line, same as partnerships already render.
- No schema change — `previous_buy_in_price`/`buy_in_price_changed_at` already exist in
  `supabase/schema.sql` (migration `partnership_add_price_history`), pending human application
  live; this cycle just wires the already-shipped columns into the digest.

## Acceptance criteria
- `npx tsc --noEmit` and `npx next build` both pass.
- `node --experimental-strip-types --test src/lib/email.test.ts` passes, including the new
  `dropNoun` test.
- A partnership alert whose target partnership had a genuine buy-in decrease recorded since
  the alert's last-digest window now counts toward `dropCount` and renders "N buy-in drop(s)"
  in the digest email copy — verified via a manual/unit check of the query logic (not a live
  send, per the "prefer not creating prod rows" QA guidance — this is a cron/query-logic
  change, not a page).
- The route still degrades gracefully (returns 0, doesn't 500) when the partnership
  price-history columns aren't migrated live yet.
- No change to aircraft or seeker alert behavior.
- QA smoke passes on a couple of representative pages (no page touched, but confirm no
  regression on `/alerts/manage` and `/partnerships` since this cycle imports
  `priceDrops.ts` into a new call site).
