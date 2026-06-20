import type { AircraftForSale } from '@/lib/types'

/**
 * Schema.org JSON-LD for the aircraft-for-sale LIST pages
 * (`/aircraft/[make]/[model]` and `/aircraft/for-sale/[state]`).
 *
 * There is NO individual aircraft detail page on ClubHanger — these are list
 * pages aggregating third-party listings — so the markup is modeled as an
 * `ItemList` whose items are the for-sale aircraft shown on the page, each a
 * `Product` with an `Offer`.
 *
 * HONESTY RULES (also a GOAL.md honesty-rule requirement):
 * - Markup reflects REAL listing data only. Any property we don't actually have
 *   is OMITTED, never fabricated.
 * - NO `aggregateRating` / `review` — ClubHanger has no review data for these
 *   aggregated listings, and fake review markup is a Google penalty.
 * - NO `image` — the cards render a generic placeholder explicitly labeled
 *   "Not actual plane photo", so there is no real per-listing photo to mark up.
 * - An `Offer` is only attached when a listing has a genuine numeric
 *   `asking_price` (USD). Listings priced "Make offer" / "Call" (no number) get
 *   no offer rather than a made-up price.
 * - `name` mirrors the visible card title; `url` points at the listing's real
 *   source URL (where the card's "View on …" link goes) — no cloaking.
 */

/** Builds the make/model/year label shown under each card title. */
function aircraftLabel(p: AircraftForSale): string | undefined {
  const parts = [p.year, p.make, p.model].filter(Boolean)
  return parts.length ? parts.join(' ') : undefined
}

/**
 * Build the `Product`/`Offer` node for a single listing, mirroring exactly what
 * the card shows. Returns null only if there's nothing meaningful to mark up
 * (no title and no source URL), which never happens for a rendered card.
 */
function listingProduct(p: AircraftForSale): Record<string, unknown> | null {
  const name = p.title?.trim()
  if (!name) return null

  const product: Record<string, unknown> = {
    '@type': 'Product',
    name,
  }

  // Brand = the manufacturer (make), when we have it. Real data only.
  if (p.make) product.brand = { '@type': 'Brand', name: p.make }

  // A short, factual category line (year make model) — consistent with the
  // visible label under the card title.
  const label = aircraftLabel(p)
  if (label && label !== name) product.description = `${label} aircraft for sale.`

  // Real numeric price → a real Offer. No number → no offer (never invent one).
  if (typeof p.asking_price === 'number' && p.asking_price > 0) {
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      price: p.asking_price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
    }
    if (p.source_url) offer.url = p.source_url
    product.offers = offer
  }

  return product
}

/**
 * Build the page-level `ItemList` JSON-LD object for a set of for-sale listings.
 * `name` should match the page's visible H1/title intent (no cloaking).
 * Returns null when there are no markup-able listings (caller should then emit
 * nothing rather than an empty list).
 */
export function buildAircraftItemListJsonLd(
  listings: AircraftForSale[],
  opts: { name: string; url: string }
): Record<string, unknown> | null {
  const items = listings
    .map((p, i) => {
      const product = listingProduct(p)
      if (!product) return null
      const el: Record<string, unknown> = {
        '@type': 'ListItem',
        position: i + 1,
        item: { ...product, ...(p.source_url ? { url: p.source_url } : {}) },
      }
      return el
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
