/**
 * Run: node --experimental-strip-types --test src/lib/alertSourceFamily.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifySourcePath } from './alertSourceFamily.ts'

test('classifySourcePath: null/empty -> Unknown', () => {
  assert.equal(classifySourcePath(null), 'Unknown / no context')
  assert.equal(classifySourcePath(undefined), 'Unknown / no context')
  assert.equal(classifySourcePath(''), 'Unknown / no context')
})

test('classifySourcePath: homepage', () => {
  assert.equal(classifySourcePath('/'), 'Homepage')
})

test('classifySourcePath: aircraft families', () => {
  assert.equal(classifySourcePath('/aircraft'), 'Aircraft browse/filter')
  assert.equal(classifySourcePath('/aircraft?make=Cessna'), 'Aircraft browse/filter')
  assert.equal(classifySourcePath('/aircraft?deal=good'), 'Aircraft browse/filter')
  assert.equal(classifySourcePath('/aircraft/listing/abc-123'), 'Aircraft listing pages')
  assert.equal(classifySourcePath('/aircraft/mission/glass-cockpit'), 'Mission pages')
  assert.equal(classifySourcePath('/aircraft/compare/cessna-172-vs-cirrus-sr22'), 'Aircraft compare pages')
  assert.equal(classifySourcePath('/aircraft/for-sale/california'), 'State for-sale pages')
  assert.equal(classifySourcePath('/aircraft/deals'), 'Deals page')
  assert.equal(classifySourcePath('/aircraft/cessna'), 'Make pages')
  assert.equal(classifySourcePath('/aircraft/cessna/172'), 'Make+model pages')
  assert.equal(classifySourcePath('/aircraft/cessna/172/california'), 'Make+model+state pages')
})

test('classifySourcePath: partnership families', () => {
  assert.equal(classifySourcePath('/partnerships'), 'Partnership browse/filter')
  assert.equal(classifySourcePath('/partnerships?make=Cirrus'), 'Partnership browse/filter')
  assert.equal(classifySourcePath('/partnerships/seeking'), 'Seeking browse')
  assert.equal(classifySourcePath('/partnerships/seeking/seek-2'), 'Seeking detail pages')
  assert.equal(classifySourcePath('/partnerships/make/cirrus'), 'Partnership make pages')
  assert.equal(classifySourcePath('/partnerships/state/ca'), 'Partnership state pages')
  assert.equal(classifySourcePath('/partnerships/near/khwd'), 'Partnership near-airport pages')
  assert.equal(classifySourcePath('/partnerships/browse'), 'Partnership browse (legacy)')
  assert.equal(classifySourcePath('/partnerships/abc-123-uuid'), 'Partnership listing pages')
})

test('classifySourcePath: other known page groups', () => {
  assert.equal(classifySourcePath('/saved'), 'Saved listings page')
  assert.equal(classifySourcePath('/guides/aircraft-co-ownership'), 'Guide pages')
  assert.equal(classifySourcePath('/tools/cost-calculator'), 'Tools pages')
  assert.equal(classifySourcePath('/airports/khwd'), 'Airport pages')
  assert.equal(classifySourcePath('/compare'), 'Compare tray')
})

test('classifySourcePath: unrecognized path falls back to Other', () => {
  assert.equal(classifySourcePath('/some-new-page'), 'Other')
})

test('classifySourcePath: trailing slash is normalized', () => {
  assert.equal(classifySourcePath('/aircraft/'), 'Aircraft browse/filter')
  assert.equal(classifySourcePath('/partnerships/'), 'Partnership browse/filter')
})
