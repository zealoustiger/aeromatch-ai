/**
 * GlobalPlaneSearch.com adapter — DISABLED by default (see scraper/ingest.mjs).
 *
 * Kept as a worked second-source example proving the adapter interface. Not run
 * in production because its static browse feed is airliner/ACMI-heavy and its
 * make/category filters only apply via JS (the static endpoint ignores them),
 * so it's a poor fit for a GA audience until we add a headless/unblocker fetcher.
 *
 * A GA aggregator served as static HTML.
 *
 * Browse: /aircraft-for-sale/all?country=US&page_size=50&page=N
 * Each listing is a <div class='item'> card. The detail URL slug encodes
 * id, year, make, model, and location:
 *   /aircraft/3069260-1968-cessna-172-skyhawk-for-sale-in-california
 * Price + "Price Reduced" badge live in the card markup.
 */

import {
  fetchHtml,
  sleep,
  decode,
  titleCase,
  stateCodeFromName,
} from '../lib/ingest-core.mjs'

const BASE = 'https://www.globalplanesearch.com'
const PAGE_SIZE = 50

// Canonicalize make tokens so cross-source make filtering lines up.
const MAKE_ALIASES = {
  beech: 'Beechcraft',
  beechcraft: 'Beechcraft',
  cessna: 'Cessna',
  piper: 'Piper',
  cirrus: 'Cirrus',
  mooney: 'Mooney',
  diamond: 'Diamond',
  grumman: 'Grumman',
  bellanca: 'Bellanca',
  lancair: 'Lancair',
  vans: "Van's",
  pipistrel: 'Pipistrel',
  dassault: 'Dassault',
  bell: 'Bell',
}

const VALID = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
])

function parseSlug(slug) {
  // slug = "{year?}-{make}-{model...}-for-sale-in-{location?}"
  const m = slug.match(/^(.*?)-for-sale-in-?(.*)$/)
  const aircraftPart = m ? m[1] : slug
  const locPart = m ? m[2] : ''

  const tokens = aircraftPart.split('-').filter(Boolean)
  let year = null
  if (tokens[0] && /^(19|20)\d\d$/.test(tokens[0])) {
    year = parseInt(tokens.shift(), 10)
  }
  const makeToken = tokens.shift() || ''
  const make = MAKE_ALIASES[makeToken.toLowerCase()] ?? (makeToken ? titleCase(makeToken) : null)
  const model = tokens.length ? titleCase(tokens.join(' ')) : null

  // location
  let location = null
  let state = null
  const locTokens = locPart.split('-').filter(Boolean)
  if (locTokens.length) {
    const last = locTokens[locTokens.length - 1].toUpperCase()
    if (last.length === 2 && VALID.has(last)) {
      state = last
      const cityTokens = locTokens.slice(0, -1)
      const city = titleCase(cityTokens.join(' '))
      location = city && city.toUpperCase() !== state ? `${city}, ${state}` : state
    } else {
      const named = stateCodeFromName(locTokens.join(' '))
      if (named) {
        state = named
        location = named
      }
    }
  }

  return { year, make, model, state, location }
}

export const source = 'globalplanesearch'
export const label = 'GlobalPlaneSearch'

export async function fetchListings({ pages = 5, log = console.log } = {}) {
  const all = []
  const seen = new Set()
  for (let page = 1; page <= pages; page++) {
    let html
    try {
      html = await fetchHtml(
        `${BASE}/aircraft-for-sale/all?country=US&page_size=${PAGE_SIZE}&page=${page}`
      )
    } catch (e) {
      log(`  page ${page} error: ${e.message}`)
      break
    }

    const cards = html.split(/<div class='item'>/).slice(1)
    if (cards.length === 0) break
    let kept = 0
    for (const card of cards) {
      const hrefMatch = card.match(/href="\/aircraft\/(\d+)-([^"]*)"/)
      if (!hrefMatch) continue
      const sourceId = hrefMatch[1]
      if (seen.has(sourceId)) continue
      seen.add(sourceId)

      const slug = hrefMatch[2]
      const { year, make, model, state, location } = parseSlug(slug)

      const priceMatch = card.match(/item-price'>\s*\$([\d,]+)/)
      const asking_price = priceMatch
        ? parseInt(priceMatch[1].replace(/,/g, ''), 10)
        : null
      const reduced = /item-badge-left'>\s*Price Reduced/i.test(card)

      const titleMatch = card.match(/item-title"[^>]*>([^<]+)/)
      const titleText = titleMatch ? decode(titleMatch[1]) : ''
      const title =
        [year, make, model].filter(Boolean).join(' ') || titleText || 'Aircraft'

      all.push({
        source_id: sourceId,
        source_url: `${BASE}/aircraft/${sourceId}-${slug}`,
        make,
        model,
        year,
        title,
        description: null,
        asking_price,
        price_text: asking_price
          ? `$${asking_price.toLocaleString('en-US')}`
          : reduced
            ? 'Price Reduced'
            : null,
        location,
        state,
      })
      kept++
    }
    log(`  page ${page}  ${kept} listings`)
    if (kept === 0) break
    await sleep(1000)
  }
  return all
}
