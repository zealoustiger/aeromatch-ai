/**
 * Unit tests for the comma-separated value-list helpers backing the seeker
 * form's one-tap make chips.
 * Run: node --experimental-strip-types --test src/lib/csvList.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCsvList, hasCsvItem, toggleCsvItem } from './csvList.ts'

// --- parseCsvList ---

test('parseCsvList: empty/nullish → []', () => {
  assert.deepEqual(parseCsvList(''), [])
  assert.deepEqual(parseCsvList(null), [])
  assert.deepEqual(parseCsvList(undefined), [])
  assert.deepEqual(parseCsvList('   '), [])
})

test('parseCsvList: trims tokens and drops empties', () => {
  assert.deepEqual(parseCsvList('Cessna, Piper ,  , Cirrus'), ['Cessna', 'Piper', 'Cirrus'])
})

// --- hasCsvItem ---

test('hasCsvItem: case-insensitive membership', () => {
  assert.equal(hasCsvItem('Cessna, Piper', 'cessna'), true)
  assert.equal(hasCsvItem('Cessna, Piper', 'PIPER'), true)
  assert.equal(hasCsvItem('Cessna, Piper', 'Cirrus'), false)
  assert.equal(hasCsvItem('', 'Cessna'), false)
  assert.equal(hasCsvItem('Cessna', ''), false)
})

// --- toggleCsvItem ---

test('toggleCsvItem: appends when absent', () => {
  assert.equal(toggleCsvItem('Cessna', 'Piper'), 'Cessna, Piper')
  assert.equal(toggleCsvItem('', 'Cessna'), 'Cessna')
  assert.equal(toggleCsvItem(null, 'Cessna'), 'Cessna')
})

test('toggleCsvItem: removes when present (case-insensitive)', () => {
  assert.equal(toggleCsvItem('Cessna, Piper', 'cessna'), 'Piper')
  assert.equal(toggleCsvItem('Cessna, Piper', 'PIPER'), 'Cessna')
  assert.equal(toggleCsvItem('Cessna', 'Cessna'), '')
})

test('toggleCsvItem: preserves other tokens and their original casing/order', () => {
  // Toggling Diamond off leaves the hand-typed "maule" untouched.
  assert.equal(toggleCsvItem('maule, Diamond', 'diamond'), 'maule')
  // Appending keeps the existing free-typed make.
  assert.equal(toggleCsvItem('maule', 'Cessna'), 'maule, Cessna')
})

test('toggleCsvItem: removes every casing variant of a duplicate', () => {
  assert.equal(toggleCsvItem('Cessna, cessna, Piper', 'CESSNA'), 'Piper')
})

test('toggleCsvItem: blank item is a no-op (just normalizes spacing)', () => {
  assert.equal(toggleCsvItem('Cessna,  Piper', '  '), 'Cessna, Piper')
})
