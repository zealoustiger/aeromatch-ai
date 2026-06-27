/**
 * Unit tests for the engine TBO lookup and overhaul-reserve calculator.
 * Run: node --experimental-strip-types --test src/lib/engineLife.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lookupEngineTbo, computeEngineLife } from './engineLife.ts'

// --- lookupEngineTbo ---

test('matches Lycoming IO-360 variants', () => {
  assert.equal(lookupEngineTbo('Lycoming IO-360-L2A')?.family, 'Lycoming IO-360')
  assert.equal(lookupEngineTbo('IO-360-A1A')?.family, 'Lycoming IO-360')
  assert.equal(lookupEngineTbo('AEIO-360-A1E')?.family, 'Lycoming IO-360')
})

test('matches Lycoming O-360 (distinct from IO-360)', () => {
  assert.equal(lookupEngineTbo('Lycoming O-360-A4M')?.family, 'Lycoming O-360')
  assert.equal(lookupEngineTbo('O-360-C1G')?.family, 'Lycoming O-360')
})

test('IO-540 matched before O-540 (specific before general)', () => {
  assert.equal(lookupEngineTbo('Lycoming IO-540-K1G5D')?.family, 'Lycoming IO-540')
  assert.equal(lookupEngineTbo('Lycoming O-540-B1A5')?.family, 'Lycoming O-540')
})

test('matches Continental IO-550', () => {
  assert.equal(lookupEngineTbo('Continental IO-550-N')?.family, 'Continental IO-550')
  assert.equal(lookupEngineTbo('IO-550-C')?.family, 'Continental IO-550')
})

test('matches Lycoming O-320', () => {
  assert.equal(lookupEngineTbo('Lycoming O-320-E2D')?.family, 'Lycoming O-320')
  assert.equal(lookupEngineTbo('O-320-H2AD')?.family, 'Lycoming O-320')
})

test('matches Continental TSIO-520 with correct TBO', () => {
  assert.equal(lookupEngineTbo('Continental TSIO-520-BE')?.tboHours, 1400)
})

test('matches Rotax engines', () => {
  assert.equal(lookupEngineTbo('Rotax 912 ULS')?.family, 'Rotax 912')
  assert.equal(lookupEngineTbo('rotax 914')?.family, 'Rotax 914')
})

test('returns null for unrecognised engine types', () => {
  assert.equal(lookupEngineTbo('turbine PT6A'), null)
  assert.equal(lookupEngineTbo(''), null)
  assert.equal(lookupEngineTbo('unknown engine'), null)
})

// --- computeEngineLife ---

test('returns null when smoh is null', () => {
  assert.equal(computeEngineLife({ smoh: null, engineType: 'Lycoming IO-360' }), null)
})

test('returns null when engineType is null', () => {
  assert.equal(computeEngineLife({ smoh: 500, engineType: null }), null)
})

test('returns null for unrecognised engine type', () => {
  assert.equal(computeEngineLife({ smoh: 500, engineType: 'turbine PT6A' }), null)
})

test('computes remaining hours correctly for IO-360 at 1200 SMOH', () => {
  const result = computeEngineLife({ smoh: 1200, engineType: 'Lycoming IO-360-L2A' })
  assert.ok(result)
  assert.equal(result.remainingHours, 800) // 2000 - 1200
  assert.equal(result.beyondTbo, false)
  assert.equal(result.tboHours, 2000)
  assert.equal(result.family, 'Lycoming IO-360')
})

test('flags beyondTbo when smoh exceeds tbo', () => {
  const result = computeEngineLife({ smoh: 2100, engineType: 'Lycoming IO-360' })
  assert.ok(result)
  assert.equal(result.beyondTbo, true)
  assert.equal(result.remainingHours, -100)
})

test('exactly at TBO is beyondTbo', () => {
  const result = computeEngineLife({ smoh: 2000, engineType: 'Lycoming IO-360' })
  assert.ok(result)
  assert.equal(result.beyondTbo, true)
  assert.equal(result.remainingHours, 0)
})

test('computes reserve per hour for Continental IO-550', () => {
  const result = computeEngineLife({ smoh: 800, engineType: 'Continental IO-550-N' })
  assert.ok(result)
  assert.equal(result.reservePerHour, 19) // 38000 / 2000
  assert.equal(result.reservePerYear, 1900) // 19 × 100
})
