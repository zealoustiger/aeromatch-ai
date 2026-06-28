#!/usr/bin/env node
/**
 * Partnership listings ingester — ADMIN-ONLY across all sources.
 *
 * Aggregates aircraft-partnership / shared-ownership classifieds from:
 *   - Barnstormers /category-20719-Partnerships.html  (free, static HTML)
 *   - Controller   keyword search "shared ownership" + "partnership" (Cloudflare,
 *                  Unlocker-gated)
 *   - Trade-A-Plane "Shares & Partnerships" category   (often near-empty but
 *                  cheap to check)
 *
 * Like ingest-controller.mjs, this:
 *  - stores rows as status='admin' (public marketplace gate is 'active'), so
 *    nothing leaks to users — only the admin /admin/listings view shows them,
 *  - dedups by (source, source_id) — partnership ads rarely list an N-number,
 *  - keeps the source_url so the admin can click through to the original.
 *
 * Usage: node scraper/ingest-partnerships.mjs [--source=barnstormers|controller|tap]
 *                                             [--max-pages=5] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js'
import {
  fetchHtml,
  loadEnvLocal,
  sleep,
  decode,
  stripTags,
  extractPrice,
  extractLocation,
  extractYear,
} from './lib/ingest-core.mjs'
import { unlockerFetch, hasUnlocker } from './lib/unlocker.mjs'

loadEnvLocal()
const args = process.argv.slice(2)
const arg = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d }
const ONLY = arg('source', '')
const MAX_PAGES = parseInt(arg('max-pages', '5'), 10)
const DRY = args.includes('--dry-run')

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)
const log = (...a) => console.log(...a)

// ── helpers ──────────────────────────────────────────────────────────────────

const KNOWN_MAKES = [
  'Cessna', 'Piper', 'Cirrus', 'Beechcraft', 'Beech', 'Mooney', 'Diamond',
  'Grumman', 'Bellanca', 'Bonanza', 'Lear', 'Learjet', 'Citation', 'King Air',
  'Hawker', 'Gulfstream', 'Pilatus', 'TBM', 'Daher', 'Eclipse', 'Honda',
  'Embraer', 'Phenom', 'Vans', "Van's", 'RV-', 'Lancair', 'Glasair',
  'Aviat', 'Husky', 'Maule', 'Champion', 'Aeronca', 'Stinson', 'Globe',
  'Ercoupe', 'Luscombe', 'Taylorcraft', 'Cub', 'PA-', 'Sling',
]
const SHARE_KEYWORDS = ['1/2', '½', '1/3', '⅓', '1/4', '¼', 'half', 'third', 'quarter', 'leaseback', 'partnership']

function guessMake(title) {
  const t = (title || '').toLowerCase()
  for (const m of KNOWN_MAKES) {
    const needle = m.toLowerCase()
    if (t.includes(needle)) return m === 'Beech' ? 'Beechcraft' : m
  }
  return 'Unknown'
}

function guessShareType(text) {
  const t = (text || '').toLowerCase()
  if (/(1\/2|½|\bhalf\b)/.test(t)) return '1/2'
  if (/(1\/3|⅓|\bthird\b)/.test(t)) return '1/3'
  if (/(1\/4|¼|\bquarter\b)/.test(t)) return '1/4'
  if (/leaseback/.test(t)) return 'leaseback'
  if (/dry\s*lease/.test(t)) return 'dry_lease'
  return 'other'
}

const cleanTitle = (s) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 240)

function normRow(partial) {
  return {
    // Required NOT NULL columns get safe defaults.
    make: partial.make || 'Unknown',
    model: partial.model || 'Partnership',
    home_airport: partial.home_airport || 'TBD',
    share_type: partial.share_type || 'other',
    title: partial.title || 'Aircraft Partnership',
    // Optional fields
    year: partial.year ?? null,
    registration: partial.registration ?? null,
    city: partial.city ?? null,
    state: partial.state ?? null,
    description: partial.description ?? null,
    images: partial.images ?? [],
    image_is_placeholder: !(partial.images && partial.images.length),
    buy_in_price: partial.buy_in_price ?? null,
    monthly_fixed: partial.monthly_fixed ?? null,
    hourly_wet: partial.hourly_wet ?? null,
    contact_method: 'email',
    // Source bookkeeping
    source: partial.source,
    source_id: partial.source_id,
    source_url: partial.source_url,
    status: 'admin',
    first_seen_at: partial.first_seen_at,
    last_seen_at: partial.last_seen_at,
  }
}

// ── Barnstormers ─────────────────────────────────────────────────────────────
// Mirrors the existing adapters/barnstormers.mjs parser but pointed at the
// partnership category (20719) and routed to a different table.

const BARNSTORMERS_CAT = 20719 // /category-20719-Partnerships.html

function parseBarnstormers(html) {
  const rows = []
  const parts = html.split(/data-adid=["'](\d+)["']/)
  for (let i = 1; i < parts.length; i += 2) {
    const sourceId = parts[i]
    const block = parts[i + 1] || ''

    const headerMatch = block.match(
      /class=["']listing_header["'][^>]*href=["']([^"']+)["'][^>]*>([^<]{3,200})<\/a>/,
    )
    if (!headerMatch) continue
    const href = headerMatch[1]
    const title = cleanTitle(decode(headerMatch[2]))
    if (!title) continue
    // Drop "Wanted" ads — the partnership category mixes seekers and sellers; we
    // only want the seller side here (the seeker side is /partnerships/seeking).
    if (/\b(wanted|wtb|looking\s+for)\b/i.test(title)) continue

    const sourceUrl = href.startsWith('http')
      ? href
      : `https://www.barnstormers.com${href.startsWith('/') ? '' : '/'}${href}`

    const text = stripTags(block)
    let desc = text
    const titleIdx = desc.indexOf(title)
    if (titleIdx >= 0) desc = desc.slice(titleIdx + title.length)
    desc = desc.split(/·\s*Contact/i)[0].replace(/^[\s·•-]+/, '').trim().slice(0, 1500)
    if (/\b(wanted|wtb|looking\s+for)\b/i.test(desc.slice(0, 200))) continue

    const { price } = extractPrice(text)
    const { location, state } = extractLocation(text)
    const year = extractYear(title, desc)
    const make = guessMake(title)
    const shareType = guessShareType(`${title} ${desc}`)

    const imgs = [...block.matchAll(/<img[^>]+src=["']([^"']*media\/listing_images[^"']+)["']/gi)]
      .map((m) => m[1].replace(/\?[^"']*$/, '').replace('/thumbnail/thumbnail_image_', '/large/large_image_'))

    rows.push({
      source_id: sourceId,
      source_url: sourceUrl,
      title,
      description: desc || null,
      make,
      year,
      share_type: shareType,
      buy_in_price: price ?? null,
      city: location?.split(',')[0]?.trim() || null,
      state,
      images: imgs,
    })
  }
  return rows
}

async function scrapeBarnstormers({ pages }) {
  log(`\n— Barnstormers (cat ${BARNSTORMERS_CAT}, ${pages} pages)`)
  const all = []
  const seen = new Set()
  for (let p = 1; p <= pages; p++) {
    const url = `https://www.barnstormers.com/category-${BARNSTORMERS_CAT}-Partnerships.html${p > 1 ? `?page=${p}` : ''}`
    try {
      const html = await fetchHtml(url)
      const rows = parseBarnstormers(html)
      if (!rows.length) { log(`  p${p}: 0 → end`); break }
      let netNew = 0
      for (const r of rows) {
        if (seen.has(r.source_id)) continue
        seen.add(r.source_id)
        all.push(r)
        netNew++
      }
      log(`  p${p}: ${rows.length} parsed, +${netNew} net-new`)
    } catch (e) {
      log(`  p${p} error: ${e.message}`)
      break
    }
    await sleep(800)
  }
  return all.map((r) => ({ ...r, source: 'barnstormers-partnerships' }))
}

// ── Controller ──────────────────────────────────────────────────────────────
// Controller has no formal partnership category — it's keyword search across
// the full aircraft inventory. We probe two phrases that catch the public-facing
// "Shared Ownership" / "Partnership" listings.

function parseControllerSearch(html) {
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
          state: addr.addressRegion || '', city: addr.addressLocality || null,
        })
      }
    }
    for (const k in o) visit(o[k])
  }
  for (const b of blocks) { try { visit(JSON.parse(b)) } catch {} }
  return out
}

async function scrapeController({ pages }) {
  if (!hasUnlocker()) { log('\n— Controller SKIPPED (BRIGHTDATA_API_TOKEN not set)'); return [] }
  log(`\n— Controller (keyword search, ${pages} pages each phrase)`)
  const out = []
  const seen = new Set()
  for (const phrase of ['shared ownership', 'partnership']) {
    log(`  phrase: "${phrase}"`)
    for (let p = 1; p <= pages; p++) {
      const url = `https://www.controller.com/listings/for-sale/aircraft?Keywords=${encodeURIComponent(phrase)}&page=${p}`
      try {
        const html = await unlockerFetch(url, { retries: 2, minBytes: 20000 })
        const offers = parseControllerSearch(html)
        if (!offers.length) { log(`    p${p}: 0 → end`); break }
        let netNew = 0
        for (const o of offers) {
          if (seen.has(o.id)) continue
          seen.add(o.id)
          out.push(o)
          netNew++
        }
        log(`    p${p}: ${offers.length}, +${netNew} net-new`)
      } catch (e) {
        log(`    p${p} error: ${e.message}`)
        break
      }
    }
  }
  // Detail-fetch each candidate so we get description + images.
  log(`  fetching ${out.length} detail pages...`)
  const rows = []
  for (const o of out) {
    try {
      const h = await unlockerFetch(o.url, { retries: 1, minBytes: 20000 })
      const descMatch = h.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      const desc = decode(descMatch?.[1] || '').slice(0, 1500)
      const ogImg = (h.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || [])[1]
      const imgs = ogImg ? [ogImg] : []
      const year = (o.name.match(/^(\d{4})\b/) || [])[1]
      const titleCase = (s) => (s ? s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : s)
      rows.push({
        source_id: o.id,
        source_url: o.url,
        title: cleanTitle(o.name || `${o.make} ${o.model}`.trim()),
        description: desc || null,
        make: titleCase(o.make) || guessMake(o.name),
        model: titleCase(o.model) || null,
        year: year ? +year : null,
        share_type: guessShareType(`${o.name} ${desc}`),
        buy_in_price: o.price,
        city: o.city,
        state: o.state === 'California' ? 'CA' : o.state || null,
        images: imgs,
      })
    } catch (e) {
      log(`    detail fail ${o.id}: ${e.message}`)
    }
  }
  return rows.map((r) => ({ ...r, source: 'controller-partnerships' }))
}

// ── Trade-A-Plane ───────────────────────────────────────────────────────────
// Tiny inventory historically (often 0). We probe and bail fast if empty.

async function scrapeTAP({ pages }) {
  log(`\n— Trade-A-Plane (Shares & Partnerships)`)
  const out = []
  const seen = new Set()
  for (let p = 1; p <= pages; p++) {
    const url = `https://www.trade-a-plane.com/search?s-type=aircraft&category_level1=Shares+%26+Partnerships&page=${p}`
    try {
      const html = await (hasUnlocker() ? unlockerFetch(url, { retries: 1, minBytes: 5000 }) : fetchHtml(url))
      // TAP shows result count in <title>: "Shares & Partnerships For Sale - Used & New X - Y"
      const totalMatch = html.match(/Used\s*&\s*New\s*\d+\s*-\s*(\d+)/i) || html.match(/(\d+)\s+results?/i)
      const total = totalMatch ? parseInt(totalMatch[1], 10) : null
      if (p === 1 && total === 0) { log(`  0 listings (empty category) — skipping`); return [] }
      // TAP listing links: /aircraft-for-sale/.../<id> or similar
      const listingLinks = [...html.matchAll(/href=["'](\/aircraft-for-sale\/[^"']+\/(\d{6,})[^"']*)["']/g)]
        .map((m) => ({ href: m[1], id: m[2] }))
      const unique = []
      for (const l of listingLinks) {
        if (seen.has(l.id)) continue
        seen.add(l.id); unique.push(l)
      }
      if (!unique.length) { log(`  p${p}: 0 listings`); break }
      log(`  p${p}: ${unique.length} listings`)
      for (const l of unique) {
        const url = `https://www.trade-a-plane.com${l.href}`
        // Title heuristic: look for an <h1> near the listing link OR fall back to URL slug
        const slug = l.href.split('/').filter(Boolean).slice(-2, -1)[0]?.replace(/-/g, ' ') ?? 'Aircraft Partnership'
        out.push({
          source_id: l.id,
          source_url: url,
          title: cleanTitle(slug),
          make: guessMake(slug),
          share_type: 'other',
        })
      }
    } catch (e) {
      log(`  p${p} error: ${e.message}`)
      break
    }
    await sleep(800)
  }
  return out.map((r) => ({ ...r, source: 'tap-partnerships' }))
}

// ── upsert + sweep ──────────────────────────────────────────────────────────

async function upsertRows(rows, now) {
  if (!rows.length) return 0
  const sources = [...new Set(rows.map((r) => r.source))]
  const { data: existing } = await supa
    .from('partnerships')
    .select('source, source_id, first_seen_at')
    .in('source', sources)
  const firstSeen = new Map((existing || []).map((r) => [`${r.source}:${r.source_id}`, r.first_seen_at]))

  const payload = rows.map((r) => normRow({
    ...r,
    first_seen_at: firstSeen.get(`${r.source}:${r.source_id}`) ?? now,
    last_seen_at: now,
  }))
  if (DRY) {
    log(`\nDRY RUN: would upsert ${payload.length} rows`)
    log(JSON.stringify(payload[0], null, 2))
    return 0
  }
  let upserted = 0
  for (let i = 0; i < payload.length; i += 100) {
    const slice = payload.slice(i, i + 100)
    const { error } = await supa.from('partnerships').upsert(slice, { onConflict: 'source,source_id' })
    if (error) log('  upsert error:', error.message)
    else upserted += slice.length
  }
  return upserted
}

async function main() {
  const now = new Date().toISOString()
  log(`Partnership ingest ${DRY ? '(DRY RUN)' : ''}${ONLY ? ` — source=${ONLY}` : ''}`)
  const all = []
  if (!ONLY || ONLY === 'barnstormers') all.push(...await scrapeBarnstormers({ pages: MAX_PAGES }))
  if (!ONLY || ONLY === 'controller')   all.push(...await scrapeController({ pages: Math.min(MAX_PAGES, 3) }))
  if (!ONLY || ONLY === 'tap')          all.push(...await scrapeTAP({ pages: MAX_PAGES }))

  log(`\nTotal scraped: ${all.length} rows across ${new Set(all.map((r) => r.source)).size} source(s).`)
  const upserted = await upsertRows(all, now)
  log(`Upserted ${upserted} (status='admin', not visible publicly).`)
}

main().catch((e) => { console.error(e); process.exit(1) })
