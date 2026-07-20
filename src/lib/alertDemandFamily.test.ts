/**
 * Run: node --experimental-strip-types --test src/lib/alertDemandFamily.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { familyForSourcePath, type DemandFamilyEntry } from './alertDemandFamily.ts'

// Small fixture, deliberately not the real SEO_MAKE_MODELS list (this module
// takes the curated list as a parameter — see the DI precedent in its header
// comment), so these tests never break when the real curated list changes.
const FIXTURE: DemandFamilyEntry[] = [
  { makeSlug: 'cessna', modelSlug: '172', make: 'Cessna', model: '172', modelPattern: '172%' },
  { makeSlug: 'mooney', modelSlug: 'm20', make: 'Mooney', model: 'M20', modelPattern: 'm20%' },
  {
    makeSlug: 'cirrus',
    modelSlug: 'sr22',
    make: 'Cirrus',
    model: 'SR22',
    modelPattern: 'sr22%',
    notModelPattern: 'sr22t%',
  },
]

test('familyForSourcePath: null/empty -> null', () => {
  assert.equal(familyForSourcePath(null, FIXTURE), null)
  assert.equal(familyForSourcePath(undefined, FIXTURE), null)
  assert.equal(familyForSourcePath('', FIXTURE), null)
})

test('familyForSourcePath: curated make+model path segment', () => {
  const fam = familyForSourcePath('/aircraft/cessna/172', FIXTURE)
  assert.ok(fam)
  assert.equal(fam?.key, 'cessna/172')
  assert.equal(fam?.label, 'Cessna 172')
  assert.equal(fam?.make, 'Cessna')
  assert.equal(fam?.modelPattern, '172%')
})

test('familyForSourcePath: curated make+model+state path segment resolves the same family', () => {
  const fam = familyForSourcePath('/aircraft/mooney/m20/ca', FIXTURE)
  assert.ok(fam)
  assert.equal(fam?.key, 'mooney/m20')
  assert.equal(fam?.label, 'Mooney M20')
})

test('familyForSourcePath: uncurated make+model path segment -> null', () => {
  assert.equal(familyForSourcePath('/aircraft/cessna/not-a-real-model', FIXTURE), null)
})

test('familyForSourcePath: make-only path segment -> null', () => {
  assert.equal(familyForSourcePath('/aircraft/cessna', FIXTURE), null)
})

test('familyForSourcePath: curated make+model query string', () => {
  const fam = familyForSourcePath('/aircraft?make=Cessna&model=172', FIXTURE)
  assert.ok(fam)
  assert.equal(fam?.key, 'cessna/172')
  assert.equal(fam?.label, 'Cessna 172')
})

test('familyForSourcePath: query string missing model -> null', () => {
  assert.equal(familyForSourcePath('/aircraft?make=Cessna', FIXTURE), null)
})

test('familyForSourcePath: query string with non-matching model -> null', () => {
  assert.equal(familyForSourcePath('/aircraft?make=Cessna&model=not-a-real-model', FIXTURE), null)
})

test('familyForSourcePath: notModelPattern excludes the sibling variant', () => {
  assert.equal(familyForSourcePath('/aircraft?make=Cirrus&model=SR22T', FIXTURE), null)
  const fam = familyForSourcePath('/aircraft?make=Cirrus&model=SR22', FIXTURE)
  assert.equal(fam?.key, 'cirrus/sr22')
})

test('familyForSourcePath: bare aircraft browse, homepage, partnerships, seekers -> null', () => {
  assert.equal(familyForSourcePath('/aircraft', FIXTURE), null)
  assert.equal(familyForSourcePath('/', FIXTURE), null)
  assert.equal(familyForSourcePath('/partnerships/make/cirrus', FIXTURE), null)
  assert.equal(familyForSourcePath('/partnerships/seeking', FIXTURE), null)
  assert.equal(familyForSourcePath('/aircraft/for-sale/california', FIXTURE), null)
})

test('familyForSourcePath: trailing slash is normalized', () => {
  const fam = familyForSourcePath('/aircraft/cessna/172/', FIXTURE)
  assert.ok(fam)
  assert.equal(fam?.key, 'cessna/172')
})

test('familyForSourcePath: empty entries list -> null', () => {
  assert.equal(familyForSourcePath('/aircraft/cessna/172', []), null)
})
