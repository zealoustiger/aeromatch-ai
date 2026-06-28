/**
 * Worked-example tests for the ClubHanger Estimate (price-vs-market) helper.
 * Run: node --experimental-strip-types --test src/lib/aircraftEstimate.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  clubHangerEstimate,
  clubHangerDealVerdict,
  MIN_ESTIMATE_COMPS,
  ESTIMATE_DEAD_BAND,
  MIN_DEAL_COMPS,
  DEAL_YEAR_BAND,
  DEAL_HOURS_ABS_BAND,
  type DealComp,
} from './aircraftEstimate.ts'

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
  // Range = min/max of the OTHER comps (300k–380k), not including the 280k subject.
  assert.equal(e!.low, 300_000)
  assert.equal(e!.high, 380_000)
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

/* ── ClubHanger Deal Check (similar-year + similar-hours value verdict) ──────── */

// A 2008 SR22 @ 1,200 hrs. With ±5yr and a 1,000hr band, these five comps are all
// "similar": prices 320/340/360/380/400k → median 360k. The last two are deliberately
// OUT of band (year 1998; hours 3,000) and must be excluded.
const SR22_COMPS: DealComp[] = [
  { asking_price: 340_000, year: 2008, ttaf: 1_200 },
  { asking_price: 360_000, year: 2010, ttaf: 1_500 },
  { asking_price: 380_000, year: 2006, ttaf: 800 },
  { asking_price: 400_000, year: 2012, ttaf: 2_000 },
  { asking_price: 320_000, year: 2005, ttaf: 1_000 },
  { asking_price: 150_000, year: 1998, ttaf: 1_200 }, // out of year band → excluded
  { asking_price: 180_000, year: 2008, ttaf: 3_000 }, // out of hours band → excluded
]

test('deal: good deal — clearly below the similar-year/hours median', () => {
  const d = clubHangerDealVerdict({ askingPrice: 280_000, year: 2008, ttaf: 1_200 }, SR22_COMPS)
  assert.ok(d)
  assert.equal(d!.verdict, 'good')
  assert.equal(d!.median, 360_000) // proves the two out-of-band cheap comps were excluded
  assert.equal(d!.compCount, 5)
  assert.equal(d!.deltaDollars, -80_000)
  assert.equal(d!.deltaPct, 22) // round(80/360*100)
  assert.equal(d!.yearBand, DEAL_YEAR_BAND)
})

test('deal: priced high — clearly above the similar median', () => {
  const d = clubHangerDealVerdict({ askingPrice: 440_000, year: 2008, ttaf: 1_200 }, SR22_COMPS)
  assert.ok(d)
  assert.equal(d!.verdict, 'high')
  assert.equal(d!.deltaDollars, 80_000)
  assert.equal(d!.deltaPct, 22)
})

test('deal: fair — within the dead band of the similar median, pct 0', () => {
  const d = clubHangerDealVerdict({ askingPrice: 368_000, year: 2008, ttaf: 1_200 }, SR22_COMPS)
  assert.ok(d)
  assert.equal(d!.verdict, 'fair')
  assert.equal(d!.deltaPct, 0)
  assert.equal(d!.deltaDollars, 8_000)
})

test('deal: null when subject lacks a year or total time — cannot honestly judge', () => {
  assert.equal(clubHangerDealVerdict({ askingPrice: 280_000, year: null, ttaf: 1_200 }, SR22_COMPS), null)
  assert.equal(clubHangerDealVerdict({ askingPrice: 280_000, year: 2008, ttaf: null }, SR22_COMPS), null)
  assert.equal(clubHangerDealVerdict({ askingPrice: null, year: 2008, ttaf: 1_200 }, SR22_COMPS), null)
})

test('deal: null when fewer than MIN_DEAL_COMPS fall inside BOTH bands', () => {
  // Only 3 in-band comps; the rest are out of year/hours band → no verdict.
  const sparse: DealComp[] = [
    { asking_price: 340_000, year: 2008, ttaf: 1_200 },
    { asking_price: 360_000, year: 2009, ttaf: 1_300 },
    { asking_price: 380_000, year: 2007, ttaf: 1_100 },
    { asking_price: 200_000, year: 1990, ttaf: 1_200 }, // out of band
    { asking_price: 210_000, year: 2008, ttaf: 6_000 }, // out of band
  ]
  assert.ok(3 < MIN_DEAL_COMPS)
  assert.equal(clubHangerDealVerdict({ askingPrice: 300_000, year: 2008, ttaf: 1_200 }, sparse), null)
})

test('deal: hours band scales with the subject (relative band for high-time airframes)', () => {
  // Subject 5,000 hrs → band = max(1,000, 5,000*0.35=1,750) = 1,750. A 6,500hr comp
  // (Δ1,500) is in; an 8,000hr comp (Δ3,000) is out. Use a fixed-year set so only the
  // hours band decides membership.
  const comps: DealComp[] = [
    { asking_price: 200_000, year: 2008, ttaf: 4_000 }, // Δ1,000 in
    { asking_price: 210_000, year: 2008, ttaf: 4_500 }, // Δ500 in
    { asking_price: 220_000, year: 2008, ttaf: 6_000 }, // Δ1,000 in
    { asking_price: 230_000, year: 2008, ttaf: 6_500 }, // Δ1,500 in
    { asking_price: 60_000, year: 2008, ttaf: 8_000 }, //  Δ3,000 OUT
  ]
  const d = clubHangerDealVerdict({ askingPrice: 150_000, year: 2008, ttaf: 5_000 }, comps)
  assert.ok(d)
  assert.equal(d!.compCount, 4) // the 8,000hr comp excluded
  assert.equal(d!.median, 215_000) // median of 200/210/220/230 → (210+220)/2
  assert.ok(DEAL_HOURS_ABS_BAND === 1_000)
})
