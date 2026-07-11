# alert-price-drop-opt-in

## Goal
Let a subscriber opt out of price-drop matches on an aircraft alert (keeping the
new-listing alert), via a checkbox at capture time and a toggle on `/alerts/manage`.

## Scope
- `supabase/schema.sql` — additive `alerts.price_drop_opt_in boolean not null default true`
  (flagged `HUMAN ACTION REQUIRED`, same as other pending live-DB migrations).
- `src/components/AlertSignup.tsx` — "Also alert me when the price drops on a match"
  checkbox, default checked, shown only when `noun === 'aircraft'` (the only type with
  price-drop tracking).
- `src/app/actions.ts` — `subscribeToAlerts` takes a 4th `priceDropOptIn` param and writes
  it; new `updateAlertPriceDropOptIn(id, enabled)` action for the manage-page toggle.
  Both retry without the column on a migration-not-applied error (graceful fallback,
  same pattern as `profiles.favorite_airports`).
- `src/components/PriceDropToggle.tsx` (new) — small persistent On/Off switch.
- `src/app/alerts/manage/page.tsx` — fetches `price_drop_opt_in` (with the same fallback
  retry), renders the toggle only for aircraft-type alerts.
- `src/app/api/cron/alert-digest/route.ts` — fetches `price_drop_opt_in` (same fallback),
  skips `countRecentAircraftPriceDrops` when an alert has opted out.

## Acceptance criteria
- Capture forms on aircraft surfaces show the checkbox (default on); partnership/seeker
  forms do not.
- A new alert row is inserted with the chosen `price_drop_opt_in` value; if the column
  isn't live yet, the subscription still succeeds (no user-facing error).
- `/alerts/manage` shows a "Price drops: On/Off" toggle only on aircraft-type alert rows;
  toggling calls the new owner-scoped action and persists.
- `alert-digest` cron does not count/report price drops for an alert with
  `price_drop_opt_in = false`; unaffected (still counts) when true or when the column is
  absent.
- `npx next build` (typecheck + build) is clean.
- No regression to existing alert signup/manage/digest behavior when the migration has
  NOT yet been applied to the live DB (all three write/read paths degrade gracefully).

## Out of scope
- Digest vs. instant frequency choice (separate `[P1][goal]` backlog item).
- Applying the migration to the live Supabase DB (human action, per established
  convention for schema changes in this codebase).
- Partnership/seeker price-drop tracking (no `previous_buy_in_price` support built yet).
