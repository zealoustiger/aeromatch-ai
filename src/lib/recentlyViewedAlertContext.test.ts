/**
 * Run: node --experimental-strip-types --test src/lib/recentlyViewedAlertContext.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveRecentlyViewedAlertContext } from './recentlyViewedAlertContext.ts'
import type { RecentlyViewedEntry } from './recentlyViewed.ts'

const view = (make: string, model: string | null, noun: RecentlyViewedEntry['noun'] = 'aircraft'): RecentlyViewedEntry => ({
  make,
  model,
  noun,
})

test('no views → null', () => {
  assert.equal(deriveRecentlyViewedAlertContext([]), null)
})

test('2 views of the same make → null (below the 3-view cluster bar)', () => {
  assert.equal(deriveRecentlyViewedAlertContext([view('Cessna', '172'), view('Cessna', '172')]), null)
})

test('3 views of the same make/model → sharpens to model-level', () => {
  const result = deriveRecentlyViewedAlertContext([
    view('Cessna', '172'),
    view('Cessna', '172'),
    view('Cessna', '172'),
  ])
  assert.deepEqual(result, {
    context: 'Cessna 172',
    sourcePath: '/aircraft?make=Cessna&model=172',
    noun: 'aircraft',
  })
})

test('3 views split evenly across 3 models (no model plurality) → make-level fallback', () => {
  const result = deriveRecentlyViewedAlertContext([
    view('Cessna', '172'),
    view('Cessna', '182'),
    view('Cessna', '206'),
  ])
  assert.deepEqual(result, {
    context: 'Cessna',
    sourcePath: '/aircraft?make=Cessna',
    noun: 'aircraft',
  })
})

test('a tied make across 4 views (2 Cessna, 2 Piper) → null, too mixed to name honestly', () => {
  assert.equal(
    deriveRecentlyViewedAlertContext([
      view('Cessna', '172'),
      view('Cessna', '172'),
      view('Piper', 'Cherokee'),
      view('Piper', 'Cherokee'),
    ]),
    null
  )
})

test('a winning make with only 2 clustered views, diluted by other single makes → still null', () => {
  // Cessna(2) is the plurality winner across 4 total views, but only 2 Cessna
  // views is still below the 3-view bar — a plurality winner isn't automatically
  // a "cluster."
  assert.equal(
    deriveRecentlyViewedAlertContext([
      view('Cessna', '172'),
      view('Cessna', '172'),
      view('Piper', 'Cherokee'),
      view('Cirrus', 'SR22'),
    ]),
    null
  )
})

test('winning make cluster resolves noun by plurality within that make', () => {
  const result = deriveRecentlyViewedAlertContext([
    view('Cessna', '172', 'partnership'),
    view('Cessna', '172', 'partnership'),
    view('Cessna', '172', 'aircraft'),
  ])
  assert.deepEqual(result, {
    context: 'Cessna 172',
    sourcePath: '/partnerships?make=Cessna&model=172',
    noun: 'partnership',
  })
})

test('model clustering scoped to the winning make only', () => {
  const result = deriveRecentlyViewedAlertContext([
    view('Cessna', '172'),
    view('Cessna', '172'),
    view('Cessna', '172'),
    view('Piper', 'Cherokee'),
    view('Piper', 'Cherokee'),
  ])
  assert.deepEqual(result, {
    context: 'Cessna 172',
    sourcePath: '/aircraft?make=Cessna&model=172',
    noun: 'aircraft',
  })
})
