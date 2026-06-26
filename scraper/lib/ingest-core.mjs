/**
 * Generic ingestion core for the Planes-for-Sale aggregator.
 *
 * An *adapter* is a module exporting:
 *   { source: string, label: string, fetchListings(opts) => Promise<Row[]> }
 * where each Row is a normalized aircraft_for_sale shape (without freshness
 * bookkeeping — the runner fills that in).
 *
 * runIngest() owns everything source-agnostic:
 *   - content hashing (to detect *any* change to a listing)
 *   - price-change detection (records previous_price + price_changed_at)
 *   - upsert by (source, source_id)
 *   - sold-detection: listings not seen in this run are marked status='sold'
 *
 * We are a search layer that links back to the source — every row keeps its
 * source_url and we never claim to be the seller.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(__dirname, '..', '..')

export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Full browser header set — reduces Cloudflare/WAF blocking on VPS IPs.
// Only User-Agent was previously sent; missing Accept/Sec-Fetch headers trigger
// 520s (Cloudflare) and 405s on sites that fingerprint request headers.
export const BROWSER_HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'max-age=0',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Sec-Ch-Ua': '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
}

// ── env ───────────────────────────────────────────────────────────────────────
export function loadEnvLocal() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let val = m[2].trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val
    }
  } catch {
    /* env may come from the shell */
  }
}

// ── fetch + html helpers ────────────────────────────────────────────────────────
// Retry-After is either a delay in seconds or an HTTP date. Returns ms, or null.
function parseRetryAfter(h) {
  if (!h) return null
  const secs = Number(h)
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000)
  const at = Date.parse(h)
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null
}

