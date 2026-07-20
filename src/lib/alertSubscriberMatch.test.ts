/**
 * Run: node --experimental-strip-types --test src/lib/alertSubscriberMatch.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parsePartnershipAlertSourcePath,
  matchesPartnershipListing,
  parseAircraftAlertSourcePath,
  matchesAircraftListing,
  parseSeekerAlertSourcePath,
  matchesSeekerListing,
  type PartnershipListingFields,
  type AircraftListingFields,
  type SeekerListingFields,
} from './alertSubscriberMatch.ts'

test('parsePartnershipAlertSourcePath: null/empty resolves like the homepage ("all")', () => {
  assert.deepEqual(parsePartnershipAlertSourcePath(null), { kind: 'all' })
  assert.deepEqual(parsePartnershipAlertSourcePath(undefined), { kind: 'all' })
  assert.deepEqual(parsePartnershipAlertSourcePath(''), { kind: 'all' })
})

test('parsePartnershipAlertSourcePath: homepage is an "all" alert', () => {
  assert.deepEqual(parsePartnershipAlertSourcePath('/'), { kind: 'all' })
})

test('parsePartnershipAlertSourcePath: bare /partnerships has no filter', () => {
  assert.deepEqual(parsePartnershipAlertSourcePath('/partnerships'), { kind: 'partnership', target: {} })
})

test('parsePartnershipAlertSourcePath: query-string shape', () => {
  const parsed = parsePartnershipAlertSourcePath('/partnerships?make=Cessna&model=172&state=ca&airport=khwd')
  assert.deepEqual(parsed, {
    kind: 'partnership',
    target: { make: 'Cessna', model: '172', state: 'CA', icao: 'KHWD', radius: undefined },
  })
})

test('parsePartnershipAlertSourcePath: query-string with radius', () => {
  const parsed = parsePartnershipAlertSourcePath('/partnerships?airport=khwd&radius=50')
  assert.deepEqual(parsed, {
    kind: 'partnership',
    target: { make: undefined, model: undefined, state: undefined, icao: 'KHWD', radius: 50 },
  })
})

test('parsePartnershipAlertSourcePath: /partnerships/near/[icao]', () => {
  assert.deepEqual(parsePartnershipAlertSourcePath('/partnerships/near/khwd'), {
    kind: 'partnership',
    target: { icao: 'KHWD' },
  })
})

test('parsePartnershipAlertSourcePath: /partnerships/make/[slug] resolves a curated make', () => {
  const parsed = parsePartnershipAlertSourcePath('/partnerships/make/cessna')
  assert.equal(parsed?.kind, 'partnership')
  assert.equal((parsed as { target: { make?: string } }).target.make, 'Cessna')
})

test('parsePartnershipAlertSourcePath: /partnerships/make/[slug] unknown slug -> null', () => {
  assert.equal(parsePartnershipAlertSourcePath('/partnerships/make/not-a-real-make'), null)
})

test('parsePartnershipAlertSourcePath: /partnerships/state/[xx]', () => {
  assert.deepEqual(parsePartnershipAlertSourcePath('/partnerships/state/ca'), {
    kind: 'partnership',
    target: { state: 'CA' },
  })
})

test('parsePartnershipAlertSourcePath: /partnerships/state/[xx] is not validated against a real-state list (harmless — never matches a real listing.state)', () => {
  assert.deepEqual(parsePartnershipAlertSourcePath('/partnerships/state/zz'), {
    kind: 'partnership',
    target: { state: 'ZZ' },
  })
})

test('parsePartnershipAlertSourcePath: aircraft/seeker paths are not partnership-relevant', () => {
  assert.equal(parsePartnershipAlertSourcePath('/aircraft?make=Cessna'), null)
  assert.equal(parsePartnershipAlertSourcePath('/partnerships/seeking'), null)
})

const LISTING: PartnershipListingFields = {
  make: 'Cessna',
  model: '172',
  state: 'CA',
  home_airport: 'KHWD',
}

test('matchesPartnershipListing: empty target matches anything', () => {
  assert.equal(matchesPartnershipListing({}, LISTING), true)
})

test('matchesPartnershipListing: make is a case-insensitive substring match', () => {
  assert.equal(matchesPartnershipListing({ make: 'cessna' }, LISTING), true)
  assert.equal(matchesPartnershipListing({ make: 'Piper' }, LISTING), false)
})

test('matchesPartnershipListing: model is exact multi-select', () => {
  assert.equal(matchesPartnershipListing({ model: '172' }, LISTING), true)
  assert.equal(matchesPartnershipListing({ model: '150,172,182' }, LISTING), true)
  assert.equal(matchesPartnershipListing({ model: '182' }, LISTING), false)
})

test('matchesPartnershipListing: state is exact', () => {
  assert.equal(matchesPartnershipListing({ state: 'CA' }, LISTING), true)
  assert.equal(matchesPartnershipListing({ state: 'TX' }, LISTING), false)
})

test('matchesPartnershipListing: icao checked against the resolved list', () => {
  assert.equal(matchesPartnershipListing({ icao: 'KHWD' }, LISTING), true)
  assert.equal(matchesPartnershipListing({ icao: 'KOAK' }, LISTING, ['KOAK', 'KHWD']), true)
  assert.equal(matchesPartnershipListing({ icao: 'KOAK' }, LISTING, ['KOAK', 'KSQL']), false)
})

test('matchesPartnershipListing: icao with no home_airport on the listing never matches', () => {
  assert.equal(matchesPartnershipListing({ icao: 'KHWD' }, { ...LISTING, home_airport: null }), false)
})

test('matchesPartnershipListing: combined criteria all must hold', () => {
  assert.equal(matchesPartnershipListing({ make: 'Cessna', model: '172', state: 'CA' }, LISTING), true)
  assert.equal(matchesPartnershipListing({ make: 'Cessna', model: '172', state: 'TX' }, LISTING), false)
})

// ─── Aircraft reverse-match ─────────────────────────────────────────────────

test('parseAircraftAlertSourcePath: null/empty/homepage resolves to "all"', () => {
  assert.deepEqual(parseAircraftAlertSourcePath(null), { kind: 'all' })
  assert.deepEqual(parseAircraftAlertSourcePath(undefined), { kind: 'all' })
  assert.deepEqual(parseAircraftAlertSourcePath(''), { kind: 'all' })
  assert.deepEqual(parseAircraftAlertSourcePath('/'), { kind: 'all' })
})

test('parseAircraftAlertSourcePath: bare /aircraft has no filter', () => {
  assert.deepEqual(parseAircraftAlertSourcePath('/aircraft'), { kind: 'aircraft', target: {} })
})

test('parseAircraftAlertSourcePath: query-string shape', () => {
  const parsed = parseAircraftAlertSourcePath(
    '/aircraft?make=Cessna&model=172&state=ca&airport=khwd&min_price=50000&max_price=150000&min_year=1980&max_year=2010&min_tt=0&max_tt=3000'
  )
  assert.deepEqual(parsed, {
    kind: 'aircraft',
    target: {
      make: 'Cessna',
      model: '172',
      state: 'CA',
      icao: 'KHWD',
      minPrice: 50000,
      maxPrice: 150000,
      minYear: 1980,
      maxYear: 2010,
      minTt: 0,
      maxTt: 3000,
    },
  })
})

test('parseAircraftAlertSourcePath: /aircraft/for-sale/[state]', () => {
  assert.deepEqual(parseAircraftAlertSourcePath('/aircraft/for-sale/california'), {
    kind: 'aircraft',
    target: { state: 'CA' },
  })
  assert.equal(parseAircraftAlertSourcePath('/aircraft/for-sale/not-a-real-state'), null)
})

test('parseAircraftAlertSourcePath: /aircraft/[make] resolves a curated make', () => {
  const parsed = parseAircraftAlertSourcePath('/aircraft/cessna')
  assert.equal(parsed?.kind, 'aircraft')
  assert.equal((parsed as { target: { make?: string } }).target.make, 'Cessna')
})

test('parseAircraftAlertSourcePath: /aircraft/[make] unknown slug -> null', () => {
  assert.equal(parseAircraftAlertSourcePath('/aircraft/not-a-real-make'), null)
})

test('parseAircraftAlertSourcePath: /aircraft/[make]/[model] resolves make + model prefix', () => {
  assert.deepEqual(parseAircraftAlertSourcePath('/aircraft/cessna/172'), {
    kind: 'aircraft',
    target: { make: 'Cessna', modelPattern: '172%' },
  })
  assert.equal(parseAircraftAlertSourcePath('/aircraft/not-a-real-make/172'), null)
})

test('parseAircraftAlertSourcePath: partnership/seeker paths are not aircraft-relevant', () => {
  assert.equal(parseAircraftAlertSourcePath('/partnerships?make=Cessna'), null)
  assert.equal(parseAircraftAlertSourcePath('/partnerships/seeking'), null)
})

test('parseAircraftAlertSourcePath: single-listing watch path is not a family match', () => {
  assert.equal(parseAircraftAlertSourcePath('/aircraft/listing/abc123?watch=price'), null)
})

const AIRCRAFT_LISTING: AircraftListingFields = {
  make: 'Cessna',
  model: '172',
  state: 'CA',
  asking_price: 95000,
  year: 1998,
  ttaf: 1200,
}

test('matchesAircraftListing: empty target matches anything', () => {
  assert.equal(matchesAircraftListing({}, AIRCRAFT_LISTING), true)
})

test('matchesAircraftListing: make is a case-insensitive substring match', () => {
  assert.equal(matchesAircraftListing({ make: 'cessna' }, AIRCRAFT_LISTING), true)
  assert.equal(matchesAircraftListing({ make: 'Piper' }, AIRCRAFT_LISTING), false)
})

test('matchesAircraftListing: model is exact', () => {
  assert.equal(matchesAircraftListing({ model: '172' }, AIRCRAFT_LISTING), true)
  assert.equal(matchesAircraftListing({ model: '182' }, AIRCRAFT_LISTING), false)
})

test('matchesAircraftListing: modelPattern is a prefix match', () => {
  assert.equal(matchesAircraftListing({ modelPattern: '172%' }, AIRCRAFT_LISTING), true)
  assert.equal(matchesAircraftListing({ modelPattern: '172R%' }, AIRCRAFT_LISTING), false)
})

test('matchesAircraftListing: state is exact', () => {
  assert.equal(matchesAircraftListing({ state: 'CA' }, AIRCRAFT_LISTING), true)
  assert.equal(matchesAircraftListing({ state: 'TX' }, AIRCRAFT_LISTING), false)
})

test('matchesAircraftListing: icao is checked against the resolved airport state', () => {
  assert.equal(matchesAircraftListing({ icao: 'KHWD' }, AIRCRAFT_LISTING, 'CA'), true)
  assert.equal(matchesAircraftListing({ icao: 'KHWD' }, AIRCRAFT_LISTING, 'TX'), false)
  assert.equal(matchesAircraftListing({ icao: 'KHWD' }, AIRCRAFT_LISTING, null), false)
})

test('matchesAircraftListing: price/year/hours ranges', () => {
  assert.equal(matchesAircraftListing({ minPrice: 90000, maxPrice: 100000 }, AIRCRAFT_LISTING), true)
  assert.equal(matchesAircraftListing({ minPrice: 100000 }, AIRCRAFT_LISTING), false)
  assert.equal(matchesAircraftListing({ minYear: 1990, maxYear: 2000 }, AIRCRAFT_LISTING), true)
  assert.equal(matchesAircraftListing({ maxYear: 1990 }, AIRCRAFT_LISTING), false)
  assert.equal(matchesAircraftListing({ minTt: 0, maxTt: 2000 }, AIRCRAFT_LISTING), true)
  assert.equal(matchesAircraftListing({ maxTt: 1000 }, AIRCRAFT_LISTING), false)
})

test('matchesAircraftListing: a null bounded field never matches a range filter on it (mirrors Postgres NULL semantics)', () => {
  const noPrice = { ...AIRCRAFT_LISTING, asking_price: null }
  assert.equal(matchesAircraftListing({ minPrice: 0 }, noPrice), false)
  assert.equal(matchesAircraftListing({ maxPrice: 1_000_000 }, noPrice), false)
})

test('matchesAircraftListing: combined criteria all must hold', () => {
  assert.equal(matchesAircraftListing({ make: 'Cessna', modelPattern: '172%', state: 'CA' }, AIRCRAFT_LISTING), true)
  assert.equal(matchesAircraftListing({ make: 'Cessna', modelPattern: '172%', state: 'TX' }, AIRCRAFT_LISTING), false)
})

// ─── Seeker reverse-match ───────────────────────────────────────────────────

test('parseSeekerAlertSourcePath: null/empty/homepage all resolve to null (unlike partnership/aircraft, "all" never matches a seeker)', () => {
  assert.equal(parseSeekerAlertSourcePath(null), null)
  assert.equal(parseSeekerAlertSourcePath(undefined), null)
  assert.equal(parseSeekerAlertSourcePath(''), null)
  assert.equal(parseSeekerAlertSourcePath('/'), null)
})

test('parseSeekerAlertSourcePath: bare /partnerships/seeking has no filter', () => {
  assert.deepEqual(parseSeekerAlertSourcePath('/partnerships/seeking'), { kind: 'seeker', target: {} })
})

test('parseSeekerAlertSourcePath: query-string shape', () => {
  const parsed = parseSeekerAlertSourcePath('/partnerships/seeking?make=Cessna&model=172&state=ca&airport=khwd')
  assert.deepEqual(parsed, {
    kind: 'seeker',
    target: { make: 'Cessna', model: '172', state: 'CA', icao: 'KHWD' },
  })
})

test('parseSeekerAlertSourcePath: aircraft/partnership paths are not seeker-relevant', () => {
  assert.equal(parseSeekerAlertSourcePath('/aircraft?make=Cessna'), null)
  assert.equal(parseSeekerAlertSourcePath('/partnerships'), null)
  assert.equal(parseSeekerAlertSourcePath('/partnerships/make/cessna'), null)
})

const SEEKER_LISTING: SeekerListingFields = {
  preferred_makes: ['Cessna', 'Piper'],
  preferred_models: '172, 182',
  state: 'CA',
  home_airport: 'KHWD',
  additional_airports: ['KOAK'],
}

test('matchesSeekerListing: empty target matches anything', () => {
  assert.equal(matchesSeekerListing({}, SEEKER_LISTING), true)
})

test('matchesSeekerListing: make is case-insensitive array membership, not substring', () => {
  assert.equal(matchesSeekerListing({ make: 'cessna' }, SEEKER_LISTING), true)
  assert.equal(matchesSeekerListing({ make: 'Beechcraft' }, SEEKER_LISTING), false)
  assert.equal(matchesSeekerListing({ make: 'Cess' }, SEEKER_LISTING), false)
})

test('matchesSeekerListing: model is a free-text token match, case-insensitive, exact token', () => {
  assert.equal(matchesSeekerListing({ model: '172' }, SEEKER_LISTING), true)
  assert.equal(matchesSeekerListing({ model: '150,172' }, SEEKER_LISTING), true)
  assert.equal(matchesSeekerListing({ model: '150' }, SEEKER_LISTING), false)
  assert.equal(matchesSeekerListing({ model: '17' }, SEEKER_LISTING), false)
})

test('matchesSeekerListing: model filter never matches an empty preferred_models', () => {
  assert.equal(matchesSeekerListing({ model: '172' }, { ...SEEKER_LISTING, preferred_models: null }), false)
})

test('matchesSeekerListing: state is exact', () => {
  assert.equal(matchesSeekerListing({ state: 'CA' }, SEEKER_LISTING), true)
  assert.equal(matchesSeekerListing({ state: 'TX' }, SEEKER_LISTING), false)
})

test('matchesSeekerListing: icao matches home_airport OR additional_airports', () => {
  assert.equal(matchesSeekerListing({ icao: 'KHWD' }, SEEKER_LISTING), true)
  assert.equal(matchesSeekerListing({ icao: 'KOAK' }, SEEKER_LISTING), true)
  assert.equal(matchesSeekerListing({ icao: 'KSQL' }, SEEKER_LISTING), false)
})

test('matchesSeekerListing: icao with no home_airport/additional_airports never matches', () => {
  assert.equal(
    matchesSeekerListing({ icao: 'KHWD' }, { ...SEEKER_LISTING, home_airport: null, additional_airports: null }),
    false
  )
})

test('matchesSeekerListing: combined criteria all must hold', () => {
  assert.equal(matchesSeekerListing({ make: 'Cessna', model: '172', state: 'CA' }, SEEKER_LISTING), true)
  assert.equal(matchesSeekerListing({ make: 'Cessna', model: '172', state: 'TX' }, SEEKER_LISTING), false)
})
