/**
 * Run: node --experimental-strip-types --test src/lib/alertDigestDedupe.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dedupeDigestSectionSamples } from './alertDigestDedupe.ts'

function sample(over: Partial<{ url: string; title: string }> = {}) {
  return {
    title: over.title ?? 'Aircraft',
    photoUrl: null,
    isPlaceholder: false,
    year: null,
    ttaf: null,
    location: null,
    price: null,
    url: over.url ?? 'https://example.com/a',
  }
}

test('listing matched by two sections renders once, in the first section', () => {
  const shared = sample({ url: 'https://example.com/shared', title: 'Shared Cessna' })
  const sections = [
    { context: 'Cessna 182', samples: [shared] },
    { context: 'Texas aircraft', samples: [shared] },
  ]
  const out = dedupeDigestSectionSamples(sections)
  assert.equal(out[0].samples.length, 1)
  assert.equal(out[1].samples.length, 0)
})

test('kept sample gets an honest "also matches" note naming the other section', () => {
  const shared = sample({ url: 'https://example.com/shared' })
  const sections = [
    { context: 'Cessna 182', samples: [shared] },
    { context: 'Texas aircraft', samples: [shared] },
  ]
  const out = dedupeDigestSectionSamples(sections)
  assert.equal(out[0].samples[0].alsoMatchesLabel, 'Also matches your Texas aircraft alert')
})

test('a sample with no duplicate elsewhere is unchanged (no note)', () => {
  const onlyOne = sample({ url: 'https://example.com/only' })
  const sections = [
    { context: 'Cessna 182', samples: [onlyOne] },
    { context: 'Texas aircraft', samples: [] },
  ]
  const out = dedupeDigestSectionSamples(sections)
  assert.equal(out[0].samples.length, 1)
  assert.equal('alsoMatchesLabel' in out[0].samples[0], false)
})

test('three-way duplicate: kept once, later two sections drop it', () => {
  const shared = sample({ url: 'https://example.com/shared' })
  const sections = [
    { context: 'A', samples: [shared] },
    { context: 'B', samples: [shared] },
    { context: 'C', samples: [shared] },
  ]
  const out = dedupeDigestSectionSamples(sections)
  assert.equal(out[0].samples.length, 1)
  assert.equal(out[1].samples.length, 0)
  assert.equal(out[2].samples.length, 0)
  assert.equal(out[0].samples[0].alsoMatchesLabel, 'Also matches your B alert')
})

test('distinct listings within one section are all kept', () => {
  const s1 = sample({ url: 'https://example.com/1' })
  const s2 = sample({ url: 'https://example.com/2' })
  const sections = [{ context: 'Cessna 182', samples: [s1, s2] }]
  const out = dedupeDigestSectionSamples(sections)
  assert.equal(out[0].samples.length, 2)
})

test('section counts/context pass through unchanged', () => {
  const sections = [{ context: 'Cessna 182', samples: [], newCount: 4, dropCount: 1 }]
  const out = dedupeDigestSectionSamples(sections)
  assert.equal(out[0].newCount, 4)
  assert.equal(out[0].dropCount, 1)
  assert.equal(out[0].context, 'Cessna 182')
})

test('empty context on the other section falls back to skipping the note', () => {
  const shared = sample({ url: 'https://example.com/shared' })
  const sections = [
    { context: 'Cessna 182', samples: [shared] },
    { context: null, samples: [shared] },
  ]
  const out = dedupeDigestSectionSamples(sections)
  assert.equal('alsoMatchesLabel' in out[0].samples[0], false)
})
