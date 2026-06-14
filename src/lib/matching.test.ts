/**
 * Unit tests for the pure matching engine.
 *
 * No test framework is installed (and the task forbids dependency bumps), so this
 * runs on Node's built-in test runner with native TypeScript stripping:
 *
 *     node --experimental-strip-types --test src/lib/matching.test.ts
 *
 * (Node 22.6+. The matching module has no runtime imports — the only import is a
 *  type-only import that strips cleanly — so this needs no loader or build step.)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreMatch, haversineNm, DEFAULT_TRAVEL_NM, type AirportCoords } from './matching.ts'

// Minimal fixtures — only the fields the engine reads matter; the rest are filler.
function makePartnership(over: Record<string, unknown> = {}): any {
  return {
    id: 'p1',
    make: 'Cessna',
    model: '172S Skyhawk',
    home_airport: 'KAUS',
    share_type: '1/3',
    buy_in_price: 18000,
    monthly_fixed: 320,
    hourly_wet: 85,
    min_hours: 150,
    ratings_required: ['PPL'],
    description: 'Great IFR cross country machine, G1000 glass.',
    ...over,
  }
}

function makeSeeker(over: Record<string, unknown> = {}): any {
  return {
    id: 's1',
    home_airport: 'KAUS',
    willing_to_travel_nm: 50,
    total_hours: 300,
    ratings_held: ['PPL', 'IFR'],
    max_buy_in: 25000,
    max_monthly: 500,
    max_hourly: 120,
    preferred_makes: ['Cessna'],
    preferred_models: '172, 182',
    preferred_share_types: ['1/3'],
    intended_use: ['cross_country'],
    ...over,
  }
}

// KAUS ≈ (30.1975, -97.6664); KADS ≈ (32.9686, -96.8364) — ~196nm apart.
const coords: AirportCoords = {
  KAUS: { lat: 30.1975, lng: -97.6664 },
  KADS: { lat: 32.9686, lng: -96.8364 },
}

test('haversine: same point is zero, KAUS↔KADS is ~170nm', () => {
  assert.equal(Math.round(haversineNm(30, -97, 30, -97)), 0)
  const d = haversineNm(30.1975, -97.6664, 32.9686, -96.8364)
  assert.ok(d > 160 && d < 185, `expected ~172nm, got ${d}`)
})

test('a fully-aligned local pair qualifies with a high score', () => {
  const r = scoreMatch(makeSeeker(), makePartnership(), coords)
  assert.equal(r.qualified, true)
  assert.ok(r.score >= 90, `expected >=90, got ${r.score}`)
  assert.ok(r.reasons.length >= 3)
  assert.equal(r.blockers.length, 0)
})

test('missing required rating blocks qualification but still returns a score', () => {
  const r = scoreMatch(makeSeeker({ ratings_held: ['PPL'] }), makePartnership({ ratings_required: ['PPL', 'IFR'] }), coords)
  assert.equal(r.qualified, false)
  assert.ok(r.blockers.some((b) => b.toLowerCase().includes('ifr')))
  assert.equal(typeof r.score, 'number')
})

test('insufficient hours blocks qualification', () => {
  const r = scoreMatch(makeSeeker({ total_hours: 80 }), makePartnership({ min_hours: 150 }), coords)
  assert.equal(r.qualified, false)
  assert.ok(r.blockers.some((b) => b.includes('150')))
})

test('out-of-range distance blocks on geo', () => {
  // Seeker at KAUS, partnership at KADS (~196nm), only willing to travel 50nm.
  const r = scoreMatch(makeSeeker({ willing_to_travel_nm: 50 }), makePartnership({ home_airport: 'KADS' }), coords)
  assert.equal(r.qualified, false)
  assert.ok(r.blockers.some((b) => b.includes('nm')))
})

test('over-budget beyond 15% scores zero on that dimension; within 15% gets partial credit', () => {
  const under = scoreMatch(makeSeeker({ max_buy_in: 20000 }), makePartnership({ buy_in_price: 18000 }), coords)
  const partial = scoreMatch(makeSeeker({ max_buy_in: 20000 }), makePartnership({ buy_in_price: 22000 }), coords) // 10% over
  const over = scoreMatch(makeSeeker({ max_buy_in: 20000 }), makePartnership({ buy_in_price: 30000 }), coords) // 50% over
  assert.ok(under.score > partial.score, 'under-budget should beat 10%-over')
  assert.ok(partial.score > over.score, '10%-over should beat 50%-over')
})

test('unknown airport coords soften geo (no crash, no geo gate)', () => {
  const r = scoreMatch(makeSeeker({ home_airport: 'ZZZZ' }), makePartnership({ home_airport: 'YYYY' }), coords)
  // Geo cannot be computed → it neither blocks nor contributes; pair can still qualify.
  assert.equal(r.qualified, true)
  assert.equal(typeof r.score, 'number')
})

test('default travel radius applies when seeker leaves it null', () => {
  const r = scoreMatch(makeSeeker({ willing_to_travel_nm: null }), makePartnership(), coords)
  assert.equal(r.qualified, true)
  // sanity: the constant is exported and used
  assert.equal(DEFAULT_TRAVEL_NM, 50)
})
