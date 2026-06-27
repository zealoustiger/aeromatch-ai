#!/usr/bin/env node
/**
 * Controller.com Bay-Area ingester — ADMIN-ONLY, dedup-first.
 *
 * Controller is a commercial competitor (not a free board like Barnstormers, nor
 * AI-friendly like Hangar67), so to limit ToS/copyright exposure this:
 *  - scopes to the SF Bay Area only (cheap: filters by ZIP from the search-page
 *    JSON-LD, so we only detail-fetch Bay-Area listings),
 *  - keeps ONLY aircraft we don't already have (dedup by N-number),
 *  - stores them as status='admin', so the public `status='active'` gate hides
 *    them everywhere — they show to admins only,
 *  - links to the Controller source (source_url); never the primary marketplace.
 *
 * Needs the Web Unlocker (Controller is Cloudflare-gated): BRIGHTDATA_API_TOKEN.
 * Usage: node scraper/ingest-controller.mjs [--max-pages=400] [--concurrency=5] [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './lib/ingest-core.mjs'
import { unlockerFetch, hasUnlocker } from './lib/unlocker.mjs'

loadEnvLocal()
const args = process.argv.slice(2)
const arg = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d }
const MAX_PAGES = parseInt(arg('max-pages', '400'), 10)
const DETAIL_CONC = Math.max(1, parseInt(arg('concurrency', '5'), 10))
const DRY = args.includes('--dry-run')

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const log = (...a) => console.log(...a)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 9-county SF Bay Area ZIP-3 prefixes → area label (the listing's stated postal
// code is the location signal; the detail page's city is often the dealer's HQ).
const BAY_AREA = {
  '940': 'Peninsula', '941': 'San Francisco', '943': 'Palo Alto', '944': 'San Mateo',
  '945': 'East Bay / Napa', '946': 'Oakland', '947': 'Berkeley', '948': 'Concord / Richmond',
  '949': 'Marin', '950': 'San Jose / Santa Clara', '951': 'San Jose', '954': 'Santa Rosa / Sonoma',
}
const BAY = new Set(Object.keys(BAY_AREA))
const SEARCH = 'https://www.controller.com/listings/for-sale/aircraft'

const normReg = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const titleCase = (s) => (s ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s)

// Per-listing Offer JSON-LD on a search page → {id, url, price, name, make, model, zip, region}.
// Parse REAL JSON-LD objects (not positional regex) so url↔zip↔price always come
// from the SAME listing — positional pairing misaligns when counts differ per page.
function parseSearchOffers(html) {
  const out = []
  const seen = new Set()
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])
  const visit = (o) => {
    if (!o || typeof o !== 'object') return
    if (Array.isArray(o)) { o.forEach(visit); return }
    if (o['@type'] === 'Offer' && typeof o.url === 'string' && o.url.includes('/listing/for-sale/')) {
      const id = (o.url.match(/for-sale\/(\d+)\//) || [])[1]
      if (id && !seen.has(id)) {
        seen.add(id)
        const prod = o.itemOffered || {}
        const addr = (o.availableAtOrFrom && o.availableAtOrFrom.address) || {}
        out.push({
          id, url: 'https://www.controller.com' + o.url,
          price: Math.round(+o.price) || null,
          name: prod.name || '', make: prod.manufacturer || '', model: prod.model || '',
          zip: addr.postalCode || '', region: addr.addressRegion || '',
        })
      }
    }
    for (const k in o) visit(o[k])
  }
  for (const b of blocks) { try { visit(JSON.parse(b)) } catch {} }
  return out
}

const yearOf = (name) => { const m = (name || '').match(/^(\d{4})\b/); return m ? +m[1] : null }
function pickN(h) {
  const c = {}
  for (const m of h.matchAll(/\bN[0-9]{1,5}[A-Z]{0,2}\b/g)) c[m[0]] = (c[m[0]] || 0) + 1
  const e = Object.entries(c).filter(([k, v]) => v >= 2 && k.length >= 4).sort((a, b) => b[1] - a[1])
  return e[0]?.[0] || null
}
function detailPhotos(h) {
  const og = (h.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || [])[1]
  const imgs = [...new Set([...h.matchAll(/https:\/\/[^"']*controller[^"']*\.(?:jpe?g|png)[^"']*/gi)].map((m) => m[0]))]
  const out = []
  if (og) out.push(og)
  for (const u of imgs) if (!out.includes(u)) out.push(u)
  return out.slice(0, 8)
}
const cityOf = (h) => (h.match(/"addressLocality":"([^"]+)"/) || [])[1] || null

