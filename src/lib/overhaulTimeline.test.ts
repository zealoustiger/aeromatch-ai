/**
 * Unit tests for the overhaul-timeline read (remaining hrs ÷ historical hrs/yr → years).
 * Run: node --experimental-strip-types --test src/lib/overhaulTimeline.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeOverhaulTimeline } from './overhaulTimeline.ts'

// --- honesty gating (self-suppress, never project a misleading number) ---

test('returns null when the engine is at or beyond TBO', () => {
  assert.equal(computeOverhaulTimeline({ remainingHours: 0, hoursPerYear: 100 }), null)
  assert.equal(computeOverhaulTimeline({ remainingHours: -200, hoursPerYear: 100 }), null)
})

test('returns null when historical utilization is non-positive', () => {
  assert.equal(computeOverhaulTimeline({ remainingHours: 600, hoursPerYear: 0 }), null)
  assert.equal(computeOverhaulTimeline({ remainingHours: 600, hoursPerYear: -50 }), null)
})

test('returns null on non-finite inputs', () => {
  assert.equal(computeOverhaulTimeline({ remainingHours: NaN, hoursPerYear: 100 }), null)
  assert.equal(computeOverhaulTimeline({ remainingHours: 600, hoursPerYear: Infinity }), null)
})

// --- arithmetic + rounding ---

test('a low-time flyer takes many years; a high-time flyer few', () => {
  // 600 hrs remaining at 50 hrs/yr = 12 years
  const slow = computeOverhaulTimeline({ remainingHours: 600, hoursPerYear: 50 })
  assert.ok(slow)
  assert.equal(slow.yearsToTbo, 12)
  // 600 hrs remaining at 150 hrs/yr = 4 years
  const fast = computeOverhaulTimeline({ remainingHours: 600, hoursPerYear: 150 })
  assert.ok(fast)
  assert.equal(fast.yearsToTbo, 4)
})

test('rounds to the nearest half year', () => {
  // 500 / 150 = 3.33 → 3.5
  const r = computeOverhaulTimeline({ remainingHours: 500, hoursPerYear: 150 })
  assert.ok(r)
  assert.equal(r.yearsToTbo, 3.5)
  // 700 / 300 = 2.33 → 2.5
  const r2 = computeOverhaulTimeline({ remainingHours: 700, hoursPerYear: 300 })
  assert.ok(r2)
  assert.equal(r2.yearsToTbo, 2.5)
})

test('floors at 0.5 years so a nearly-run-out engine never shows 0', () => {
  // 20 / 200 = 0.1 → floored to 0.5
  const r = computeOverhaulTimeline({ remainingHours: 20, hoursPerYear: 200 })
  assert.ok(r)
  assert.equal(r.yearsToTbo, 0.5)
})

test('echoes the inputs back for display', () => {
  const r = computeOverhaulTimeline({ remainingHours: 800, hoursPerYear: 100 })
  assert.ok(r)
  assert.equal(r.remainingHours, 800)
  assert.equal(r.hoursPerYear, 100)
  assert.equal(r.yearsToTbo, 8)
})
