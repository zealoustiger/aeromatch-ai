/**
 * Run: node --experimental-strip-types --test src/lib/alertChipWatcherCounts.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tallyChipWatchers, MIN_CHIP_WATCHERS_TO_SHOW } from './alertChipWatcherTally.ts'

test('counts distinct emails per exact source_path', () => {
  const counts = tallyChipWatchers([
    { email: 'a@example.com', source_path: '/aircraft?make=Cessna&model=172' },
    { email: 'b@example.com', source_path: '/aircraft?make=Cessna&model=172' },
    { email: 'c@example.com', source_path: '/aircraft?make=Cirrus&model=SR22' },
  ])
  assert.equal(counts.get('/aircraft?make=Cessna&model=172'), 2)
  assert.equal(counts.get('/aircraft?make=Cirrus&model=SR22'), 1)
})

test('de-dupes the same pilot case-insensitively / with surrounding whitespace', () => {
  const counts = tallyChipWatchers([
    { email: 'Pilot@Example.com', source_path: '/aircraft?make=Cessna&model=172' },
    { email: '  pilot@example.com ', source_path: '/aircraft?make=Cessna&model=172' },
    { email: 'PILOT@EXAMPLE.COM', source_path: '/aircraft?make=Cessna&model=172' },
  ])
  assert.equal(counts.get('/aircraft?make=Cessna&model=172'), 1)
})

test('exact path match only — different query strings are distinct alerts', () => {
  const counts = tallyChipWatchers([
    { email: 'a@example.com', source_path: '/aircraft?make=Cessna&model=172' },
    { email: 'a@example.com', source_path: '/aircraft?make=Cessna&model=172&state=CA' },
  ])
  assert.equal(counts.get('/aircraft?make=Cessna&model=172'), 1)
  assert.equal(counts.get('/aircraft?make=Cessna&model=172&state=CA'), 1)
})

test('skips rows with a missing/blank email or path (no fabricated bucket)', () => {
  const counts = tallyChipWatchers([
    { email: null, source_path: '/aircraft?make=Cessna&model=172' },
    { email: '   ', source_path: '/aircraft?make=Cessna&model=172' },
    { email: 'a@example.com', source_path: null },
    { email: 'b@example.com', source_path: '/aircraft?make=Cessna&model=172' },
  ])
  assert.equal(counts.get('/aircraft?make=Cessna&model=172'), 1)
  assert.equal(counts.has(''), false)
})

test('empty input yields an empty map', () => {
  assert.equal(tallyChipWatchers([]).size, 0)
})

test('honesty threshold is a real crowd, not a single subscriber', () => {
  // A curated broad-search chip needs more than one person to read as social
  // proof — distinct from the single-listing watch line's floor of 1.
  assert.ok(MIN_CHIP_WATCHERS_TO_SHOW >= 2)
})