async function pool(items, n, fn) {
  const q = [...items]
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { for (let x; (x = q.shift());) await fn(x) }))
}

async function main() {
  if (!hasUnlocker()) { console.error('BRIGHTDATA_API_TOKEN not set — Controller needs the Web Unlocker.'); process.exit(1) }
  log(`Controller Bay-Area ingest ${DRY ? '(DRY RUN)' : ''} — up to ${MAX_PAGES} pages`)

  const { data: reg } = await supa.from('aircraft_for_sale').select('registration').not('registration', 'is', null).limit(50000)
  const known = new Set((reg || []).map((r) => normReg(r.registration)).filter((x) => x.length >= 4))
  log(`Known registrations on file (dedup against): ${known.size}`)

  // 1) Crawl search pages → Bay-Area candidates (cheap; JSON-LD only)
  const bay = []
  const seen = new Set()
  let page = 1, empty = 0
  for (; page <= MAX_PAGES; page++) {
    let offers = []
    try { offers = parseSearchOffers(await unlockerFetch(`${SEARCH}?page=${page}`, { retries: 3, minBytes: 20000 })) }
    catch (e) { log(`  page ${page} failed: ${e.message}`) }
    if (!offers.length) { if (++empty >= 3) break; continue }
    empty = 0
    let added = 0
    for (const o of offers) {
      if (!o.id || seen.has(o.id)) continue
      seen.add(o.id)
      if (o.region === 'California' && BAY.has((o.zip || '').slice(0, 3))) { bay.push(o); added++ }
    }
    if (page % 25 === 0 || added) log(`  page ${page}: ${offers.length} listings, +${added} Bay Area (total ${bay.length})`)
    await sleep(150)
  }
  log(`\nScanned ${seen.size} listings / ${page - 1} pages → ${bay.length} Bay-Area candidates`)

  // 2) Detail-fetch Bay-Area candidates → N-number + photos, dedup by N-number
  const net = []
  let dupes = 0, noN = 0, fail = 0
  await pool(bay, DETAIL_CONC, async (c) => {
    try {
      const h = await unlockerFetch(c.url, { retries: 3, minBytes: 30000 })
      const n = pickN(h)
      if (!n) { noN++; return }
      if (known.has(normReg(n))) { dupes++; return }
      const photos = detailPhotos(h)
      const area = BAY_AREA[(c.zip || '').slice(0, 3)] || 'Bay Area'
      net.push({
        source: 'controller', source_id: c.id, source_url: c.url,
        make: titleCase(c.make), model: titleCase(c.model), year: yearOf(c.name),
        registration: n, asking_price: c.price, price_text: c.price ? `$${c.price.toLocaleString('en-US')}` : null,
        location: `${area}, CA ${c.zip}`, state: 'CA',
        images: photos, image_is_placeholder: photos.length === 0,
      })
    } catch { fail++ }
  })
  log(`Bay-Area detail: ${net.length} NET-NEW | ${dupes} already-in-inventory | ${noN} no-N | ${fail} fetch-fail`)

  if (DRY) {
    log('\nDRY RUN — sample net-new:')
    net.slice(0, 10).forEach((r) => log(`  ${[r.year, r.make, r.model].filter(Boolean).join(' ')} | ${r.registration} | ${r.location} | ${r.price_text || 'call'} | ${r.images.length} photos`))
    return
  }

  // 3) Upsert net-new as ADMIN-ONLY (status='admin' → hidden from public active gate)
  const nowIso = new Date().toISOString()
  const { data: existing } = await supa.from('aircraft_for_sale').select('source_id, first_seen_at').eq('source', 'controller')
  const firstSeen = new Map((existing || []).map((r) => [r.source_id, r.first_seen_at]))
  const rows = net.map((r) => ({ ...r, status: 'admin', first_seen_at: firstSeen.get(r.source_id) ?? nowIso, last_seen_at: nowIso }))
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supa.from('aircraft_for_sale').upsert(rows.slice(i, i + 200), { onConflict: 'source,source_id' })
    if (error) throw new Error('upsert failed: ' + error.message)
  }
  log(`\nDone. Upserted ${rows.length} admin-only Controller (Bay Area) listings.`)
}
main().catch((e) => { console.error(e); process.exit(1) })
