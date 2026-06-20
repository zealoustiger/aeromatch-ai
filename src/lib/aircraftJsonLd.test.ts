import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildAircraftItemListJsonLd } from './aircraftJsonLd.ts'
import type { AircraftForSale } from './types.ts'

function listing(overrides: Partial<AircraftForSale> = {}): AircraftForSale {
  return {
    id: overrides.id ?? 'id-1',
    created_at: '2026-01-01T00:00:00Z',
    source: 'barnstormers',
    source_url: 'https://example.com/listing/1',
    make: 'Cessna',
    model: '172',
    year: 2004,
    registration: null,
    ttaf: null,
    smoh: null,
    annual_due: null,
    damage_history: null,
    avionics: null,
    engine_type: null,
    title: '2004 Cessna 172S Skyhawk',
    description: 'A nice plane',
    asking_price: 250000,
    price_text: null,
    location: 'Austin, TX',
    state: 'TX',
    status: 'active',
    first_seen_at: null,
    last_seen_at: null,
    content_hash: null,
    previous_price: null,
    price_changed_at: null,
    removed_at: null,
    quality_score: 80,
    ...overrides,
  }
}

test('builds an ItemList with correct @context/@type and item count', () => {
  const out = buildAircraftItemListJsonLd([listing(), listing({ id: 'id-2' })], {
    name: 'Cessna 172 for sale',
    url: 'https://clubhanger.com/aircraft/cessna/172',
  })!
  assert.equal(out['@context'], 'https://schema.org')
  assert.equal(out['@type'], 'ItemList')
  assert.equal(out.name, 'Cessna 172 for sale')
  assert.equal(out.numberOfItems, 2)
  const els = out.itemListElement as Record<string, unknown>[]
  assert.equal(els.length, 2)
  assert.equal(els[0]['@type'], 'ListItem')
  assert.equal(els[0].position, 1)
})

test('item name matches the card title and url is the real source_url', () => {
  const out = buildAircraftItemListJsonLd([listing()], { name: 'x', url: 'u' })!
  const item = (out.itemListElement as Record<string, unknown>[])[0].item as Record<string, unknown>
  assert.equal(item['@type'], 'Product')
  assert.equal(item.name, '2004 Cessna 172S Skyhawk')
  assert.equal(item.url, 'https://example.com/listing/1')
})

test('numeric asking_price produces a real USD Offer; no fabricated fields', () => {
  const out = buildAircraftItemListJsonLd([listing({ asking_price: 250000 })], { name: 'x', url: 'u' })!
  const item = (out.itemListElement as Record<string, unknown>[])[0].item as Record<string, unknown>
  const offer = item.offers as Record<string, unknown>
  assert.equal(offer['@type'], 'Offer')
  assert.equal(offer.price, 250000)
  assert.equal(offer.priceCurrency, 'USD')
  assert.equal(offer.availability, 'https://schema.org/InStock')
  assert.equal(offer.url, 'https://example.com/listing/1')
})

test('NO offer when there is no numeric price (never invent one)', () => {
  const out = buildAircraftItemListJsonLd(
    [listing({ asking_price: null, price_text: 'Make offer' })],
    { name: 'x', url: 'u' }
  )!
  const item = (out.itemListElement as Record<string, unknown>[])[0].item as Record<string, unknown>
  assert.equal(item.offers, undefined)
})

test('NEVER emits aggregateRating, review, or a fabricated image', () => {
  const json = JSON.stringify(
    buildAircraftItemListJsonLd([listing()], { name: 'x', url: 'u' })
  )
  assert.ok(!json.includes('aggregateRating'))
  assert.ok(!json.includes('"review"'))
  assert.ok(!json.includes('"image"'))
})

test('returns null for an empty listing set (caller emits nothing)', () => {
  assert.equal(buildAircraftItemListJsonLd([], { name: 'x', url: 'u' }), null)
})

test('skips listings with no title rather than emitting a blank Product', () => {
  const out = buildAircraftItemListJsonLd(
    [listing({ title: '' as unknown as string }), listing({ id: 'ok' })],
    { name: 'x', url: 'u' }
  )!
  assert.equal(out.numberOfItems, 1)
})
