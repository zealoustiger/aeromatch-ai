/**
 * Unit tests for the airframe utilization read (TTAF ÷ age → avg hrs/year).
 * Run: node --experimental-strip-types --test src/lib/airframeUsage.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeAirframeUsage } from './airframeUsage.ts'

const NOW = new Date('2026-06-28T00:00:00Z') // age = 2026 − year

// --- honesty gating (self-suppress, never fabricate) ---

test('returns null when ttaf is null', () => {
  assert.equal(computeAirframeUsage({ ttaf: null, year: 2000 }, NOW), null)
})

test('returns null when year is null', () => {
  assert.equal(computeAirframeUsage({ ttaf: 4000, year: null }, NOW), null)
})

test('returns null when ttaf is zero or negative', () => {
  assert.equal(computeAirframeUsage({ ttaf: 0, year: 2000 }, NOW), null)
  assert.equal(computeAirframeUsage({ ttaf: -10, year: 2000 }, NOW), null)
})

test('returns null when age is under a year (current or future model year)', () => {
  assert.equal(computeAirframeUsage({ ttaf: 50, year: 2026 }, NOW), null)
  assert.equal(computeAirframeUsage({ ttaf: 50, year: 2030 }, NOW), null)
})

// --- band classification + arithmetic ---

test('classifies light use as low', () => {
  // 1000 hrs over 50 years = 20 hrs/yr → low
  const r = computeAirframeUsage({ ttaf: 1000, year: 1976 }, NOW)
  assert.ok(r)
  assert.equal(r.ageYears, 50)
  assert.equal(r.hoursPerYear, 20)
  assert.equal(r.band, 'low')
  assert.match(r.detail, /sit/i) // surfaces the sitting-risk downside, not "good"
})

test('classifies normal use as typical', () => {
  // 2000 hrs over 26 years ≈ 77 hrs/yr → typical
  const r = computeAirframeUsage({ ttaf: 2000, year: 2000 }, NOW)
  assert.ok(r)
  assert.equal(r.hoursPerYear, 77)
  assert.equal(r.band, 'typical')
})

test('classifies heavy use as high', () => {
  // 8000 hrs over 40 years = 200 hrs/yr → high
  const r = computeAirframeUsage({ ttaf: 8000, year: 1986 }, NOW)
  assert.ok(r)
  assert.equal(r.hoursPerYear, 200)
  assert.equal(r.band, 'high')
})

test('rounds hours/year and echoes the listing ttaf', () => {
  const r = computeAirframeUsage({ ttaf: 3050, year: 2016 }, NOW)
  assert.ok(r)
  assert.equal(r.ageYears, 10)
  assert.equal(r.hoursPerYear, 305)
  assert.equal(r.ttaf, 3050)
})
