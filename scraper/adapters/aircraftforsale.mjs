/**
 * AircraftForSale.com adapter (Firecrown Media — GA-focused, ~600 listings).
 *
 * Enumerate via the detail sitemap (apex host — the www host 403s):
 *   https://aircraftforsale.com/uploads/sitemap/sitemap_item_detail.xml
 * The listing URL encodes category/make/model/location/id:
 *   /aircraft/{cat}/{make}/{model}/{location}/{slug}-for-sale-{id}
 * Price + total time come from the detail page:
 *   <span id="item_price_{id}" data-item-price="250000">  and
 *   <title>… For Sale, 4003 Hours | …</title>
 *
 * robots.txt: Allow / with Content-Signal search=yes (search indexing welcome).
 */

import {
  fetchHtml,
  mapPool,
  parseSitemapLocs,
  titleCase,
  stateCodeFromName,
  inRefreshSlice,
} from '../lib/ingest-core.mjs'
import { unlockerFetch, hasUnlocker } from '../lib/unlocker.mjs'

const APEX = 'https://aircraftforsale.com'
const SITEMAP = `${APEX}/uploads/sitemap/sitemap_item_detail.xml`

export const source = 'aircraftforsale'
export const label = 'AircraftForSale'

// Location slugs look like "{street?}-{zip?}-{city}-{state}-usa" or
// "...-{city}-{two-word-state}-united-states", and occasionally a foreign
// country (e.g. "...-wa-australia"). Parse out the US state + a best-effort city.
function parseLocation(locSlug) {
  if (!locSlug) return { location: null, state: null }
  let toks = locSlug.split('-').filter(Boolean)

  // Strip the country marker; bail (no US state) if it's clearly foreign.
  if (toks.slice(-2).join(' ') === 'united states') toks = toks.slice(0, -2)
  else if (toks[toks.length - 1] === 'usa') toks = toks.slice(0, -1)
  else if (['australia', 'canada', 'mexico', 'kingdom', 'france', 'germany', 'africa', 'zealand', 'spain', 'italy', 'brazil'].includes(toks[toks.length - 1]))
    return { location: titleCase(toks.join(' ')), state: null }

  let state = null
  // Two-word state name? (new york, north carolina, …)
  const last2 = toks.slice(-2).join(' ')
  const twoWord = toks.length >= 2 ? stateCodeFromName(last2) : null
  if (twoWord) {
    state = twoWord
    toks = toks.slice(0, -2)
  } else if (toks.length) {
    const one = stateCodeFromName(toks[toks.length - 1]) // code (tn) or name (colorado)
    if (one) {
      state = one
      toks = toks.slice(0, -1)
    }
  }

  // City = last alphabetic token of what remains.
  const cityTok = [...toks].reverse().find((t) => /^[a-z]{2,}$/i.test(t))
  const city = cityTok ? titleCase(cityTok) : null
  const location = state ? (city ? `${city}, ${state}` : state) : city
  return { location, state }
}

// /aircraft/{cat}/{make}/{model}/{location}/{slug}-for-sale-{id}
function parseUrl(url) {
  const idMatch = url.match(/for-sale-(\d+)\/?$/)
  if (!idMatch) return null
  const id = idMatch[1]
  const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/aircraft\//, '')
  const segs = path.split('/').filter(Boolean)
  // segs: [cat, make, model, location, titleSlug]
  const make = segs[1] ? titleCase(segs[1].replace(/-/g, ' ')) : null
  const model = segs[2] ? titleCase(segs[2].replace(/-/g, ' ')) : null
  const locSlug = segs.length >= 5 ? segs[3] : null
  const { location, state } = parseLocation(locSlug)
  return { id, make, model, location, state, url }
}

function parseDetail(html, id) {
  const priceMatch =
    html.match(new RegExp(`item_price_${id}"[^>]*data-item-price="(\\d+)"`)) ||
    html.match(/data-item-price="(\d+)"/)
  const asking_price = priceMatch ? parseInt(priceMatch[1], 10) : null

  const titleMatch = html.match(/<title>([^<]+)<\/title>/)
  const titleTag = titleMatch ? titleMatch[1] : ''
  const hoursMatch = titleTag.match(/([\d,]+)\s+Hours/i)
  const ttaf = hoursMatch ? parseInt(hoursMatch[1].replace(/,/g, ''), 10) : null

  const yearMatch = titleTag.match(/\b(19[3-9]\d|20[0-2]\d)\b/)
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null

  return { asking_price, ttaf, year }
}

