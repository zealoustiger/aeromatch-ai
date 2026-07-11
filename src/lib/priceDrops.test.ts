/**
 * Run: node --experimental-strip-types --test src/lib/priceDrops.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasRecentPriceDrop, priceDropAmount } from './priceDrops.ts'

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 6, 11) // fixed "now" so the math is deterministic
const daysAgo = (d: number) => new Date(NOW - d * DAY_MS).toISOString()

test('genuine drop recorded within the window → true, correct amount', () => {
  const subject = { previous_price: 200_000, asking_price: 180_000, price_changed_at: daysAgo(2) }
  assert.equal(hasRecentPriceDrop(subject, daysAgo(7)), true)
  assert.equal(priceDropAmount(subject), 20_000)
})

test('price INCREASE never counts as a drop, even if recorded in-window', () => {
  const subject = { previous_price: 150_000, asking_price: 160_000, price_changed_at: daysAgo(1) }
  assert.equal(hasRecentPriceDrop(subject, daysAgo(7)), false)
  assert.equal(priceDropAmount(subject), null)
})

test('unchanged price never counts as a drop', () => {
  const subject = { previous_price: 150_000, asking_price: 150_000, price_changed_at: daysAgo(1) }
  assert.equal(hasRecentPriceDrop(subject, daysAgo(7)), false)
  assert.equal(priceDropAmount(subject), null)
})

test('a real drop recorded BEFORE the window → false (not "recent")', () => {
  const subject = { previous_price: 200_000, asking_price: 180_000, price_changed_at: daysAgo(30) }
  assert.equal(hasRecentPriceDrop(subject, daysAgo(7)), false)
  // priceDropAmount is window-agnostic — it still reports the drop happened.
  assert.equal(priceDropAmount(subject), 20_000)
})

test('a drop recorded exactly at the window boundary counts', () => {
  const since = daysAgo(7)
  const subject = { previous_price: 200_000, asking_price: 180_000, price_changed_at: since }
  assert.equal(hasRecentPriceDrop(subject, since), true)
})

test('missing previous_price (brand-new listing, never repriced) → false', () => {
  const subject = { previous_price: null, asking_price: 180_000, price_changed_at: null }
  assert.equal(hasRecentPriceDrop(subject, daysAgo(7)), false)
  assert.equal(priceDropAmount(subject), null)
})

test('missing asking_price → false', () => {
  const subject = { previous_price: 200_000, asking_price: null, price_changed_at: daysAgo(1) }
  assert.equal(hasRecentPriceDrop(subject, daysAgo(7)), false)
  assert.equal(priceDropAmount(subject), null)
})

test('a genuine drop with no price_changed_at recorded (defensive) → false', () => {
  const subject = { previous_price: 200_000, asking_price: 180_000, price_changed_at: null }
  assert.equal(hasRecentPriceDrop(subject, daysAgo(7)), false)
})
