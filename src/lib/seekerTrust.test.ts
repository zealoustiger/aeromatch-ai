/**
 * Worked-example tests for the seeker-listing trust signals.
 * Run: node --experimental-strip-types --test src/lib/seekerTrust.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateSeekerTrust, SEEKER_TRUST_SIGNAL_COUNT } from './seekerTrust.ts'

function makeSeeker(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 'x',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    preferred_makes: null,
    preferred_models: null,
    min_year: null,
    max_year: null,
    aircraft_category: null,
    max_buy_in: null,
    max_monthly: null,
    max_hourly: null,
    home_airport: 'KADS',
    airport_name: null,
    city: null,
    state: null,
    willing_to_travel_nm: null,
    additional_airports: null,
    total_hours: null,
    ratings_held: null,
    preferred_share_types: null,
    intended_use: null,
    hours_per_month: null,
    title: 'Test',
    description: null,
    contact_name: null,
    contact_email: 'a@b.com',
    contact_method: 'platform',
    contact_phone: null,
    status: 'active',
    poster_id: null,
  }
  return { ...base, ...overrides } as unknown as Parameters<typeof evaluateSeekerTrust>[0]
}

test('a bare seed listing scores 0/4', () => {
  const r = evaluateSeekerTrust(makeSeeker())
  assert.equal(r.score, 0)
  assert.ok(r.signals.every((s) => !s.met))
})

test('a fully-disclosed member seeker scores 4/4', () => {
  const r = evaluateSeekerTrust(
    makeSeeker({
      preferred_makes: ['Cessna'],
      max_buy_in: 40000,
      total_hours: 250,
      ratings_held: ['PPL', 'IR'],
      poster_id: 'user-1',
    }),
  )
  assert.equal(r.score, SEEKER_TRUST_SIGNAL_COUNT)
  assert.ok(r.signals.every((s) => s.met))
})

test('aircraft_preference is met by category alone, with no makes/models', () => {
  assert.equal(
    evaluateSeekerTrust(makeSeeker({ aircraft_category: 'sel' })).signals.find((s) => s.key === 'aircraft_preference')?.met,
    true,
  )
  assert.equal(
    evaluateSeekerTrust(makeSeeker()).signals.find((s) => s.key === 'aircraft_preference')?.met,
    false,
  )
})

test('budget_disclosed is met by any one of buy-in / monthly / hourly', () => {
  assert.equal(
    evaluateSeekerTrust(makeSeeker({ max_hourly: 150 })).signals.find((s) => s.key === 'budget_disclosed')?.met,
    true,
  )
  assert.equal(
    evaluateSeekerTrust(makeSeeker()).signals.find((s) => s.key === 'budget_disclosed')?.met,
    false,
  )
})

test('experience_disclosed needs BOTH total_hours and at least one rating', () => {
  assert.equal(
    evaluateSeekerTrust(makeSeeker({ total_hours: 300 })).signals.find((s) => s.key === 'experience_disclosed')?.met,
    false,
  )
  assert.equal(
    evaluateSeekerTrust(makeSeeker({ ratings_held: ['PPL'] })).signals.find((s) => s.key === 'experience_disclosed')?.met,
    false,
  )
  assert.equal(
    evaluateSeekerTrust(makeSeeker({ total_hours: 300, ratings_held: ['PPL'] })).signals.find((s) => s.key === 'experience_disclosed')?.met,
    true,
  )
})

test('member_posted is true only when poster_id is set', () => {
  assert.equal(
    evaluateSeekerTrust(makeSeeker({ poster_id: 'user-1' })).signals.find((s) => s.key === 'member_posted')?.met,
    true,
  )
  assert.equal(
    evaluateSeekerTrust(makeSeeker()).signals.find((s) => s.key === 'member_posted')?.met,
    false,
  )
})
