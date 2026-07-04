# partnership-card-price-drop

## Goal
Show the existing "buy-in reduced" price-drop signal on the `/partnerships` browse card, closing the one remaining card/detail asymmetry between aircraft-for-sale and partnership listings (Pillar 3: proprietary buyer-analysis).

## Context
`AircraftSaleCard` already computes `priceDrop()` from `previous_price`/`asking_price` and renders a "Price drop $X" badge plus a strikethrough previous price next to the asking price. Partnerships got `previous_buy_in_price`/`buy_in_price_changed_at` (self-serve edit price history) and already surface a "Buy-in reduced/increased" row on the partnership *detail* page (`PartnershipDealSignals.tsx`), but `PartnershipCard.tsx` — the card rendered on `/partnerships`, `/saved`, `/airports/[icao]`, `/members/[id]`, `/partnerships/near/[icao]` — has zero reference to it. A shopper scanning browse results never sees a genuine, honestly-recorded price drop unless they click into the listing. No schema change needed; the columns are already selected via `select('*')` in `partnershipsQuery.ts` and are already on the `Partnership` type.

## Scope
- `src/components/PartnershipCard.tsx`:
  - Add a `priceDrop()` helper mirroring `AircraftSaleCard.tsx`'s (confirmed drop only — `previous_buy_in_price != null && buy_in_price != null && buy_in_price < previous_buy_in_price`).
  - Render a "Price drop $X" badge (same emerald pill + `TrendingDown` icon styling as the aircraft card) in the badges row when a drop is confirmed.
  - Render a strikethrough `previous_buy_in_price` next to the "Buy-in" price in the cost-summary block, mirroring the aircraft card's strikethrough-under-asking-price treatment.
- No changes to `src/app/actions.ts`, no schema/migration, no other files.

## Acceptance criteria
- A partnership with `buy_in_price < previous_buy_in_price` shows an emerald "Price drop $X" badge on `PartnershipCard` (verify via a temporary/manual check against seed or by reasoning through a listing with a recorded price drop — QA smoke covers render/no-console-error).
- The strikethrough previous buy-in renders directly under/near the current buy-in price, matching the aircraft card's pattern.
- A partnership with no `previous_buy_in_price`, or where the price went up or is unchanged, renders exactly as it does today (no badge, no strikethrough) — verified by the existing seed data still rendering cleanly.
- `npx next build` + typecheck pass.
- No new console errors on `/partnerships` (desktop 1280 + mobile 375), no horizontal overflow.
- No visual regression to the rest of the card (badges row wraps gracefully with the new badge).

## Out of scope
- Any change to the aircraft-for-sale card (already has this).
- Any change to the partnership detail page (already has this).
- Any change to `PartnershipRailCard` or other partnership card variants not used on the main browse surfaces (this cycle only touches `PartnershipCard.tsx`).
- Backfilling `previous_buy_in_price` for existing rows or seed data.