// Fetch with exponential backoff + jitter. Errors carry `.status` and (for 429)
// `.retryAfter` (ms) so callers can coordinate a shared throttle. Non-429 4xx are
// thrown immediately — a 404/403 won't fix itself, so retrying just wastes time.
export async function fetchHtml(url, { retries = 2, timeoutMs = 20000 } = {}) {
  let lastErr
  for (let i = 0; i <= retries; i++) {
    try {
      const signal = typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined
      const res = await fetch(url, { headers: BROWSER_HEADERS, signal })
      if (res.ok) return res.text()
      const err = new Error(`HTTP ${res.status}`)
      err.status = res.status
      if (res.status === 429 || res.status === 503) err.retryAfter = parseRetryAfter(res.headers.get('retry-after'))
      if (res.status >= 400 && res.status < 500 && res.status !== 429) throw err // permanent
      lastErr = err
    } catch (e) {
      if (e.status && e.status >= 400 && e.status < 500 && e.status !== 429) throw e
      lastErr = e
    }
    if (i < retries) await sleep((lastErr?.retryAfter ?? 800 * 2 ** i) + Math.floor(Math.random() * 400))
  }
  throw lastErr
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function fetchJson(url, opts) {
  const text = await fetchHtml(url, opts)
  return JSON.parse(text)
}

// Run an async fn over items with bounded concurrency; preserves order.
export async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      try {
        results[i] = await fn(items[i], i)
      } catch {
        results[i] = null
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

// Pull all <loc> URLs out of a sitemap XML string.
export function parseSitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

export function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#149;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stripTags(html) {
  return decode(html.replace(/<[^>]+>/g, ' '))
}

export function titleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

const YEAR_RE = /\b(19[2-9]\d|20[0-2]\d)\b/
export function extractYear(...texts) {
  for (const t of texts) {
    const m = t && t.match(YEAR_RE)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

// First plausible USD figure (≥ $2,000 to skip parts/avionics prices, ≤ $50M).
export function extractPrice(text) {
  const matches = [...text.matchAll(/\$\s?([\d]{1,3}(?:,\d{3})+|\d{4,})/g)]
  for (const m of matches) {
    const n = parseInt(m[1].replace(/,/g, ''), 10)
    if (n >= 2000 && n <= 50_000_000) {
      return { price: n, priceText: `$${n.toLocaleString('en-US')}` }
    }
  }
  const phrase = text.match(/\b(make offer|auction|call for price|price reduced|obo)\b/i)
  return phrase ? { price: null, priceText: titleCase(phrase[0]) } : {}
}

// US state name → 2-letter code, for sources that spell out the state.
const STATE_CODES = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH',
  'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
  'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN',
  texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA',
  'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
}
const VALID_CODES = new Set(Object.values(STATE_CODES))

export function stateCodeFromName(name) {
  if (!name) return null
  const key = name.trim().toLowerCase()
  if (VALID_CODES.has(key.toUpperCase())) return key.toUpperCase()
  return STATE_CODES[key] ?? null
}

// Scan free text (e.g. a location slug "milton-delaware-united-states") for a US
// state name and return its code. Prefers multi-word names and later matches.
const STATE_NAME_ENTRIES = Object.entries(STATE_CODES).sort((a, b) => b[0].length - a[0].length)
export function findStateInText(text) {
  if (!text) return null
  const hay = ` ${text.toLowerCase().replace(/[^a-z]+/g, ' ')} `
  for (const [name, code] of STATE_NAME_ENTRIES) {
    if (hay.includes(` ${name} `)) return code
  }
  return null
}

// "Located in CITY, ST" (aircraft) preferred; fall back to broker "located City, ST".
export function extractLocation(text) {
  let m = text.match(/Located in\s+([A-Za-z .'-]+),\s*([A-Z]{2})\b/)
  if (!m) m = text.match(/located\s+([A-Za-z .'-]+),\s*([A-Z]{2})\b/)
  if (!m) return {}
  const city = m[1].replace(/\s+/g, ' ').trim()
  const state = m[2]
  if (!VALID_CODES.has(state)) return {}
  return { location: `${titleCase(city)}, ${state}`, state }
}

// Stable hash of the fields that define "did this listing change".
export function contentHash(row) {
  const basis = [
    row.title,
    row.asking_price ?? '',
    row.price_text ?? '',
    row.location ?? '',
    row.year ?? '',
    (row.description ?? '').slice(0, 500),
  ].join('|')
  return createHash('sha1').update(basis).digest('hex')
}

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/**
 * Upsert a source's rows, track price history, and mark vanished listings sold.
 * Returns stats. Pass dryRun to skip all writes.
 */
export async function runIngest({ source, rows, dryRun = false, graceDays = 7 }) {
  const nowIso = new Date().toISOString()
  // Sold-detection grace window: a listing is only marked sold once it hasn't
  // been seen for `graceDays`. This tolerates partial runs and sources (e.g.
  // Barnstormers) whose result pages reorder between runs, which would
  // otherwise cause false "sold" for listings that simply scrolled off our
  // scrape depth on a given day.
  const soldCutoff = new Date(Date.parse(nowIso) - graceDays * 86_400_000).toISOString()

  // De-dup within this batch (last write wins).
  const byId = new Map()
  for (const r of rows) {
    if (!r.source_id || !r.title) continue
    byId.set(r.source_id, { ...r, source, content_hash: contentHash(r) })
  }
  const fresh = [...byId.values()]

  const stats = { source, scraped: fresh.length, priceDrops: 0, priceRises: 0, changed: 0, markedSold: 0 }
  if (dryRun) return stats

  const supabase = adminClient()

  // Pull existing rows for this source to diff prices and preserve first_seen_at.
  const { data: existingRows, error: exErr } = await supabase
    .from('aircraft_for_sale')
    .select('source_id, asking_price, content_hash, previous_price, price_changed_at, first_seen_at')
    .eq('source', source)
  if (exErr) throw new Error(`fetch existing failed: ${exErr.message}`)
  const existing = new Map((existingRows ?? []).map((e) => [e.source_id, e]))

  const upserts = fresh.map((r) => {
    const prev = existing.get(r.source_id)
    const out = {
      ...r,
      status: 'active',
      removed_at: null,
      last_seen_at: nowIso,
      first_seen_at: prev?.first_seen_at ?? nowIso,
      previous_price: prev?.previous_price ?? null,
      price_changed_at: prev?.price_changed_at ?? null,
    }
    if (prev) {
      if (r.content_hash !== prev.content_hash) stats.changed++
      const a = r.asking_price
      const b = prev.asking_price
      if (a != null && b != null && a !== b) {
        out.previous_price = b
        out.price_changed_at = nowIso
        if (a < b) stats.priceDrops++
        else stats.priceRises++
      }
    }
    return out
  })

  // Upsert in batches.
  const BATCH = 100
  for (let i = 0; i < upserts.length; i += BATCH) {
    const batch = upserts.slice(i, i + BATCH)
    const { error } = await supabase
      .from('aircraft_for_sale')
      .upsert(batch, { onConflict: 'source,source_id' })
    if (error) throw new Error(`upsert failed: ${error.message}`)
  }

  // Sold-detection: anything from this source not touched this run is gone.
  const { data: sold, error: soldErr } = await supabase
    .from('aircraft_for_sale')
    .update({ status: 'sold', removed_at: nowIso })
    .eq('source', source)
    .eq('status', 'active')
    .lt('last_seen_at', soldCutoff)
    .select('source_id')
  if (soldErr) throw new Error(`sold-detection failed: ${soldErr.message}`)
  stats.markedSold = sold?.length ?? 0

  return stats
}
