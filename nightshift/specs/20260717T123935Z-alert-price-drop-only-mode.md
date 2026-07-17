# Price-drop-ONLY mode for alerts

## Goal
Let a subscriber mute new-listing emails and get ONLY price-drop notifications on an
aircraft-type alert, instead of `price_drop_opt_in` only being able to ADD drops on top of
new-listing sends.

## Scope
- `supabase/schema.sql` — additive `alerts.new_listing_opt_out boolean not null default false`
  column (⚠️ human-apply migration, same fail-soft pattern as every prior `alerts.*` addition).
- `src/lib/alertsForOwner.ts` — add the column to `OPTIONAL_COLS`/`AlertRow` (manage-page read).
- `src/lib/savedSearchAlerts.ts` — same, for the `/searches` page's inline alert controls.
- `src/app/api/cron/alert-digest/route.ts` — add to `DIGEST_OPTIONAL_COLS`/`DigestAlertRow`;
  when set (aircraft-type alerts only — drops-only has no meaning for seekers, which have no
  price at all), force `newCount = 0` and skip the new-listing sample fetch, so the alert
  degrades straight into `countRecentAircraftPriceDrops`'s existing branch. The existing
  `newCount === 0 && dropCount === 0` skip-gate already handles "no drops right now" for a
  drops-only alert — no new skip logic needed.
- `src/app/actions.ts` — replace the 2-state `updateAlertPriceDropOptIn` with a single
  `updateAlertMode(id, mode: 'both' | 'new' | 'drops', token?)` action that writes
  `price_drop_opt_in`/`new_listing_opt_out` together as one atomic, always-valid combination
  (never produces the unreachable "neither" state). Same ownership proof + fail-soft
  column-retry pattern as the action it replaces. Also thread `newListingOptOut` through
  `createManageAlert`'s `opts` (the "Duplicate this alert" carry-over) so duplicating a
  drops-only alert doesn't silently reset it to "both".
- New `src/components/AlertModeToggle.tsx` (replaces `src/components/PriceDropToggle.tsx`,
  deleted) — single-button 3-state cycle (New + drops → New only → Drops only → …), mirroring
  the existing `FrequencyToggle` single-pill UI idiom. Rendered on `/alerts/manage` (in place of
  `PriceDropToggle`) and `SavedSearchAlertButton` (`/searches`), both already gated to
  aircraft-type alerts only.
- `src/components/AlertEditForm.tsx` / `NewAlertForm.tsx` — carry `newListingOptOut` through the
  Duplicate flow's `initial` values alongside the existing `priceDropOptIn`/`frequency`.
- No new capture point: `AlertSignup.tsx`'s capture-time checkbox and `subscribeToAlerts`/
  `subscribeSignedInAlert` are untouched — every newly-created alert starts in "both" mode
  (`new_listing_opt_out` defaults `false`); drops-only is a manage-time choice only.

## Acceptance criteria
- An aircraft-type alert on `/alerts/manage` shows one pill that cycles New+drops → New only →
  Drops only → New+drops on click, and the click persists via `updateAlertMode`.
- Setting "Drops only" and confirming a real drop exists causes the digest cron to send only
  the price-drop email content for that alert (no new-listing count/samples) — verified by
  forcing `newCount` to 0 in the code path, not by waiting for a real drop.
- Setting "Drops only" with zero live drops results in the alert being skipped this pass (no
  email), matching the existing "nothing to say" behavior — never a blank/dishonest send.
- Partnership/seeker alerts are unaffected — no toggle rendered, behavior unchanged (drops-only
  has no partnership/seeker UI, matching the existing `price_drop_opt_in` scope).
- The DB migration is additive and the whole feature fails soft (defaults to today's "both"
  behavior) when the column isn't yet applied live.
- `npx tsc --noEmit` and `npx next build` both pass; `qa-smoke.mjs` passes on `/alerts/manage`
  and `/searches` at desktop 1280 + mobile 375 with zero console errors/overflow.

## Out of scope
- Any change to the capture-time `AlertSignup` checkbox or a new capture surface.
- Partnership/seeker price-drop-only support (drops-only stays aircraft-side, matching
  `price_drop_opt_in`'s existing scope).
- Applying the live migration (human action, same as every prior `alerts.*` column).
