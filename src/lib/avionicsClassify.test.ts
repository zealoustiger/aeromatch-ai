/**
 * Unit tests for computeIfrSuitability (capability chips → honest IFR buyer read).
 * Run: node --experimental-strip-types --test src/lib/avionicsClassify.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeIfrSuitability, type AvionicsCap } from './avionicsClassify.ts'

// Minimal cap factory — only `key` matters to the IFR logic.
const cap = (key: AvionicsCap['key']): AvionicsCap => ({ key, label: key, hint: '' })

// --- honesty floor: no fabricated read from an empty/unknown panel ---

test('empty caps → null (self-suppress, never assert IFR capability)', () => {
  assert.equal(computeIfrSuitability([]), null)
})

// --- tier precedence (richest combo wins) ---

test('glass + WAAS + autopilot → full touring setup', () => {
  const r = computeIfrSuitability([cap('glass'), cap('waas'), cap('autopilot')])
  assert.equal(r?.tier, 'full')
  assert.match(r!.headline, /Full IFR/i)
})

test('glass + WAAS (no autopilot) → full, and copy defers to owner on autopilot', () => {
  const r = computeIfrSuitability([cap('glass'), cap('waas')])
  assert.equal(r?.tier, 'full')
  assert.match(r!.sub, /autopilot/i)
})

test('glass + autopilot (no WAAS) → capable', () => {
  assert.equal(computeIfrSuitability([cap('glass'), cap('autopilot')])?.tier, 'capable')
})

test('WAAS + autopilot → capable', () => {
  assert.equal(computeIfrSuitability([cap('waas'), cap('autopilot')])?.tier, 'capable')
})

test('glass alone → capable', () => {
  assert.equal(computeIfrSuitability([cap('glass')])?.tier, 'capable')
})

test('WAAS alone → capable', () => {
  assert.equal(computeIfrSuitability([cap('waas')])?.tier, 'capable')
})

test('non-WAAS GPS + autopilot → equipped', () => {
  assert.equal(computeIfrSuitability([cap('gps'), cap('autopilot')])?.tier, 'equipped')
})

test('GPS alone → equipped, copy verifies WAAS with owner', () => {
  const r = computeIfrSuitability([cap('gps')])
  assert.equal(r?.tier, 'equipped')
  assert.match(r!.sub, /WAAS/i)
})

test('autopilot alone → equipped', () => {
  assert.equal(computeIfrSuitability([cap('autopilot')])?.tier, 'equipped')
})

test('ADS-B only → basic (compliance, not an IFR navigation suite)', () => {
  const r = computeIfrSuitability([cap('adsb')])
  assert.equal(r?.tier, 'basic')
  assert.match(r!.headline, /ADS-B/i)
})

// --- every non-null read names what is present and defers on the rest ---

test('every tier produces a non-empty headline + sub', () => {
  const combos: AvionicsCap['key'][][] = [
    ['glass', 'waas', 'autopilot'],
    ['glass', 'autopilot'],
    ['waas'],
    ['gps'],
    ['adsb'],
  ]
  for (const keys of combos) {
    const r = computeIfrSuitability(keys.map(cap))
    assert.ok(r && r.headline.length > 0 && r.sub.length > 0, `expected a read for ${keys.join('+')}`)
  }
})
