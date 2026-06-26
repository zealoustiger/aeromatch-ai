#!/usr/bin/env node
/**
 * Hangar67 photo harvester — RUN FROM A RESIDENTIAL CONNECTION (not the VPS).
 *
 * Hangar67's JSON feed has no photos, and its HTML listing pages are behind a
 * Cloudflare JS challenge that a plain HTTP fetch (and the VPS's datacenter IP)
 * can't pass — so scraped hangar67 listings land with `images=[]` and get hidden
 * from the marketplace (images != '[]' gate). A real browser from a residential
 * IP passes the challenge; the photo assets themselves are then plain-HTTP
 * fetchable. This script drives headless Chromium to read each hidden listing's
 * gallery, extracts `/photos/{id}/{hash}` URLs, upgrades thumbnails (_t) to
 * full-size, validates one, and writes them to aircraft_for_sale.images.
 *
 * Resumable: only touches rows still at images=[] — re-run anytime. Each worker
 * keeps its own browser context, so Cloudflare is solved once per worker then
 * the cf_clearance cookie is reused for the rest of that worker's listings.
 *
 * Usage:
 *   node scraper/harvest-hangar67-photos.mjs --grade=A            # grade-A hidden first
 *   node scraper/harvest-hangar67-photos.mjs --grade=all --limit=50
 *   node scraper/harvest-hangar67-photos.mjs --grade=A --concurrency=3 --dry-run
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import os from 'node:os'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './lib/ingest-core.mjs'

loadEnvLocal()

const args = process.argv.slice(2)
const arg = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d }
const GRADE = (arg('grade', 'A') || 'A').toUpperCase() // A | B | C | ALL
const LIMIT = parseInt(arg('limit', '100000'), 10)
const CONCURRENCY = Math.max(1, parseInt(arg('concurrency', '2'), 10))
const DELAY = parseInt(arg('delay', '600'), 10) // base ms between listings per worker
const MAX_PHOTOS = parseInt(arg('max-photos', '12'), 10)
const DRY = args.includes('--dry-run')
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log(...a)

// Heartbeat the run row so the admin page can show live status (running? rate?
// how many photos? what's left?). Writes the in-memory aggregate snapshot — with
// concurrency 1 there's no race; at higher concurrency it converges (last write).
async function updateRun(stats, extra = {}) {
  if (!stats.runId || DRY) return
  try {
    await supa
      .from('photo_harvest_runs')
      .update({
        processed: stats.done,
        with_photos: stats.withPhotos,
        total_photos: stats.totalPhotos,
        errors: stats.errors,
        last_source_id: stats.lastId ?? null,
        updated_at: new Date().toISOString(),
        ...extra,
      })
      .eq('id', stats.runId)
  } catch {
    /* status reporting is best-effort — never let it break the harvest */
  }
}

async function makeContext(browser) {
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1366, height: 900 } })
  // Block heavy assets we don't need (fonts/media) but KEEP images so the gallery renders.
  await ctx.route('**/*', (route) => {
    const t = route.request().resourceType()
    if (t === 'media' || t === 'font') return route.abort()
    return route.continue()
  })
  return ctx
}

// hangar67-native thumbnail → full-size: strip `_t` before the extension.
const toFull = (u) => u.replace(/_t(\.\w+)(?=$|\?)/i, '$1')

// Non-photo chrome to drop (logos, banners, ad units, sprites, spinners, icons).
const JUNK = /logo|banner|sprite|favicon|avatar|spinner|submit-spin|placeholder|loading|729x90|\/plugins\/|\/themes\/|\.svg(\?|$)|\.gif(\?|$)|clear\.png|icon[-_.]/i

// Collapse WordPress/broker resize variants (`-550x360`, `-scaled`) to one image
// per base, preferring the largest. Keeps galleries from filling with dupes.
const baseKey = (u) => u.replace(/\?.*$/, '').replace(/-\d+x\d+(?=\.\w+$)/i, '').replace(/-scaled(?=\.\w+$)/i, '')
const widthOf = (u) => { const m = u.match(/-(\d+)x\d+(?=\.\w+$)/i); return m ? parseInt(m[1], 10) : 1e9 } // no-resize = largest

