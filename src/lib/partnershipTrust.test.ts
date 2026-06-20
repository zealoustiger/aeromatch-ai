/**
 * Worked-example tests for the partnership trust signals.
 * Run: node --experimental-strip-types --test src/lib/partnershipTrust.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateTrust, TRUST_SIGNAL_COUNT } from './partnershipTrust.ts'

// Minimal base; cast through unknown so the test doesn't depend on the @/ alias
// at runtime (the type import in the module is erased by --experimental-strip-types).
function makePartnership(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 'x',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    make: 'Cessna',
    model: '172',
    year: null,
    registration: null,
    home_airport: 'KHWD',
    share_type: '1/3',
    shares_available: 1,
    buy_in_price: null,
    monthly_fixed: null,
    hourly_wet: null,
    min_hours: null,
    title: 'Test',
    description: null,
    images: null,
    source_url: null,
    image_is_placeholder: null,
    posted_at: null,
    contact_email: 'a@b.com',
    contact_method: 'email',
    status: 'active',
    poster_id: null,
  }
  return { ...base, ...overrides } as unknown as Parameters<typeof evaluateTrust>[0]
}

test('an empty scraped listing scores 1/4 (on-platform only when no source_url)', () => {
  // No source_url -> on-platform counts; everything else absent.
  const r = evaluateTrust(makePartnership({ source_url: null }))
  assert.equal(r.score, 1)
  assert.equal(r.signals.find((s) => s.key === 'on_platform')?.met, true)
  assert.equal(r.signals.find((s) => s.key === 'real_photo')?.met, false)
})

test('a scraped off-platform listing with a real photo scores 1/4', () => {
  const r = evaluateTrust(
    makePartnership({
      source_url: 'https://barnstormers.com/x',
      images: ['https://cdn/x.jpg'],
      image_is_placeholder: false,
    }),
  )
  assert.equal(r.signals.find((s) => s.key === 'real_photo')?.met, true)
  assert.equal(r.signals.find((s) => s.key === 'on_platform')?.met, false)
  assert.equal(r.score, 1)
})

test('a fully-complete member listing scores 4/4', () => {
  const r = evaluateTrust(
    makePartnership({
      images: ['https://cdn/real.jpg'],
      image_is_placeholder: false,
      year: 2004,
      registration: 'N12345',
      buy_in_price: 18000,
      description: 'x'.repeat(120),
      source_url: null,
      poster_id: 'user-1',
    }),
  )
  assert.equal(r.score, TRUST_SIGNAL_COUNT)
  assert.ok(r.signals.every((s) => s.met))
})

test('a placeholder photo does NOT count as a real photo', () => {
  const r = evaluateTrust(
    makePartnership({ images: ['https://cdn/x.jpg'], image_is_placeholder: true }),
  )
  assert.equal(r.signals.find((s) => s.key === 'real_photo')?.met, false)
})

test('a short description does NOT clear complete specs', () => {
  const r = evaluateTrust(
    makePartnership({
      year: 2004,
      registration: 'N1',
      buy_in_price: 100,
      description: 'too short',
    }),
  )
  assert.equal(r.signals.find((s) => s.key === 'complete_specs')?.met, false)
})

test('slice 2 ranking: trust score sort floats complete listings above thin ones, stable on ties', () => {
  // Mirrors PartnershipList.sortByTrust: trust score DESC, stable tie-break on input order.
  const thin = makePartnership({ id: 'thin', source_url: 'https://x.com/a' }) // 0/4
  const onPlatformOnly = makePartnership({ id: 'on', source_url: null }) // 1/4
  const complete = makePartnership({
    id: 'complete',
    images: ['https://cdn/real.jpg'],
    image_is_placeholder: false,
    year: 2004,
    registration: 'N12345',
    buy_in_price: 18000,
    description: 'x'.repeat(120),
    source_url: null,
    poster_id: 'user-1',
  }) // 4/4
  const onPlatformOnly2 = makePartnership({ id: 'on2', source_url: null }) // 1/4, same score as `on`

  const input = [thin, onPlatformOnly, complete, onPlatformOnly2]
  const sorted = input
    .map((p, i) => ({ p, i, score: evaluateTrust(p).score }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.p)

  // complete (4) first, the two on-platform (1) keep their input order, thin (0) last.
  assert.deepEqual(
    sorted.map((p) => (p as unknown as { id: string }).id),
    ['complete', 'on', 'on2', 'thin'],
  )
})
