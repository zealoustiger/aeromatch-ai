/**
 * Run: node --experimental-strip-types --test src/lib/alertSubscriberMatch.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parsePartnershipAlertSourcePath,
  matchesPartnershipListing,
  type PartnershipListingFields,
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
