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
  stateCodeFromName,
  titleCase,
  inRefreshSlice,
} from '../lib/ingest-core.mjs'
import { unlockerFetch, hasUnlocker } from '../lib/unlocker.mjs'

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

export async function fetchListings({
  pages,
  maxListings = 2000,
  log = console.log,
  known = new Map(),
  full = false,
  // 1-in-30 per day: everything gets re-read at least monthly regardless of what
  // lastmod claims, so a source that edits without bumping it self-corrects.
  refreshDivisor = 30,
} = {}) {
  // `pages` (used by other adapters) doesn't apply; we read the full sitemap.
  // The sitemap is the run's single point of failure — nothing else can be
  // fetched without it — so it gets the Unlocker fallback too. It is normally
  // edge-cached and readable, but a 403 (datacentre IP) or 429 (we've been
  // throttled) here would otherwise abort the whole adapter.
  const SITEMAP = `${BASE}/sitemap-aircraft-active.xml`
  let xml
  try {
    xml = await fetchHtml(SITEMAP)
  } catch (e) {
    if (!hasUnlocker()) throw e
    log(`  sitemap direct fetch failed (HTTP ${e?.status ?? '?'}) — retrying via Web Unlocker`)
    xml = await unlockerFetch(SITEMAP, { retries: 2, minBytes: 200 })
  }
  // Parse <url> blocks so each id keeps its <lastmod> — the whole cost model
  // below depends on it.
  const entries = []
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = m[1]
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1]
    const id = loc && (loc.match(/\/(\d+)\/?$/) || [])[1]
    if (!id) continue
    entries.push({ id, lastmod: ((block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || '').trim() || null })
  }
  const all = entries.slice(0, maxListings)
  const ids = all.map((e) => e.id)
  log(`  ${ids.length} active listings in sitemap`)
  if (ids.length === 0) throw new Error('sitemap returned no listing ids — source layout changed or blocked')

  // ── Cost gate ───────────────────────────────────────────────────────────────
  // Every feed read is a metered Web Unlocker request, and re-reading all 1465
  // daily bought us almost nothing: the sitemap's own lastmod shows only ~1-16
  // listings change on a given day. So fetch a listing only when it is new, when
  // its lastmod moved, or when the slow rotation brings it up — and report the
  // rest as `touchIds`, which the ingest core treats as "seen at the source"
  // (bumping last_seen_at, and counting toward the collapse guard) without
  // spending a request. `--full` forces the old fetch-everything behaviour.
  const fetchAll = full || known.size === 0
  const toFetch = []
  const touchIds = []
  const refreshOnly = new Set()
  let nNew = 0, nChanged = 0, nRotated = 0
  for (const e of all) {
    const prev = known.get(e.id)
    if (fetchAll) { toFetch.push(e); continue }
    if (!prev) { toFetch.push(e); nNew++; continue }
    if (!e.lastmod || !prev.source_lastmod || e.lastmod !== prev.source_lastmod) {
      toFetch.push(e); nChanged++; continue
    }
    if (inRefreshSlice(e.id, refreshDivisor)) {
      toFetch.push(e); refreshOnly.add(e.id); nRotated++; continue
    }
    touchIds.push(e.id)
  }
  if (!fetchAll) {
    log(
      `  gate: ${toFetch.length} to fetch (${nNew} new, ${nChanged} lastmod-changed, ` +
        `${nRotated} rotation 1/${refreshDivisor}), ${touchIds.length} unchanged → touch only`
    )
  }

  // ── Blocked-source probe ────────────────────────────────────────────────────
  // Hangar67 fronts its JSON feed with Cloudflare, which refuses datacentre IPs.
  // The refusal is NOT a single status code: a residential IP that has been
  // throttled sees 403/429, while the VPS sees 520 (Cloudflare origin error).
  // So don't enumerate codes — probe one known-good listing, and treat ANY
  // failure as "this host can't read the feed directly". Retrying a block is
  // pure latency; it previously burned ~20 min per run for zero rows and starved
  // the adapters queued behind it.
  // HANGAR67_FORCE_UNLOCKER=1 skips the probe — for testing the unlocked path from
  // an IP that isn't blocked, or pinning it on a host we know Cloudflare refuses.
  let useUnlocker = process.env.HANGAR67_FORCE_UNLOCKER === '1' && hasUnlocker()
  // Nothing to fetch means nothing to probe — don't spend a billed request just
  // to confirm a block we won't act on.
  if (toFetch.length === 0) {
    log('  gate cleared every listing — 0 feed requests this run')
    return { rows: [], touchIds }
  }
  try {
    if (useUnlocker) throw Object.assign(new Error('forced'), { status: 0 })
    await fetchJson(`${BASE}/feed/aircraft/${ids[0]}`, { retries: 0 })
  } catch (e) {
    if (!hasUnlocker()) {
      throw new Error(`hangar67 feed unreachable (HTTP ${e?.status ?? '?'}) and BRIGHTDATA_API_TOKEN is not set`)
    }
    useUnlocker = true
    log(`  ⚠ direct feed unavailable (HTTP ${e?.status ?? '?'}) — routing this run through the Web Unlocker`)
  }

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
    // Blocked run: the Unlocker terminates Cloudflare for us, so the shared
    // throttle gate and 429 dance don't apply — it has its own retry/rotation.
    if (useUnlocker) {
      try {
        // retries:0 — each retry is a BILLED request, and a single missed
        // listing costs nothing: the gate re-queues it tomorrow because its
        // stored lastmod still won't match.
        const body = await unlockerFetch(`${BASE}/feed/aircraft/${id}`, { retries: 0, minBytes: 50 })
        return JSON.parse(body)
      } catch {
        return null
      }
    }
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
        // A 403/401 is the edge refusing this IP outright — never retryable.
        if (e?.status === 403 || e?.status === 401) return null
        // Transient (network/timeout/5xx): short local backoff, a couple tries.
        if (attempt < 2) { await sleep(500 * 2 ** attempt + Math.floor(Math.random() * 300)); continue }
        return null
      }
    }
    return null
  }

  // Fetch listing page HTML and return full-size photo URLs.
  // Hangar67 photo thumbnails: /photos/{id}/{hash}_t.jpg  → full: strip _t suffix.
  // Photos are opportunistic — if rate-limited for >30s or the fetch times out,
  // we return [] and rely on the next daily run to fill them in.
  const fetchPhotos = async (url) => {
    await sleep(300 + Math.floor(Math.random() * 200))
    // Skip rather than freeze if the global throttle gate is backed up.
    if (pauseUntil - Date.now() > 30_000) return []
    for (let attempt = 0; attempt < 2; attempt++) {
      await waitForGate()
      try {
        const html = await fetchHtml(url, { retries: 0, timeoutMs: 8000 })
        // Photos use absolute src= URLs; lazy-loaded similar-listing thumbs use data-src=.
        // Matching only src= (not data-src=) gives us just this listing's photos.
        const matches = [...html.matchAll(/<img[^>]+\bsrc=["'](https:\/\/www\.hangar67\.com\/photos\/[^"']+)["']/gi)]
        return [...new Set(matches.map(m => m[1].replace(/_t\./, '.')))]
      } catch (e) {
        if (e?.status === 429 || e?.status === 503) {
          tripThrottle(Math.min(e.retryAfter ?? 2000 * 2 ** attempt, 15000))
          continue
        }
        return []
      }
    }
    return []
  }

  let done = 0
  let ok = 0
  // Direct: concurrency 2 + jitter to stay under Hangar67's burst threshold.
  // Unlocked: requests leave from Bright Data's residential pool, not us, so our
  // own rate limit is moot and the run is latency-bound (~3s/req) — go wider or
  // 1400+ listings won't finish inside the job's timeout.
  const concurrency = useUnlocker ? 10 : 2
  const rows = await mapPool(toFetch, concurrency, async (e) => {
    const id = e.id
    if (!useUnlocker) await sleep(80 + (id.charCodeAt(id.length - 1) % 10) * 20)
    const d = await fetchFeed(id).catch(() => null)
    if (d && !d.error) ok++
    if (++done % 250 === 0) log(`  fetched ${done}/${toFetch.length} (${ok} ok)`)
    const row = toRow(d)
    if (!row) return null
    // Store the lastmod we acted on, so tomorrow's gate can compare against it.
    row.source_lastmod = e.lastmod
    if (refreshOnly.has(id)) row._refreshOnly = true
    // On an unlocked run, leave photos to the dedicated residential harvester
    // (nightshift-harvest): fetching them inline would double the metered
    // Unlocker requests for images that job already collects. The empty set is
    // safe — ingest-core preserves previously harvested photos rather than
    // clobbering them with [].
    if (useUnlocker) {
      row.images = []
      return row
    }
    const photos = await fetchPhotos(row.source_url)
    row.images = photos.length > 0 ? photos : []
    return row
  })
  const rate = toFetch.length ? Math.round((ok / toFetch.length) * 100) : 100
  log(`  ${ok}/${toFetch.length} feeds OK (${rate}%${throttleHits ? `, ${throttleHits} throttle pauses` : ''})`)
  if (rate < 80) log(`  ⚠ low success rate — source likely throttling; next daily run will fill gaps (7-day sold grace protects active listings)`)

  // A listing whose feed we failed to read must NOT be reported as touched —
  // that would refresh last_seen_at on data we never actually saw. Only ids the
  // gate deliberately skipped are safe to touch.
  return { rows: rows.filter(Boolean), touchIds }
}
