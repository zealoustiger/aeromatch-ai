/**
 * Run: node --experimental-strip-types --test src/lib/dormantEligibility.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isDormancyAgeAndSendEligible, DORMANT_MIN_AGE_MS, DORMANT_MIN_DIGEST_SENDS } from './dormantEligibility.ts'

const DAY_MS = 86_400_000
const NOW = Date.UTC(2026, 6, 19) // fixed "now" so the math is deterministic
const nowIso = new Date(NOW).toISOString()
const daysAgo = (d: number) => new Date(NOW - d * DAY_MS).toISOString()

const BASE = {
  id: 'alert-1',
  email: 'pilot@example.com',
  context: 'Cessna 172 in California',
  unsubscribe_token: 'tok',
  confirmed_at: daysAgo(120),
  created_at: daysAgo(120),
  digest_sends_count: DORMANT_MIN_DIGEST_SENDS,
  repermission_sent_at: null,
}

test('isDormancyAgeAndSendEligible: eligible when old enough, sent enough, never re-permissioned', () => {
  assert.equal(isDormancyAgeAndSendEligible(BASE, nowIso), true)
})

test('isDormancyAgeAndSendEligible: not eligible when confirmed too recently', () => {
  const row = { ...BASE, confirmed_at: daysAgo(10) }
  assert.equal(isDormancyAgeAndSendEligible(row, nowIso), false)
})

test('isDormancyAgeAndSendEligible: exactly at the age threshold is eligible (>=, not >)', () => {
  const row = { ...BASE, confirmed_at: new Date(NOW - DORMANT_MIN_AGE_MS).toISOString() }
  assert.equal(isDormancyAgeAndSendEligible(row, nowIso), true)
})

test('isDormancyAgeAndSendEligible: not eligible when digest_sends_count is below the floor', () => {
  const row = { ...BASE, digest_sends_count: DORMANT_MIN_DIGEST_SENDS - 1 }
  assert.equal(isDormancyAgeAndSendEligible(row, nowIso), false)
})

test('isDormancyAgeAndSendEligible: missing digest_sends_count defaults to 0 (not eligible)', () => {
  const row = { ...BASE, digest_sends_count: undefined }
  assert.equal(isDormancyAgeAndSendEligible(row, nowIso), false)
})

test('isDormancyAgeAndSendEligible: never eligible once repermission_sent_at is set', () => {
  const row = { ...BASE, repermission_sent_at: daysAgo(1) }
  assert.equal(isDormancyAgeAndSendEligible(row, nowIso), false)
})

test('isDormancyAgeAndSendEligible: falls back to created_at when confirmed_at is null', () => {
  const row = { ...BASE, confirmed_at: null, created_at: daysAgo(120) }
  assert.equal(isDormancyAgeAndSendEligible(row, nowIso), true)
  const recent = { ...BASE, confirmed_at: null, created_at: daysAgo(5) }
  assert.equal(isDormancyAgeAndSendEligible(recent, nowIso), false)
})
