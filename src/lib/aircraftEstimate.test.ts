/**
 * Worked-example tests for the ClubHanger Estimate (price-vs-market) helper.
 * Run: node --experimental-strip-types --test src/lib/aircraftEstimate.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clubHangerEstimate, MIN_ESTIMATE_COMPS, ESTIMATE_DEAD_BAND } from './aircraftEstimate.ts'

// The array passed to clubHangerEstimate INCLUDES the listing's own price (one
// occurrence is excluded internally), mirroring how the page passes the raw family
// asking-price column.

test('below market — priced clearly below the family median', () => {
  // Others: 300k,320k,340k,360k,380k → median 340k. This listing 280k → -60k (-18%).
  const e = clubHangerEstimate(280_000, [280_000, 300_000, 320_000, 340_000, 360_000, 380_000])
  assert.ok(e)
  assert.equal(e!.verdict, 'below')
  assert.equal(e!.median, 340_000)
  assert.equal(e!.compCount, 5)
  assert.equal(e!.deltaDollars, -60_000)
  assert.equal(e!.deltaPct, 18)
})

test('above market — clearly above the family median', () => {
  // Others median 340k; this listing 420k → +80k (+24%).
  const e = clubHangerEstimate(420_000, [420_000, 300_000, 320_000, 340_000, 360_000, 380_000])
  assert.ok(e)
  assert.equal(e!.verdict, 'above')
  assert.equal(e!.deltaDollars, 80_000)
  assert.equal(e!.deltaPct, 24)
})

test('around market — within the dead band of the median, pct 0', () => {
  // Others median 340k; this listing 345k → +1.5%, inside the 5% dead band.
  const e = clubHangerEstimate(345_000, [345_000, 300_000, 320_000, 340_000, 360_000, 380_000])
  assert.ok(e)
  assert.equal(e!.verdict, 'around')
  assert.equal(e!.deltaPct, 0)
  // deltaDollars is still the honest signed distance even when the verdict is "fair".
  assert.equal(e!.deltaDollars, 5_000)
  // sanity: the example sits inside the dead band.
  assert.ok(Math.abs((345_000 - 340_000) / 340_000) < ESTIMATE_DEAD_BAND)
})

test('null on thin data — fewer than MIN_ESTIMATE_COMPS other comps', () => {
  // 1 self + 3 others = 3 others < MIN_ESTIMATE_COMPS (4) → no estimate.
  const prices = [300_000, 320_000, 340_000, 360_000]
  assert.equal(prices.length - 1, 3)
  assert.ok(3 < MIN_ESTIMATE_COMPS)
  assert.equal(clubHangerEstimate(300_000, prices), null)
})

test('null on missing / non-positive asking price', () => {
  const dense = [300_000, 320_000, 340_000, 360_000, 380_000]
  assert.equal(clubHangerEstimate(null, dense), null)
  assert.equal(clubHangerEstimate(0, dense), null)
  assert.equal(clubHangerEstimate(-5, dense), null)
})

test('excludes exactly ONE occurrence of the listing price (duplicates kept as comps)', () => {
  // Three listings at 340k: the subject + two genuine same-priced comps. Only one is
  // removed, so the other two still count toward the comp set and the median.
  const e = clubHangerEstimate(340_000, [340_000, 340_000, 340_000, 360_000, 380_000, 400_000])
  assert.ok(e)
  assert.equal(e!.compCount, 5) // 6 prices - 1 self
  // others sorted: 340,340,360,380,400 → median 360k; subject 340k → -20k.
  assert.equal(e!.median, 360_000)
  assert.equal(e!.deltaDollars, -20_000)
})