// Turn the raw page image list into a clean, deduped, full-size photo set.
function choosePhotos(sid, og, srcs) {
  const abs = (u) => (u && u.startsWith('/') ? 'https://www.hangar67.com' + u : u)
  const all = [og, ...srcs].map(abs).filter((u) => u && /^https?:\/\//.test(u))

  // 1) Prefer hangar67's own gallery — clean and upgradeable to full-size.
  const native = [...new Set(all.filter((u) => u.includes(`/photos/${sid}/`)).map(toFull))]
  if (native.length) return native

  // 2) Broker-hosted: og:image hero + gallery, minus chrome, minus resize dupes.
  const cleaned = all.filter((u) => !JUNK.test(u) && /\.(jpe?g|png|webp)(\?|$)/i.test(u))
  const best = new Map()
  for (const u of cleaned) {
    const k = baseKey(u)
    const cur = best.get(k)
    if (!cur || widthOf(u) > widthOf(cur)) best.set(k, u)
  }
  const out = []
  const ogAbs = abs(og)
  if (ogAbs && !JUNK.test(ogAbs)) out.push(baseKey(ogAbs) && best.get(baseKey(ogAbs)) ? best.get(baseKey(ogAbs)) : ogAbs)
  for (const u of best.values()) if (!out.includes(u)) out.push(u)
  return [...new Set(out)]
}

async function loadHidden() {
  let q = supa
    .from('aircraft_for_sale')
    .select('id, source_id, source_url, quality_score')
    .eq('source', 'hangar67')
    .eq('status', 'active')
    .eq('images', '[]')
    .not('source_url', 'is', null)
  if (GRADE === 'A') q = q.gte('quality_score', 78)
  else if (GRADE === 'B') q = q.gte('quality_score', 50).lt('quality_score', 78)
  else if (GRADE === 'C') q = q.lt('quality_score', 50)
  const { data, error } = await q.order('quality_score', { ascending: false }).limit(LIMIT)
  if (error) throw new Error(error.message)
  return data ?? []
}

const BLOCKED_RE = /just a moment|unknown error|attention required|520|520:/i

// Wait out the Cloudflare JS challenge: poll the title until it's the real page.
async function passChallenge(page) {
  for (let i = 0; i < 9; i++) {
    const t = await page.title().catch(() => '')
    if (t && !BLOCKED_RE.test(t)) return true
    await page.waitForTimeout(2500)
  }
  return false
}

// Pull this listing's photos (hangar67-native gallery, else og:image + broker
// gallery), cleaned, deduped, full-size, capped.
async function extractPhotos(page, row) {
  const sid = String(row.source_id)
  // Up to 3 attempts to clear the challenge (it occasionally re-arms mid-run).
  let ok = false
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    if (attempt === 0) await page.goto(row.source_url, { waitUntil: 'domcontentloaded', timeout: 35000 })
    else { await page.waitForTimeout(4000 * attempt); await page.reload({ waitUntil: 'domcontentloaded', timeout: 35000 }).catch(() => {}) }
    ok = await passChallenge(page)
  }
  if (!ok) throw new Error('cloudflare challenge not passed')
  await page.waitForTimeout(2500) // let SSR meta + gallery settle
  const { og, srcs } = await page.evaluate(() => {
    const og = document.querySelector('meta[property="og:image"]')?.content || ''
    const srcs = []
    for (const img of Array.from(document.querySelectorAll('img'))) {
      const s = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || ''
      if (s) srcs.push(s)
    }
    return { og, srcs }
  })
  return choosePhotos(sid, og, srcs).slice(0, MAX_PHOTOS)
}

const okImage = async (u) => {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA, Range: 'bytes=0-0' } })
    return r.ok || r.status === 206
  } catch {
    return false
  }
}

