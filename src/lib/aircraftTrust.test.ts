/**
 * Worked-example tests for the aircraft-for-sale trust signals.
 * Run: node --experimental-strip-types --test src/lib/aircraftTrust.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateAircraftTrust, AIRCRAFT_TRUST_SIGNAL_COUNT } from './aircraftTrust.ts'

// Minimal base; cast through unknown so the test doesn't depend on the @/ alias
// at runtime (the type import in the module is erased by --experimental-strip-types).
function makeAircraft(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 'x',
    created_at: '2026-01-01',
    source: 'barnstormers',
    source_url: 'https://barnstormers.com/x',
    make: null,
    model: null,
    year: null,
    registration: null,
    ttaf: null,
    smoh: null,
    annual_due: null,
    damage_history: null,
    avionics: null,
    engine_type: null,
    title: 'Test',
    description: null,
    asking_price: null,
    price_text: null,
    location: null,
    state: null,
    status: 'active',
    first_seen_at: null,
    last_seen_at: null,
    content_hash: null,
    previous_price: null,
    price_changed_at: null,
    removed_at: null,
    quality_score: null,
  }
  return { ...base, ...overrides } as unknown as Parameters<typeof evaluateAircraftTrust>[0]
}

test('an empty scraped listing scores 0/4', () => {
  const r = evaluateAircraftTrust(makeAircraft())
  assert.equal(r.score, 0)
  assert.ok(r.signals.every((s) => !s.met))
})

test('a fully-complete member listing scores 4/4', () => {
  const r = evaluateAircraftTrust(
    makeAircraft({
      source: 'user',
      make: 'Cessna',
      model: '172',
      year: 2004,
      registration: 'N12345',
      description: 'x'.repeat(120),
      ttaf: 3200,
      smoh: 450,
      asking_price: 185000,
    }),
  )
  assert.equal(r.score, AIRCRAFT_TRUST_SIGNAL_COUNT)
  assert.ok(r.signals.every((s) => s.met))
})

test('member_posted is true only when source === "user"', () => {
  assert.equal(
    evaluateAircraftTrust(makeAircraft({ source: 'user' })).signals.find((s) => s.key === 'member_posted')?.met,
    true,
  )
  assert.equal(
    evaluateAircraftTrust(makeAircraft({ source: 'controller' })).signals.find((s) => s.key === 'member_posted')?.met,
    false,
  )
})

test('a short description does NOT clear complete specs', () => {
  const r = evaluateAircraftTrust(
    makeAircraft({
      make: 'Piper',
      model: 'Archer',
      year: 2001,
      registration: 'N1',
      description: 'too short',
    }),
  )
  assert.equal(r.signals.find((s) => s.key === 'complete_specs')?.met, false)
})

test('maintenance_disclosed needs BOTH ttaf and smoh', () => {
  assert.equal(
    evaluateAircraftTrust(makeAircraft({ ttaf: 3000 })).signals.find((s) => s.key === 'maintenance_disclosed')?.met,
    false,
  )
  assert.equal(
    evaluateAircraftTrust(makeAircraft({ ttaf: 3000, smoh: 400 })).signals.find((s) => s.key === 'maintenance_disclosed')?.met,
    true,
  )
})

test('transparent_price needs a numeric asking_price, not price_text', () => {
  assert.equal(
    evaluateAircraftTrust(makeAircraft({ price_text: 'make offer' })).signals.find((s) => s.key === 'transparent_price')?.met,
    false,
  )
  assert.equal(
    evaluateAircraftTrust(makeAircraft({ asking_price: 99000 })).signals.find((s) => s.key === 'transparent_price')?.met,
    true,
  )
})
