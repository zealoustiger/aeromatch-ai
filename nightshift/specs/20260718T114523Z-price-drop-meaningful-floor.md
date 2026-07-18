# price-drop-meaningful-floor

## Goal
Stop the price-drop alert digest from firing on trivial repricing (e.g. a $100 nudge on a
$150k listing) by adding a minimum-meaningful-drop floor, per BACKLOG.md plan-pass batch #7
`[P1][goal]`.

## Scope
- `src/lib/priceDrops.ts` — add a pure `isMeaningfulPriceDrop(subject)` helper: true when the
  drop is ≥1% of `previous_price` OR ≥$500 (whichever is met first).
- `src/lib/priceDrops.test.ts` — unit tests for the new helper (below-floor, at-floor,
  above-floor by each of the two criteria, boundary cases).
- `src/app/api/cron/alert-digest/route.ts` — apply the floor to the SEARCH-SCOPED price-drop
  paths only: `countRecentAircraftPriceDrops`, `countRecentPartnershipPriceDrops`,
  `fetchAircraftPriceDropSamples`, `fetchPartnershipPriceDropSamples`.

## Out of scope
- `resolveListingWatch` / `resolvePartnershipWatch` (single-listing "watch this listing"
  alerts) — explicitly EXEMPT per the backlog item: a subscriber watching one specific
  listing gets notified on ANY genuine drop (or once price clears their own `target_price`
  threshold), never gated by the floor. Their existing any-drop behavior is unchanged.
- No schema change, no new capture point, no UI change (this is a server-side filter on an
  existing cron path).

## Acceptance criteria
- New `isMeaningfulPriceDrop` is pure, deterministic, and unit-tested: a $100 drop on a
  $150k listing (0.07%, <$500) → false; a $2,000 drop on $150k (1.3%) → true; a $499 drop on
  a $10k listing (4.99%, <$500 but ≥1%... verify boundary) → true via the percent leg; a
  $499 drop on a $200k listing (0.25%, <1%, <$500) → false.
- `countRecentAircraftPriceDrops`/`countRecentPartnershipPriceDrops` no longer count trivial
  drops; `fetchAircraftPriceDropSamples`/`fetchPartnershipPriceDropSamples` no longer sample
  them.
- `resolveListingWatch`/`resolvePartnershipWatch` behavior is byte-identical to before (no
  floor applied) — verified by reading the diff touches nothing in those two functions.
- `npx tsc --noEmit` and `npx next build` both exit 0.
- Full `node --test` suite passes, including new tests.
