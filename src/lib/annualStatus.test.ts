/**
 * Unit tests for the annual-inspection status read (annual_due → buyer signal).
 * Run: node --experimental-strip-types --test src/lib/annualStatus.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeAnnualStatus } from './annualStatus.ts'

const NOW = new Date('2026-06-28T00:00:00Z') // June 2026

// --- honesty gating (self-suppress, never fabricate) ---

test('returns null for null/undefined', () => {
  assert.equal(computeAnnualStatus(null, NOW), null)
  assert.equal(computeAnnualStatus(undefined, NOW), null)
})

test('returns null for unparseable free text', () => {
  assert.equal(computeAnnualStatus('current', NOW), null)
  assert.equal(computeAnnualStatus('November 2025', NOW), null) // not the normalized form
  assert.equal(computeAnnualStatus('2025-13-01', NOW), null) // invalid month
})

test('returns null for implausibly far-out dates (likely stale/mis-parsed)', () => {
  assert.equal(computeAnnualStatus('2030-01-01', NOW), null) // > 15 months ahead
  assert.equal(computeAnnualStatus('2020-01-01', NOW), null) // > 36 months past
})

// --- the three states ---

test('future due → current with months remaining', () => {
  const r = computeAnnualStatus('2026-11-01', NOW)
  assert.ok(r)
  assert.equal(r.state, 'current')
  assert.equal(r.monthsFromNow, 5)
  assert.equal(r.dueLabel, 'Nov 2026')
  assert.match(r.headline, /current through Nov 2026/)
})

test('due this month → soon', () => {
  const r = computeAnnualStatus('2026-06-01', NOW)
  assert.ok(r)
  assert.equal(r.state, 'soon')
  assert.equal(r.monthsFromNow, 0)
  assert.match(r.headline, /this month/)
})

test('due next month → soon', () => {
  const r = computeAnnualStatus('2026-07-01', NOW)
  assert.ok(r)
  assert.equal(r.state, 'soon')
  assert.match(r.headline, /next month/)
})

test('past due → overdue with months-ago, no grounded assertion', () => {
  const r = computeAnnualStatus('2026-03-01', NOW)
  assert.ok(r)
  assert.equal(r.state, 'overdue')
  assert.equal(r.monthsFromNow, -3)
  assert.match(r.detail, /about 3 months ago/)
  assert.match(r.detail, /confirm/)
})

test('accepts bare YYYY-MM form', () => {
  const r = computeAnnualStatus('2026-11', NOW)
  assert.ok(r)
  assert.equal(r.dueLabel, 'Nov 2026')
})
