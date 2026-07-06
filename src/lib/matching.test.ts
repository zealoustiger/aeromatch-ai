/**
 * Worked-example tests for the seeker↔partnership compatibility check.
 * Run: node --experimental-strip-types --test src/lib/matching.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isCompatibleMatch } from './matching.ts'
import type { Partnership, PartnershipSeeker } from './types.ts'

function seeker(overrides: Partial<PartnershipSeeker> = {}): PartnershipSeeker {
  return {
    id: 's1',
    created_at: '',
    updated_at: '',
    preferred_makes: null,
    preferred_models: null,
    min_year: null,
    max_year: null,
    aircraft_category: null,
    max_buy_in: null,
    max_monthly: null,
    max_hourly: null,
    home_airport: 'KAUS',
    airport_name: null,
    city: null,
    state: null,
    willing_to_travel_nm: null,
    total_hours: null,
    ratings_held: null,
    preferred_share_types: null,
    intended_use: null,
    hours_per_month: null,
    title: '',
    description: null,
    contact_name: null,
    contact_email: 'a@example.com',
    contact_method: 'email',
    contact_phone: null,
    status: 'active',
    poster_id: null,
    ...overrides,
  }
}

function partnership(overrides: Partial<Partnership> = {}): Partnership {
  return {
    id: 'p1',
    created_at: '',
    updated_at: '',
    make: 'Cessna',
    model: '172',
    year: null,
    registration: null,
    home_airport: 'KAUS',
    airport_name: null,
    city: null,
    state: null,
    lat: null,
    lng: null,
    share_type: '1/3',
    shares_available: 1,
    total_shares: 3,
    buy_in_price: 20000,
    previous_buy_in_price: null,
    buy_in_price_changed_at: null,
    monthly_fixed: 300,
    hourly_wet: 120,
    min_hours: null,
    ratings_required: null,
    scheduling_system: null,
    title: '',
    description: null,
    images: null,
    source_url: null,
    image_is_placeholder: null,
    posted_at: null,
    contact_name: null,
    contact_email: 'b@example.com',
    contact_method: 'email',
    contact_phone: null,
    ttaf: null,
    smoh: null,
    engine_type: null,
    annual_due: null,
    damage_history: null,
    status: 'active',
    poster_id: null,
    ...overrides,
  }
}

test('no stated preferences on either side is a match (nothing to disqualify it)', () => {
  assert.equal(isCompatibleMatch(seeker(), partnership()), true)
})

test('make mismatch disqualifies', () => {
  assert.equal(
    isCompatibleMatch(seeker({ preferred_makes: ['Piper'] }), partnership({ make: 'Cessna' })),
    false
  )
})

test('make match (case-insensitive) passes', () => {
  assert.equal(
    isCompatibleMatch(seeker({ preferred_makes: ['cessna'] }), partnership({ make: 'Cessna' })),
    true
  )
})

test('over-budget buy-in disqualifies', () => {
  assert.equal(
    isCompatibleMatch(seeker({ max_buy_in: 10000 }), partnership({ buy_in_price: 20000 })),
    false
  )
})

test('missing budget data on either side never disqualifies (honesty gate)', () => {
  assert.equal(
    isCompatibleMatch(seeker({ max_buy_in: null }), partnership({ buy_in_price: 999999 })),
    true
  )
  assert.equal(
    isCompatibleMatch(seeker({ max_buy_in: 5000 }), partnership({ buy_in_price: null })),
    true
  )
})

test('seeker below the required minimum hours disqualifies', () => {
  assert.equal(
    isCompatibleMatch(seeker({ total_hours: 50 }), partnership({ min_hours: 100 })),
    false
  )
})

test('seeker missing a required rating disqualifies', () => {
  assert.equal(
    isCompatibleMatch(
      seeker({ ratings_held: ['PPL'] }),
      partnership({ ratings_required: ['PPL', 'IFR'] })
    ),
    false
  )
})

test('seeker ratings undisclosed never disqualifies (honesty gate)', () => {
  assert.equal(
    isCompatibleMatch(
      seeker({ ratings_held: null }),
      partnership({ ratings_required: ['PPL', 'IFR'] })
    ),
    true
  )
})

test('share-type preference must overlap when stated', () => {
  assert.equal(
    isCompatibleMatch(
      seeker({ preferred_share_types: ['1/2'] }),
      partnership({ share_type: '1/3' })
    ),
    false
  )
  assert.equal(
    isCompatibleMatch(
      seeker({ preferred_share_types: ['1/2', '1/3'] }),
      partnership({ share_type: '1/3' })
    ),
    true
  )
})
