/**
 * Run: node --experimental-strip-types --test src/lib/alertOverlap.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectOverlappingAlerts, findBroaderOverlapContext, type OverlapCandidate } from './alertOverlap.ts'

function aircraft(over: Partial<{ make: string; model: string; state: string; minPrice: string; maxPrice: string; minYear: string; maxYear: string; dealOnly: boolean }> = {}) {
  return {
    type: 'aircraft' as const,
    make: over.make ?? '',
    model: over.model ?? '',
    state: over.state ?? '',
    minPrice: over.minPrice ?? '',
    maxPrice: over.maxPrice ?? '',
    minYear: over.minYear ?? '',
    maxYear: over.maxYear ?? '',
    dealOnly: over.dealOnly ?? false,
  }
}

function partnership(over: Partial<{ make: string; state: string; airports: string[] }> = {}) {
  return { type: 'partnership' as const, make: over.make ?? '', state: over.state ?? '', airports: over.airports ?? [] }
}

function candidate(over: Partial<OverlapCandidate> & Pick<OverlapCandidate, 'id' | 'target'>): OverlapCandidate {
  return { status: 'confirmed', context: null, hasHiddenCriteria: false, ...over }
}

test('narrower (make+model) is flagged as covered by broader (make-only)', () => {
  const broad = candidate({ id: 'a', target: aircraft({ make: 'Cessna' }), context: 'Cessna' })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna', model: '172' }), context: 'Cessna 172' })
  const overlaps = detectOverlappingAlerts([broad, narrow])
  assert.equal(overlaps.size, 1)
  assert.deepEqual(overlaps.get('b'), { narrowerId: 'b', broaderId: 'a', broaderContext: 'Cessna' })
  assert.equal(overlaps.has('a'), false)
})

test('case-insensitive make match still detected', () => {
  const broad = candidate({ id: 'a', target: aircraft({ make: 'cessna' }) })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'CESSNA', model: '172' }) })
  assert.equal(detectOverlappingAlerts([broad, narrow]).has('b'), true)
})

test('different make values on the same field: not an overlap', () => {
  const a = candidate({ id: 'a', target: aircraft({ make: 'Cessna' }) })
  const b = candidate({ id: 'b', target: aircraft({ make: 'Piper', model: '172' }) })
  assert.equal(detectOverlappingAlerts([a, b]).size, 0)
})

test('exact-duplicate criteria: no nudge (ambiguous which is narrower)', () => {
  const a = candidate({ id: 'a', target: aircraft({ make: 'Cessna', model: '172' }) })
  const b = candidate({ id: 'b', target: aircraft({ make: 'Cessna', model: '172' }) })
  assert.equal(detectOverlappingAlerts([a, b]).size, 0)
})

test('price range is exact-match only — narrower min_price is NOT treated as covered', () => {
  const broad = candidate({ id: 'a', target: aircraft({ make: 'Cessna', minPrice: '50000' }) })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna', minPrice: '80000' }) })
  assert.equal(detectOverlappingAlerts([broad, narrow]).size, 0)
})

test('state narrows a make-only alert', () => {
  const broad = candidate({ id: 'a', target: aircraft({ make: 'Cessna' }) })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna', state: 'CA' }) })
  const overlaps = detectOverlappingAlerts([broad, narrow])
  assert.equal(overlaps.get('b')?.broaderId, 'a')
})

test('dealOnly=false is "no constraint" — does not block a match', () => {
  const broad = candidate({ id: 'a', target: aircraft({ make: 'Cessna', dealOnly: false }) })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna', model: '172', dealOnly: true }) })
  assert.equal(detectOverlappingAlerts([broad, narrow]).get('b')?.broaderId, 'a')
})

test('a hidden criterion on the broader side excludes it from comparison', () => {
  const broad = candidate({ id: 'a', target: aircraft({ make: 'Cessna' }), hasHiddenCriteria: true })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna', model: '172' }) })
  assert.equal(detectOverlappingAlerts([broad, narrow]).size, 0)
})

test('a hidden criterion on the narrower side excludes it from comparison', () => {
  const broad = candidate({ id: 'a', target: aircraft({ make: 'Cessna' }) })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna', model: '172' }), hasHiddenCriteria: true })
  assert.equal(detectOverlappingAlerts([broad, narrow]).size, 0)
})

test('a pending (unconfirmed) alert is never flagged or used as a broader candidate', () => {
  const pending = candidate({ id: 'a', target: aircraft({ make: 'Cessna' }), status: 'pending' })
  const confirmedNarrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna', model: '172' }) })
  assert.equal(detectOverlappingAlerts([pending, confirmedNarrow]).size, 0)
})

test('different alert types never overlap (aircraft vs partnership)', () => {
  const a = candidate({ id: 'a', target: aircraft({ make: 'Cessna' }) })
  const b = candidate({ id: 'b', target: partnership({ make: 'Cessna' }) })
  assert.equal(detectOverlappingAlerts([a, b]).size, 0)
})

test('a null target (unparseable/legacy source_path) is never compared', () => {
  const a = candidate({ id: 'a', target: null })
  const b = candidate({ id: 'b', target: aircraft({ make: 'Cessna', model: '172' }) })
  assert.equal(detectOverlappingAlerts([a, b]).size, 0)
})

test('the broadest of two qualifying broader alerts is picked (clearest reason)', () => {
  const broadest = candidate({ id: 'a', target: aircraft({ make: 'Cessna' }), context: 'Cessna' })
  const middle = candidate({ id: 'b', target: aircraft({ make: 'Cessna', state: 'CA' }), context: 'Cessna in CA' })
  const narrow = candidate({ id: 'c', target: aircraft({ make: 'Cessna', state: 'CA', model: '172' }) })
  const overlaps = detectOverlappingAlerts([broadest, middle, narrow])
  assert.equal(overlaps.get('c')?.broaderId, 'a')
})

test('empty target (browse-all) can be a broader alert for anything of its type', () => {
  const browseAll = candidate({ id: 'a', target: aircraft(), context: null })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna' }) })
  const overlaps = detectOverlappingAlerts([browseAll, narrow])
  assert.equal(overlaps.get('b')?.broaderId, 'a')
  assert.equal(overlaps.get('b')?.broaderContext, 'your other alert')
})

test('empty target is never itself flagged as narrower (nothing is broader than "everything")', () => {
  const browseAll = candidate({ id: 'a', target: aircraft() })
  const narrow = candidate({ id: 'b', target: aircraft({ make: 'Cessna' }) })
  assert.equal(detectOverlappingAlerts([browseAll, narrow]).has('a'), false)
})

test('partnership airport narrows a make+state alert', () => {
  const broad = candidate({ id: 'a', target: partnership({ make: 'Cessna', state: 'CA' }), context: 'Cessna in CA' })
  const narrow = candidate({ id: 'b', target: partnership({ make: 'Cessna', state: 'CA', airports: ['KHWD'] }) })
  assert.equal(detectOverlappingAlerts([broad, narrow]).get('b')?.broaderId, 'a')
})

test('same multi-airport SET in a different order still counts as matching (state narrows it)', () => {
  const broad = candidate({
    id: 'a',
    target: partnership({ make: 'Cessna', airports: ['KHWD', 'KPAO'] }),
    context: 'Cessna near KHWD, KPAO',
  })
  const narrow = candidate({
    id: 'b',
    // Same two codes, reversed order + lowercase — must still compare equal
    // (order-independent, case-insensitive), or this false-negatives the overlap.
    target: partnership({ make: 'Cessna', state: 'CA', airports: ['kpao', 'KHWD'] }),
  })
  assert.equal(detectOverlappingAlerts([broad, narrow]).get('b')?.broaderId, 'a')
})

test('different airport SETS on both sides: not an overlap even with one code in common', () => {
  const a = candidate({ id: 'a', target: partnership({ make: 'Cessna', airports: ['KHWD'] }) })
  const b = candidate({ id: 'b', target: partnership({ make: 'Cessna', airports: ['KHWD', 'KPAO'] }) })
  assert.equal(detectOverlappingAlerts([a, b]).size, 0)
})

test('an empty airports array is "no constraint" — a make-only alert can still be the broader side', () => {
  const broad = candidate({ id: 'a', target: partnership({ make: 'Cessna', airports: [] }), context: 'Cessna' })
  const narrow = candidate({ id: 'b', target: partnership({ make: 'Cessna', airports: ['KHWD', 'KPAO'] }) })
  assert.equal(detectOverlappingAlerts([broad, narrow]).get('b')?.broaderId, 'a')
})

test('findBroaderOverlapContext: new alert covered by an existing broader confirmed alert', () => {
  const existing = [candidate({ id: 'a', target: aircraft({ make: 'Cessna' }), context: 'Cessna — all states' })]
  const context = findBroaderOverlapContext(aircraft({ make: 'Cessna', state: 'CA' }), existing)
  assert.equal(context, 'Cessna — all states')
})

test('findBroaderOverlapContext: falls back to "your other alert" when the broader alert has no context', () => {
  const existing = [candidate({ id: 'a', target: aircraft(), context: null })]
  const context = findBroaderOverlapContext(aircraft({ make: 'Cessna' }), existing)
  assert.equal(context, 'your other alert')
})

test('findBroaderOverlapContext: no covering alert => null', () => {
  const existing = [candidate({ id: 'a', target: aircraft({ make: 'Piper' }), context: 'Piper' })]
  const context = findBroaderOverlapContext(aircraft({ make: 'Cessna' }), existing)
  assert.equal(context, null)
})

test('findBroaderOverlapContext: a pending existing alert is never used as a broader candidate', () => {
  const existing = [candidate({ id: 'a', target: aircraft({ make: 'Cessna' }), context: 'Cessna', status: 'pending' })]
  const context = findBroaderOverlapContext(aircraft({ make: 'Cessna', state: 'CA' }), existing)
  assert.equal(context, null)
})

test('findBroaderOverlapContext: a hidden criterion on the existing alert excludes it', () => {
  const existing = [
    candidate({ id: 'a', target: aircraft({ make: 'Cessna' }), context: 'Cessna', hasHiddenCriteria: true }),
  ]
  const context = findBroaderOverlapContext(aircraft({ make: 'Cessna', state: 'CA' }), existing)
  assert.equal(context, null)
})

test('findBroaderOverlapContext: does not mutate the existing candidates array', () => {
  const existing = [candidate({ id: 'a', target: aircraft({ make: 'Cessna' }), context: 'Cessna' })]
  const before = JSON.stringify(existing)
  findBroaderOverlapContext(aircraft({ make: 'Cessna', state: 'CA' }), existing)
  assert.equal(JSON.stringify(existing), before)
})
