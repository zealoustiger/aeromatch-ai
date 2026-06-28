/**
 * Worked-example tests for the relative days-on-market helper.
 * Run: node --experimental-strip-types --test src/lib/daysOnMarket.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeDaysOnMarketContext, MIN_DOM_COMPS } from './daysOnMarket.ts'

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 5, 28) // fixed "now" so the math is deterministic

// ISO timestamp for a listing first seen `d` whole days before NOW.
const seenDaysAgo = (d: number) => new Date(NOW - d * DAY_MS).toISOString()

test('subject listed longer than every comp → percentile 100, relative "longer"', () => {
  const subject = seenDaysAgo(100)
  const comps = [10, 20, 30, 40, 50].map(seenDaysAgo) // all fresher than 100 days
  const ctx = computeDaysOnMarketContext(subject, comps, NOW)
  assert.ok(ctx)
  assert.equal(ctx!.subjectDays, 100)
  assert.equal(ctx!.compCount, 5)
  assert.equal(ctx!.percentileLongerThan, 100)
  assert.equal(ctx!.relative, 'longer')
})

test('subject fresher than every comp → percentile 0, relative "shorter"', () => {
  const subject = seenDaysAgo(5)
  const comps = [50, 60, 70, 80, 90].map(seenDaysAgo)
  const ctx = computeDaysOnMarketContext(subject, comps, NOW)
  assert.ok(ctx)
  assert.equal(ctx!.percentileLongerThan, 0)
  assert.equal(ctx!.relative, 'shorter')
})

test('subject near the middle → dead band → relative "typical"', () => {
  const subject = seenDaysAgo(50)
  // 5 fresher, 5 staler → 5/10 = 50% → typical (between 40 and 60).
  const comps = [10, 20, 30, 40, 45, 60, 70, 80, 90, 100].map(seenDaysAgo)
  const ctx = computeDaysOnMarketContext(subject, comps, NOW)
  assert.ok(ctx)
  assert.equal(ctx!.compCount, 10)
  assert.equal(ctx!.percentileLongerThan, 50)
  assert.equal(ctx!.relative, 'typical')
})

test('percentile is rounded to the nearest 5 (no false precision)', () => {
  const subject = seenDaysAgo(50)
  // 3 of 7 comps fresher → 3/7 = 42.857% → rounds to 45.
  const comps = [10, 20, 30, 60, 70, 80, 90].map(seenDaysAgo)
  const ctx = computeDaysOnMarketContext(subject, comps, NOW)
  assert.ok(ctx)
  assert.equal(ctx!.percentileLongerThan, 45)
  assert.equal(ctx!.relative, 'typical')
})

test('honesty floor — fewer than MIN_DOM_COMPS usable comps → null', () => {
  assert.equal(MIN_DOM_COMPS, 5)
  const subject = seenDaysAgo(100)
  const comps = [10, 20, 30, 40].map(seenDaysAgo) // only 4
  assert.equal(computeDaysOnMarketContext(subject, comps, NOW), null)
})

test('null / unparseable comp dates are dropped before the floor check', () => {
  const subject = seenDaysAgo(100)
  // 3 valid + 2 junk → only 3 usable → below the floor → null.
  const comps = [seenDaysAgo(10), null, seenDaysAgo(20), 'not-a-date', seenDaysAgo(30)]
  assert.equal(computeDaysOnMarketContext(subject, comps, NOW), null)
})

test('exactly MIN_DOM_COMPS usable comps (with nulls mixed in) is enough', () => {
  const subject = seenDaysAgo(100)
  const comps = [seenDaysAgo(10), seenDaysAgo(20), seenDaysAgo(30), seenDaysAgo(40), seenDaysAgo(50), null, null]
  const ctx = computeDaysOnMarketContext(subject, comps, NOW)
  assert.ok(ctx)
  assert.equal(ctx!.compCount, 5)
  assert.equal(ctx!.percentileLongerThan, 100)
})

test('missing subject first_seen → null', () => {
  assert.equal(computeDaysOnMarketContext(null, [seenDaysAgo(1), seenDaysAgo(2)], NOW), null)
})

test('unparseable subject first_seen → null', () => {
  assert.equal(computeDaysOnMarketContext('garbage', [seenDaysAgo(1)], NOW), null)
})
