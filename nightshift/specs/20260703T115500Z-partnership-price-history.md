# partnership-price-history

## Goal
Give partnership listings the same honest "price drop = seller motivation signal"
that aircraft-for-sale listings already have — today a partnership buy-in can be
edited (edit flow shipped earlier today) but no history is captured, so buyers
never see when a seller has already dropped the price.

## Scope
- `supabase/schema.sql` — additive columns on `partnerships`: `previous_buy_in_price
  integer`, `buy_in_price_changed_at timestamptz` (append near the existing
  `partnership_add_spec_fields` block; human must apply in the Supabase SQL editor).
- `src/lib/types.ts` — add the two fields to the `Partnership` type.
- `src/app/actions.ts` (`updatePartnershipListing`) — before updating, read the
  listing's current `buy_in_price`; if the new value differs from a real (non-null)
  old value, stamp `previous_buy_in_price`/`buy_in_price_changed_at`. Graceful
  fallback for BOTH the already-pending `ttaf/smoh/engine_type` migration AND this
  new one being unapplied, independently or together (the live DB currently has the
  spec-fields migration still unapplied, so this must not regress the existing
  fallback path).
- `src/components/PartnershipDealSignals.tsx` — new signal row: "Buy-in reduced
  $X — down Y% from the original $Z — a seller motivation signal" (or "increased"),
  rendered only when a real recorded change exists. Mirrors the aircraft-for-sale
  copy exactly.
- `src/app/partnerships/[id]/page.tsx` — strikethrough the previous buy-in price
  under the Costs card's Buy-In figure, only on a price drop (mirrors the aircraft
  listing page's `priceDrop`/strikethrough treatment).

## Acceptance criteria
- `npx next build` + `tsc --noEmit` are clean.
- Editing a partnership listing's buy-in to a new, different, non-null value stamps
  `previous_buy_in_price`/`buy_in_price_changed_at`; editing without changing the
  buy-in leaves those columns untouched; the first-ever price never fabricates a
  "previous" value.
- The update still succeeds today even though BOTH the spec-fields migration and
  this new migration are unapplied on the live DB (verified against the real DB).
- `/partnerships/[id]` renders the new "Buy-in reduced/increased" signal only when
  a real change is on record; no fabricated or guessed numbers.
- QA smoke passes (desktop 1280 + mobile 375, zero console errors, zero overflow)
  on `/partnerships/new` and a real `/partnerships/[id]` detail page.

## Out of scope
- A full "Price history" timeline/table panel (aircraft's expanded section) — the
  signal row + strikethrough badge is the slice for this cycle.
- Backfilling history for listings that already had buy-in changes before this
  column existed (no way to reconstruct — honesty-gated, not fabricated).
- `createPartnership` (new listings never have a "previous" price).
