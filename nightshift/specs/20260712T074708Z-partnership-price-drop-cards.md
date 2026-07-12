# partnership-price-drop-cards

## Goal
Give partnership alerts the same rich buy-in-drop preview cards in the digest email that aircraft alerts already get, instead of the CTA-only fallback.

## Scope
- `src/app/api/cron/alert-digest/route.ts`:
  - New `fetchPartnershipPriceDropSamples` mirroring `fetchAircraftPriceDropSamples`, querying `partnerships` for `buy_in_price`/`previous_buy_in_price`/`buy_in_price_changed_at` (remap onto `hasRecentPriceDrop`'s generic shape, same as `countRecentPartnershipPriceDrops` already does), with the same graceful-degrade-to-empty on a missing-column error.
  - `toPartnershipDigestSample` gains an optional `previousPrice` param (mirrors `toDigestSample`).
  - Sample-selection logic for `target.type === 'partnership'`: prefer new-listing samples when `newCount > 0`; else fall back to price-drop samples when `dropCount > 0`; else `[]`.
- No changes to `src/lib/email.ts` — `AlertDigestSample.previousPrice`/`shareType` and the card renderer already support this generically (verified by code read).
- No schema change — `previous_buy_in_price`/`buy_in_price_changed_at` already exist in `supabase/schema.sql`.

## Acceptance criteria
- A partnership alert whose window has zero new listings but ≥1 genuine buy-in drop now gets up to 3 real drop preview cards (struck-through old buy-in, bold new buy-in) instead of the bare CTA-only digest.
- A partnership alert with new listings is unaffected (still gets new-listing samples, unchanged).
- A partnership alert with neither new listings nor drops is unaffected (already skipped upstream — `newCount === 0 && dropCount === 0` continues to skip the whole send).
- Aircraft/seeker alert paths are byte-for-byte unchanged.
- `npx next build` + typecheck pass.
- No live cron invocation (no `CRON_SECRET` set locally would mean an unprotected real send — verify read-only against real prod data instead, same precedent as `partnership-price-drop-alerts`/`price-drop-email-live`).

## Out of scope
- The rich single-listing `buildPriceDropEmail` template for partnerships (aircraft-only today, typed for `askingPrice`/`previousPrice` as a single aircraft listing — a separate, larger slice).
- Seeker alerts (no price at all).
