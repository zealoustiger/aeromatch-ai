# digest-samples-rank-by-deal

## Goal
Rank an alert's new-listing digest samples so the biggest honest below-market
deal leads the email, instead of always leading with whatever listed most
recently regardless of price.

## Scope
- `src/lib/aircraftComps.ts` — new pure, exported `rankSamplesByDealQuality`
  helper (co-located with `compVsMarket`/`buildFamilyPriceMap`, same file the
  comp math already lives in).
- `src/lib/aircraftComps.test.ts` — new test file covering the ranking logic
  (this file currently has no tests; the rest of `aircraftComps.ts` is
  untested-by-design because it hits the DB directly — this new function is
  pure, so it gets real unit coverage).
- `src/app/api/cron/alert-digest/route.ts` — `fetchNewAircraftSamples` calls
  the new helper to reorder its already-fetched candidate rows (by comp
  computed from the existing `familyPriceMap`) before mapping to
  `AlertDigestSample`/slicing to the display limit. No change to the DB
  query, no change to `fetchAircraftPriceDropSamples` (price-drop samples
  already show a before/after price and are explicitly out of scope per the
  backlog item).

## Acceptance criteria
- New-listing aircraft digest samples with a `compVsMarket` verdict of
  `'below'` sort ahead of samples with `'near'`/`'above'`/no-comp verdict,
  biggest discount (`pct`) first.
- Among samples that are all `'below'`, ties on `pct` keep their original
  (newest-first) relative order.
- Samples with no comp verdict (near/above/null — insufficient family data)
  keep their original newest-first relative order, appended after every
  `'below'` sample. Never fabricate a rank from missing comp data.
- Deal-only (`dealOnly`) alerts are unaffected in substance (their whole
  candidate pool is already deal-verdict `'good'`) but pass through the same
  ranking path without erroring.
- `price_changed_at`-ordered price-drop samples are untouched (no comp line,
  no reorder).
- `npx tsc --noEmit` and `npx next build` both exit 0. New unit tests pass.

## Out of scope
- Widening the DB query / candidate pool beyond what's already fetched.
- Any change to `fetchAircraftPriceDropSamples`, partnership, or seeker
  sample ordering.
- Any change to the digest email template/HTML — this is a sort-order-only
  change, samples render in the same cards as today.
- Surfacing rank/pct anywhere in the UI.
