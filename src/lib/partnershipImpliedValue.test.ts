import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeImpliedValueCheck,
  MIN_FORSALE_COMPS,
  DEAD_BAND,
} from './partnershipImpliedValue.ts'

// Minimal set of for-sale comps above the threshold
const COMPS = [100_000, 110_000, 120_000, 130_000, 140_000] // median = 120_000

describe('computeImpliedValueCheck', () => {
  it('returns null when buyIn is null', () => {
    assert.strictEqual(computeImpliedValueCheck(null, 4, COMPS), null)
  })

  it('returns null when buyIn is zero', () => {
    assert.strictEqual(computeImpliedValueCheck(0, 4, COMPS), null)
  })

  it('returns null when totalShares is null', () => {
    assert.strictEqual(computeImpliedValueCheck(30_000, null, COMPS), null)
  })

  it('returns null when totalShares < 2', () => {
    assert.strictEqual(computeImpliedValueCheck(30_000, 1, COMPS), null)
  })

  it('returns null when fewer than MIN_FORSALE_COMPS valid prices', () => {
    const thin = Array.from({ length: MIN_FORSALE_COMPS - 1 }, () => 120_000)
    assert.strictEqual(computeImpliedValueCheck(30_000, 4, thin), null)
  })

  it('returns null when forSalePrices is empty', () => {
    assert.strictEqual(computeImpliedValueCheck(30_000, 4, []), null)
  })

  it('returns "near" when implied value is within DEAD_BAND of median', () => {
    // median = 120_000, implied = 4 × 30_000 = 120_000 → 0% delta
    const result = computeImpliedValueCheck(30_000, 4, COMPS)
    assert.ok(result, 'should return a result')
    assert.strictEqual(result.kind, 'near')
    assert.strictEqual(result.pct, 0)
    assert.strictEqual(result.impliedValue, 120_000)
    assert.strictEqual(result.median, 120_000)
    assert.strictEqual(result.count, 5)
  })

  it('returns "near" at edge of dead-band (just inside)', () => {
    // implied = 4 × 28_680 = 114_720 → (114720 - 120000) / 120000 ≈ -4.4% (within 10%)
    const result = computeImpliedValueCheck(28_680, 4, COMPS)
    assert.ok(result)
    assert.strictEqual(result.kind, 'near')
  })

  it('returns "below" when implied value is significantly below median', () => {
    // implied = 4 × 24_000 = 96_000 → (96000 - 120000) / 120000 = -20%
    const result = computeImpliedValueCheck(24_000, 4, COMPS)
    assert.ok(result)
    assert.strictEqual(result.kind, 'below')
    assert.ok(result.pct >= 1)
    assert.ok(result.deltaDollars < 0)
  })

  it('returns "above" when implied value is significantly above median', () => {
    // implied = 4 × 40_000 = 160_000 → (160000 - 120000) / 120000 ≈ +33%
    const result = computeImpliedValueCheck(40_000, 4, COMPS)
    assert.ok(result)
    assert.strictEqual(result.kind, 'above')
    assert.ok(result.pct >= 1)
    assert.ok(result.deltaDollars > 0)
  })

  it('filters out zero and non-finite prices from comp set', () => {
    const compsWithJunk = [0, -1, NaN, Infinity, ...COMPS]
    const result = computeImpliedValueCheck(30_000, 4, compsWithJunk)
    assert.ok(result)
    assert.strictEqual(result.count, COMPS.length)
  })

  it('uses correct median for even-length arrays', () => {
    // sorted: [100, 110, 120, 130] → median = (110+120)/2 = 115
    const evenComps = [100_000, 110_000, 120_000, 130_000]
    // implied = 4 × 28_750 = 115_000 → 0% delta (near median 115_000)
    const result = computeImpliedValueCheck(28_750, 4, evenComps)
    assert.ok(result)
    assert.strictEqual(result.median, 115_000)
  })

  it('pct is at least 1 for non-near results', () => {
    const result = computeImpliedValueCheck(40_000, 4, COMPS)
    assert.ok(result && result.kind !== 'near')
    assert.ok(result.pct >= 1)
  })

  it('impliedValue rounds to whole dollars', () => {
    // 3 × 33_333 = 99_999 → rounded to 99_999 (already integer)
    const comps5 = [90_000, 100_000, 110_000, 120_000, 130_000] // median = 110_000
    // implied = 3 × 33_333 = 99_999 → (99999 - 110000)/110000 ≈ -9.1% (within 10% band)
    const result = computeImpliedValueCheck(33_333, 3, comps5)
    assert.ok(result)
    assert.strictEqual(result.impliedValue, 99_999)
  })
})
