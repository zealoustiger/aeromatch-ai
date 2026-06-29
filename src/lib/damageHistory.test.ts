/**
 * Unit tests for the damage-history buyer read (damage_history → buyer signal).
 * Run: node --experimental-strip-types --test src/lib/damageHistory.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeDamageHistory } from './damageHistory.ts'

// --- honesty gating (self-suppress, never infer from a missing flag) ---

test('returns null for null/undefined (unknown — never assert "no damage")', () => {
  assert.equal(computeDamageHistory(null), null)
  assert.equal(computeDamageHistory(undefined), null)
})

test('only a real boolean produces a read', () => {
  // Guard against truthy/falsy non-booleans being treated as a state.
  assert.equal(computeDamageHistory('false' as unknown as boolean), null)
  assert.equal(computeDamageHistory(0 as unknown as boolean), null)
})

// --- clean (false) ---

test('false → a "none reported" clean read, with verify-in-logbooks copy', () => {
  const r = computeDamageHistory(false)
  assert.ok(r)
  assert.equal(r.state, 'clean')
  assert.equal(r.label, 'None reported')
  assert.match(r.headline, /no damage history reported/i)
  // honest framing: it's the listing/seller's claim, to be confirmed
  assert.match(r.detail, /pre-buy|logbook/i)
})

// --- reported (true) ---

test('true → a "reported" read, calm + actionable, no fabricated cost', () => {
  const r = computeDamageHistory(true)
  assert.ok(r)
  assert.equal(r.state, 'reported')
  assert.equal(r.label, 'Reported')
  assert.match(r.headline, /prior damage reported/i)
  assert.match(r.detail, /repair records|337|pre-buy/i)
  // honesty floor: never invent a dollar figure from a boolean
  assert.doesNotMatch(r.detail, /\$\s?\d/)
})
