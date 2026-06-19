/**
 * Hangar67.com adapter — the cleanest source in the landscape.
 *
 * Hangar67 publishes a public per-listing JSON feed (advertised in its
 * /llms.txt). We enumerate active listings from its sitemap and pull each
 * listing's structured JSON — no HTML parsing required.
 *
 *   sitemap index    → /sitemap.xml
 *   active listings  → /sitemap-aircraft-active.xml   (url ends /{id})
 *   per-listing JSON → /feed/aircraft/{id}
 *
 * Feed fields: id, url, title, year, make, model, category, registration,
 * serial_number, status, price, price_display, location{city,state,country},
 * total_time.
 */

import {
  fetchHtml,
  fetchJson,
  mapPool,
  sleep,
  parseSitemapLocs,
  stateCodeFromName,
  titleCase,
} from '../lib/ingest-core.mjs'

const BASE = 'https://www.hangar67.com'

export const source = 'hangar67'
export const label = 'Hangar67'

function toRow(d) {
  if (!d || d.error || !d.id) return null
  const year = d.year ? parseInt(d.year, 10) : null
  const price =
    typeof d.price === 'number' ? Math.round(d.price) : d.price ? parseInt(d.price, 10) : null

  let location = null
  let state = null
  const loc = d.location || {}
  if (loc.state) {
    state = stateCodeFromName(loc.state)
    const city = loc.city ? titleCase(loc.city) : null
    location = city ? `${city}${state ? `, ${state}` : ''}` : (state ?? loc.state)
  } else if (loc.city) {
    location = titleCase(loc.city)
  }

  const ttaf = typeof d.total_time === 'number' ? Math.round(d.total_time) : null

  return {
    source_id: String(d.id),
    source_url: d.url || `${BASE}/aircraft/${d.id}`,
    make: d.make || null,
    model: d.model || null,
    year: Number.isFinite(year) ? year : null,
    registration: d.registration || null,
    ttaf,
    title: d.title || [year, d.make, d.model].filter(Boolean).join(' ') || 'Aircraft',
    description: null,
    asking_price: Number.isFinite(price) ? price : null,
    price_text: d.price_display || (Number.isFinite(price) ? `$${price.toLocaleString('en-US')}` : null),
    location,
    state,
  }
}

export async function fetchListings({ pages, maxListings = 2000, log = console.log } = {}) {
  // `pages` (used by other adapters) doesn't apply; we read the full sitemap.
  const xml = await fetchHtml(`${BASE}/sitemap-aircraft-active.xml`)
  const urls = parseSitemapLocs(xml)
  const ids = urls
    .map((u) => (u.match(/\/(\d+)\/?$/) || [])[1])
    .filter(Boolean)
    .slice(0, maxListings)
  log(`  ${ids.length} active listings in sitemap`)

  // Hangar67 rate-limits aggressively (HTTP 429) on bursts — concurrency 8
  // tripped an IP throttle that took ~70% of fetches down and then blocked
  // even the sitemap. Keep this gentle (concurrency 3 + jitter); a partial run
  // is fine because the 7-day sold grace means missed listings aren't dropped,
  // and successive daily runs accumulate full coverage. fetchJson retries with
  // backoff on top of this.
  let done = 0
  let ok = 0
  const rows = await mapPool(ids, 3, async (id) => {
    await sleep(100 + (id.charCodeAt(id.length - 1) % 10) * 20)
    const d = await fetchJson(`${BASE}/feed/aircraft/${id}`).catch(() => null)
    if (d && !d.error) ok++
    if (++done % 250 === 0) log(`  fetched ${done}/${ids.length} (${ok} ok)`)
    return toRow(d)
  })
  log(`  ${ok}/${ids.length} feeds OK`)

  return rows.filter(Boolean)
}
