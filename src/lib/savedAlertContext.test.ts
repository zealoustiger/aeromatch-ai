/**
 * Run: node --experimental-strip-types --test src/lib/savedAlertContext.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveSavedAlertContext } from './savedAlertContext.ts'
import type { AircraftForSale, Partnership } from './types.ts'

const aircraft = (make: string, model: string): AircraftForSale =>
  ({ make, model } as AircraftForSale)
const partnership = (make: string, model: string): Partnership =>
  ({ make, model } as Partnership)

test('no saves → null', () => {
  assert.equal(deriveSavedAlertContext([], []), null)
})

test('make-level tie (1 Cessna + 1 Piper) → generic fallback, unchanged', () => {
  assert.equal(
    deriveSavedAlertContext([], [aircraft('Cessna', '172'), aircraft('Piper', 'Cherokee')]),
    null
  )
})

test('all saves in the winning make share one model → sharpens to model-level', () => {
  const result = deriveSavedAlertContext(
    [],
    [aircraft('Cessna', '172'), aircraft('Cessna', '172'), aircraft('Piper', 'Cherokee')]
  )
  assert.deepEqual(result, {
    context: 'Cessna 172',
    sourcePath: '/aircraft?make=Cessna&model=172',
    noun: 'aircraft',
  })
})

test('winning make splits across 2+ models with no plurality → make-level fallback', () => {
  const result = deriveSavedAlertContext(
    [],
    [aircraft('Cessna', '172'), aircraft('Cessna', '182'), aircraft('Piper', 'Cherokee')]
  )
  assert.deepEqual(result, {
    context: 'Cessna',
    sourcePath: '/aircraft?make=Cessna',
    noun: 'aircraft',
  })
})

test('winning make has no model values at all → make-level fallback', () => {
  const result = deriveSavedAlertContext(
    [],
    [aircraft('Cessna', ''), aircraft('Cessna', ''), aircraft('Piper', 'Cherokee')]
  )
  assert.deepEqual(result, {
    context: 'Cessna',
    sourcePath: '/aircraft?make=Cessna',
    noun: 'aircraft',
  })
})

test('model clustering scoped to the winning make only, not other makes’ models', () => {
  // Cessna saves split 172/182 (no model plurality) but Cessna is still the clear
  // winning make (3 vs 2) — model-level must scope to Cessna's own saves, not
  // accidentally pick up Piper's clustered "Cherokee".
  const result = deriveSavedAlertContext(
    [],
    [
      aircraft('Cessna', '172'),
      aircraft('Cessna', '182'),
      aircraft('Cessna', '172'),
      aircraft('Piper', 'Cherokee'),
      aircraft('Piper', 'Cherokee'),
    ]
  )
  assert.deepEqual(result, {
    context: 'Cessna 172',
    sourcePath: '/aircraft?make=Cessna&model=172',
    noun: 'aircraft',
  })
})

test('partnership model clustering routes to /partnerships with make+model', () => {
  const result = deriveSavedAlertContext(
    [partnership('Cessna', '172'), partnership('Cessna', '172')],
    []
  )
  assert.deepEqual(result, {
    context: 'Cessna 172',
    sourcePath: '/partnerships?make=Cessna&model=172',
    noun: 'partnership',
  })
})

test('a single save still names its model (same single-item confidence as make-level)', () => {
  const result = deriveSavedAlertContext([], [aircraft('Cirrus', 'SR22')])
  assert.deepEqual(result, {
    context: 'Cirrus SR22',
    sourcePath: '/aircraft?make=Cirrus&model=SR22',
    noun: 'aircraft',
  })
})
