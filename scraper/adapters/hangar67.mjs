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

  // Hangar67 rate-limits aggressively (HTTP 429) on bursts. The throttle is
  // IP-WIDE, so when it trips, per-request retries don't help — every worker
  // just keeps hammering and they all fail together (~60% loss at concurrency 3).
  // Fix: a SHARED adaptive gate. On a 429 we set a global `pauseUntil` that ALL
  // workers respect, honoring the server's Retry-After, so the whole pool backs
  // off in unison and lets the throttle reset before resuming. Concurrency 2 +
  // jitter keeps us under the burst threshold in the first place. A partial run
  // is still safe (7-day sold grace), but this should push us toward full
  // coverage in a single pass.
  let pauseUntil = 0
  let throttleHits = 0
  const waitForGate = async () => {
    const wait = pauseUntil - Date.now()
    if (wait > 0) await sleep(wait + Math.floor(Math.random() * 250))
  }
  const tripThrottle = (ms) => {
    throttleHits++
    pauseUntil = Math.max(pauseUntil, Date.now() + ms)
  }

  const fetchFeed = async (id) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await waitForGate()
      try {
        return await fetchJson(`${BASE}/feed/aircraft/${id}`, { retries: 0 })
      } catch (e) {
        if (e?.status === 429 || e?.status === 503) {
          // Global cooldown — escalates 2s,4s,8s… capped, honoring Retry-After.
          tripThrottle(Math.min(e.retryAfter ?? 2000 * 2 ** attempt, 30000))
          continue
        }
        // Transient (network/timeout/5xx): short local backoff, a couple tries.
        if (attempt < 2) { await sleep(500 * 2 ** attempt + Math.floor(Math.random() * 300)); continue }
        return null
      }
    }
    return null
  }

  let done = 0
  let ok = 0
  const rows = await mapPool(ids, 2, async (id) => {
    await sleep(80 + (id.charCodeAt(id.length - 1) % 10) * 20)
    const d = await fetchFeed(id).catch(() => null)
    if (d && !d.error) ok++
    if (++done % 250 === 0) log(`  fetched ${done}/${ids.length} (${ok} ok)`)
    return toRow(d)
  })
  const rate = ids.length ? Math.round((ok / ids.length) * 100) : 0
  log(`  ${ok}/${ids.length} feeds OK (${rate}%${throttleHits ? `, ${throttleHits} throttle pauses` : ''})`)
  if (rate < 80) log(`  ⚠ low success rate — source likely throttling; next daily run will fill gaps (7-day sold grace protects active listings)`)

  return rows.filter(Boolean)
}