export async function fetchListings({
  maxListings = 1600,
  log = console.log,
  known = new Map(),
  full = false,
  // 1-in-14 per day. Unlike hangar67 there is no usable per-listing signal (see
  // the gate below), so the rotation IS the price-change detector — it needs to
  // be quicker than hangar67's monthly cycle.
  refreshDivisor = 14,
} = {}) {
  // AircraftForSale's WAF refuses datacentre IPs — the VPS gets HTTP 405 on the
  // sitemap while a residential IP is served normally. Same shape as hangar67:
  // fall the sitemap back to the residential Web Unlocker, then probe one detail
  // page to decide whether the whole run needs to go through it.
  let xml
  try {
    xml = await fetchHtml(SITEMAP)
  } catch (e) {
    if (!hasUnlocker()) throw e
    log(`  sitemap direct fetch failed (HTTP ${e?.status ?? '?'}) — retrying via Web Unlocker`)
    xml = await unlockerFetch(SITEMAP, { retries: 2, minBytes: 200 })
  }
  const idOf = (u) => {
    const m = u.match(/for-sale-(\d+)\/?$/)
    return m ? parseInt(m[1], 10) : 0
  }
  // Sitemap order isn't newest-first, so a plain head-slice re-scrapes the same
  // stale window every run and misses new inventory. Sort by listing id DESC
  // (ids are monotonic) so the cap keeps the NEWEST listings.
  const all = parseSitemapLocs(xml).filter((u) => /for-sale-\d+\/?$/.test(u))
  all.sort((a, b) => idOf(b) - idOf(a))
  const urls = all.slice(0, maxListings)
  log(`  ${all.length} listings in sitemap, taking newest ${urls.length}`)
  if (urls.length === 0) throw new Error('sitemap returned no listing urls — source layout changed or blocked')

  // ── Cost gate ───────────────────────────────────────────────────────────────
  // Every detail page is a metered Web Unlocker request on the VPS. Unlike
  // hangar67, this sitemap's lastmod is worthless — it stamps EVERY listing with
  // the current date on each regeneration — so there is no per-listing change
  // signal to gate on. What saves us instead: the listing URL already encodes
  // make, model, category, location and id, so a known listing costs nothing to
  // re-affirm. Only `asking_price`, `ttaf` and `year` need the page.
  // So: fetch new listings always, and re-read known ones on a rotation.
  // Note these rows are NOT tagged `_refreshOnly`: that marker measures how often
  // an authoritative lastmod LIED, and this source publishes none. Here the
  // rotation is the price-change detector itself, so its catches are the job
  // working, not a gate failure — tagging them would report a false alarm daily.
  const gated = []
  const touchIds = []
  let nNew = 0, nRotated = 0
  for (const url of urls) {
    const meta = parseUrl(url)
    if (!meta) continue
    if (full || !known.has(meta.id)) { gated.push({ url, meta }); if (!full) nNew++; continue }
    if (inRefreshSlice(meta.id, refreshDivisor)) {
      gated.push({ url, meta }); nRotated++; continue
    }
    touchIds.push(meta.id)
  }
  if (!full && known.size > 0) {
    log(
      `  gate: ${gated.length} to fetch (${nNew} new, ${nRotated} rotation 1/${refreshDivisor}), ` +
        `${touchIds.length} known → touch only`
    )
  }

  // Probe one detail page. Any failure means this host can't read them directly,
  // so route the run through the Unlocker rather than collecting 1600 nulls.
  let useUnlocker = false
  // Nothing to fetch means nothing to probe — don't spend a billed request.
  if (gated.length === 0) {
    log('  gate cleared every listing — 0 detail requests this run')
    return { rows: [], touchIds }
  }
  try {
    await fetchHtml(urls[0], { retries: 0 })
  } catch (e) {
    if (!hasUnlocker()) {
      throw new Error(`aircraftforsale detail pages unreachable (HTTP ${e?.status ?? '?'}) and BRIGHTDATA_API_TOKEN is not set`)
    }
    useUnlocker = true
    log(`  ⚠ direct detail fetch unavailable (HTTP ${e?.status ?? '?'}) — routing this run through the Web Unlocker`)
  }
  const getPage = (url) =>
    useUnlocker
      // retries:0 — each retry is a BILLED request and a single missed listing
      // is harmless: a new one is retried tomorrow, a rotated one comes round again.
      ? unlockerFetch(url, { retries: 0, minBytes: 1000 }).catch(() => null)
      : fetchHtml(url).catch(() => null)

  let done = 0
  const rows = await mapPool(gated, useUnlocker ? 10 : 6, async ({ url, meta }) => {
    const html = await getPage(url)
    if (++done % 200 === 0) log(`  fetched ${done}/${gated.length}`)
    if (!html) return null
    const { asking_price, ttaf, year } = parseDetail(html, meta.id)
    const title = [year, meta.make, meta.model].filter(Boolean).join(' ') || 'Aircraft'
    return {
      source_id: meta.id,
      source_url: meta.url,
      make: meta.make,
      model: meta.model,
      year,
      ttaf,
      title,
      description: null,
      asking_price,
      price_text: asking_price ? `$${asking_price.toLocaleString('en-US')}` : null,
      location: meta.location,
      state: meta.state,
    }
  })

  // Only ids the gate deliberately skipped are safe to touch — a page we failed
  // to read must not have its last_seen_at refreshed on unseen data.
  return { rows: rows.filter(Boolean), touchIds }
}