// hangar67-native URLs use a derived full-size path, so verify it (and fall back
// to the always-valid `_t` thumbnail if the strip missed). Broker URLs were
// actually rendered by the browser, so trust them as-is.
async function pickServable(photos) {
  if (!photos.length) return []
  if (!photos[0].includes('/photos/')) return photos
  if (await okImage(photos[0])) return photos
  const thumbs = photos.map((u) => u.replace(/(\.\w+)(?=$|\?)/i, '_t$1'))
  return (await okImage(thumbs[0])) ? thumbs : []
}

async function worker(id, queue, browser, stats) {
  let ctx = await makeContext(browser)
  let page = await ctx.newPage()
  for (;;) {
    if (stats.aborted) break
    const row = queue.shift()
    if (!row) break
    try {
      const photos = await extractPhotos(page, row)
      const servable = await pickServable(photos)
      if (servable.length) {
        stats.withPhotos++
        stats.totalPhotos += servable.length
        if (!DRY) {
          await supa
            .from('aircraft_for_sale')
            .update({ images: servable, image_is_placeholder: false })
            .eq('id', row.id)
        }
      } else {
        stats.noPhotos++
      }
      stats.done++
      if (stats.done % 10 === 0 || servable.length === 0) {
        log(`[w${id}] ${stats.done}/${stats.total} done · ${stats.withPhotos} with photos (${stats.totalPhotos} imgs) · ${row.source_id}: ${servable.length}${DRY ? ' (dry)' : ''}`)
      }
    } catch (e) {
      stats.errors++
      log(`[w${id}] ERROR ${row.source_id}: ${String(e.message).slice(0, 100)}`)
      // A crashed/closed context kills every remaining listing in this worker —
      // rebuild it so an unattended run survives a chromium hiccup.
      if (/closed|crash|Target page|Target closed/i.test(String(e.message))) {
        try { await ctx.close() } catch {}
        try { ctx = await makeContext(browser); page = await ctx.newPage() } catch { break }
      }
    }
    stats.lastId = row.source_id
    await updateRun(stats)
    await sleep(DELAY + Math.floor(Math.random() * 600)) // be polite — avoid tripping Cloudflare
  }
  try { await ctx.close() } catch {}
}

async function main() {
  const rows = await loadHidden()
  log(`Hangar67 photo harvest — grade ${GRADE}: ${rows.length} hidden listings${DRY ? ' (DRY RUN)' : ''}, concurrency ${CONCURRENCY}, delay ${DELAY}ms`)
  if (!rows.length) return
  const queue = [...rows]
  const stats = { total: rows.length, done: 0, withPhotos: 0, noPhotos: 0, errors: 0, totalPhotos: 0, lastId: null, runId: null, aborted: false }

  // Register the run so the admin page can show live status.
  if (!DRY) {
    const { data } = await supa
      .from('photo_harvest_runs')
      .insert({ status: 'running', grade: GRADE, host: os.hostname(), total: rows.length })
      .select('id')
      .single()
    stats.runId = data?.id ?? null
  }

  // Mark the run stopped on Ctrl-C / kill so the admin doesn't show a ghost "running".
  let stopping = false
  const onSignal = async () => {
    if (stopping) return
    stopping = true
    stats.aborted = true
    await updateRun(stats, { status: 'stopped', finished_at: new Date().toISOString() })
    process.exit(0)
  }
  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)

  // Steady heartbeat even if a worker is mid-listing (so "running" stays fresh).
  const heartbeat = setInterval(() => updateRun(stats), 15000)

  const browser = await chromium.launch({ headless: true })
  try {
    await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1, queue, browser, stats)))
  } finally {
    clearInterval(heartbeat)
    try { await browser.close() } catch {}
  }
  await updateRun(stats, { status: 'done', finished_at: new Date().toISOString() })
  log(
    `\nDone. ${stats.withPhotos}/${stats.total} got photos (${stats.totalPhotos} images total), ` +
      `${stats.noPhotos} had none, ${stats.errors} errors.${DRY ? ' (dry run — no writes)' : ''}`,
  )
}

main().catch((e) => { console.error(e); process.exit(1) })
