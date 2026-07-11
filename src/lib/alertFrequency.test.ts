/**
 * Run: node --experimental-strip-types --test src/lib/alertFrequency.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { intervalDaysFor, isDigestDue, normalizeFrequency } from './alertFrequency.ts'

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 6, 11) // fixed "now" so the math is deterministic
const nowIso = new Date(NOW).toISOString()
const daysAgo = (d: number) => new Date(NOW - d * DAY_MS).toISOString()

test('normalizeFrequency: "daily" stays daily, anything else falls back to weekly', () => {
  assert.equal(normalizeFrequency('daily'), 'daily')
  assert.equal(normalizeFrequency('weekly'), 'weekly')
  assert.equal(normalizeFrequency(null), 'weekly')
  assert.equal(normalizeFrequency(undefined), 'weekly')
  assert.equal(normalizeFrequency('bogus'), 'weekly')
})

test('intervalDaysFor: daily=1, weekly=7', () => {
  assert.equal(intervalDaysFor('daily'), 1)
  assert.equal(intervalDaysFor('weekly'), 7)
})

test('never sent before (null last_digest_at) → always due, regardless of frequency', () => {
  assert.equal(isDigestDue(null, 'daily', nowIso), true)
  assert.equal(isDigestDue(null, 'weekly', nowIso), true)
})

test('daily alert sent 2 days ago → due', () => {
  assert.equal(isDigestDue(daysAgo(2), 'daily', nowIso), true)
})

test('daily alert sent 12 hours ago → not due', () => {
  const twelveHoursAgo = new Date(NOW - 12 * 60 * 60 * 1000).toISOString()
  assert.equal(isDigestDue(twelveHoursAgo, 'daily', nowIso), false)
})

test('weekly alert sent 2 days ago → not due yet', () => {
  assert.equal(isDigestDue(daysAgo(2), 'weekly', nowIso), false)
})

test('weekly alert sent 8 days ago → due', () => {
  assert.equal(isDigestDue(daysAgo(8), 'weekly', nowIso), true)
})

test('exactly at the interval boundary counts as due', () => {
  assert.equal(isDigestDue(daysAgo(7), 'weekly', nowIso), true)
  assert.equal(isDigestDue(daysAgo(1), 'daily', nowIso), true)
})
