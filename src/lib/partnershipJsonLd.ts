import type { Partnership, Airport } from '@/lib/types'
import { SITE_URL } from '@/lib/seo'
import { aircraftLabel } from '@/lib/utils'

/**
 * Schema.org JSON-LD for the partnership LIST pages
 * (`/partnerships/state/[state]`, `/partnerships/make/[make]`, and the listing
 * sections of `/airports/[icao]`) and for the airport detail page itself.
 *
 * HONESTY RULES (GOAL.md honesty-rule requirement — fake markup is a Google
 * penalty):
 * - Markup reflects REAL data only. Any property we don't actually have is
 *   OMITTED, never fabricated.
 * - NO `aggregateRating` / `review` / rating of any kind.
 * - An `Offer` is only attached when a listing has a genuine numeric buy-in
 *   price (USD). No price → no offer (never invent one).
 * - `name` mirrors the visible listing title / airport name; each item `url`
 *   points at the real on-site `/partnerships/[id]` detail page the card links to
 *   — no cloaking.
 * - The Airport markup uses ONLY fields the `/airports/[icao]` page already shows
 *   (name, ICAO/IATA codes, city/state, lat/lng, elevation).
 */

/**
 * Build the `Product` node for a single partnership listing, mirroring what the
 * `PartnershipCard` shows. Returns null only if there's no title to mark up.
 */
function partnershipProduct(p: Partnership): Record<string, unknown> | null {
  const name = p.title?.trim()
  if (!name) return null

  const product: Record<string, unknown> = {
    '@type': 'Product',
    name,
    // Real on-site detail page for this listing (where the card links).
    url: `${SITE_URL}/partnerships/${p.id}`,
  }

  // Brand = manufacturer (make), when present. Real data only.
  if (p.make) product.brand = { '@type': 'Brand', name: p.make }

  // A short, factual description from real fields (year make model). Mirrors the
  // aircraft label the card renders; omitted when it'd just repeat the title.
  const label = aircraftLabel(p.make, p.model, p.year)
  if (label && label !== name) product.description = `${label} aircraft partnership.`

  // Real numeric buy-in → a real Offer. No number → no offer (never invent one).
  if (typeof p.buy_in_price === 'number' && p.buy_in_price > 0) {
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      price: p.buy_in_price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/partnerships/${p.id}`,
    }
    const area = [p.city, p.state].filter(Boolean).join(', ')
    if (area) offer.areaServed = area
    product.offers = offer
  }

  return product
}

/**
 * Page-level `ItemList` JSON-LD for a set of partnership listings (in the SAME
 * order the page renders them). `name` should match the page's visible H1/intent
 * (no cloaking). Returns null when there are no markup-able listings, so the
 * caller emits nothing rather than an empty list.
 */
export function buildPartnershipItemListJsonLd(
  listings: Partnership[],
  opts: { name: string; url: string }
): Record<string, unknown> | null {
  const items = listings
    .map((p, i): Record<string, unknown> | null => {
      const product = partnershipProduct(p)
      if (!product) return null
      return {
        '@type': 'ListItem',
        position: i + 1,
        url: product.url,
        item: product,
      }
    })
    .filter((x): x is Record<string, unknown> => x !== null)

  if (items.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: opts.name,
    url: opts.url,
    numberOfItems: items.length,
    itemListElement: items,
  }
}

/**
 * `Place` JSON-LD for the airport detail page, typed `additionalType` Airport
 * (schema.org/Airport is a subtype of CivicStructure/Place; using Place +
 * additionalType keeps it broadly valid while still declaring the airport type).
 * Uses ONLY fields the page already displays. `name` matches the visible airport
 * name. No fabricated properties.
 */
export function buildAirportJsonLd(airport: Airport): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Airport',
    name: airport.name,
    url: `${SITE_URL}/airports/${airport.icao.toLowerCase()}`,
    icaoCode: airport.icao,
  }

  if (airport.iata) node.iataCode = airport.iata

  // City / region — only the parts we actually have.
  const address: Record<string, unknown> = { '@type': 'PostalAddress', addressCountry: 'US' }
  if (airport.city) address.addressLocality = airport.city
  if (airport.state) address.addressRegion = airport.state
  if (airport.city || airport.state) node.address = address

  // Real coordinates from the airports table (both are non-null in the type).
  if (typeof airport.lat === 'number' && typeof airport.lng === 'number') {
    const geo: Record<string, unknown> = {
      '@type': 'GeoCoordinates',
      latitude: airport.lat,
      longitude: airport.lng,
    }
    if (typeof airport.elevation === 'number') geo.elevation = `${airport.elevation} ft`
    node.geo = geo
  }

  return node
}
