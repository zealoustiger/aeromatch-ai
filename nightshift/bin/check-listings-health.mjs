#!/usr/bin/env node
/**
 * Listings-health check — fires post-scrape (07:30 PT systemd timer) and
 * verifies each public scraper actually did its job overnight. Writes a
 * markdown report to `admin_content` (key `listings_health_report`) so the
 * admin dashboard shows a live green/red panel at the top of /admin/listings.
 * Also posts to Slack #alerts on ANY failed check (env-gated).
 *
 * Four checks per source:
 *   1. New listings in the last 24h    → 0 = scraper never landed anything
 *   2. Re-seen rate on latest scrape   → <85% = only partial coverage
 *   3. Last last_seen_at age            → >26h = scrape didn't run at all
 *   4. Photo coverage (% with images)  → source-specific floor
 *
 * Debug context on failure: last 30 lines of the source's scrape.err, whether
 * BRIGHTDATA_API_TOKEN is set (matters for hangar67/controller), and the
 * 7-day rolling new-per-day average so a soft drop looks different from a
 * total silence.
 *
 * Run locally:  node nightshift/bin/check-listings-health.mjs
 * Run in VPS:   /app/nightshift/bin/check-listings-health.mjs  (via systemd)
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SLACK_BOT_TOKEN,
 *      SLACK_ALERTS_CHANNEL_ID (optional — skips Slack post if unset).
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Minimal .env.local loader (matches the other nightshift scripts).
function loadEnv() {
  const p = join(ROOT, '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
  }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// ─── Config ───────────────────────────────────────────────────────────────
// Per-source check config. Only public scrapers land here — controller is
// admin-only inventory, monitored elsewhere. Tune photo floors per real-world
// steady-state: hangar67 harvests to 99%+, aircraftforsale sits ~85% because
// most brokers post photos, barnstormers naturally low (text-classifieds).
const SOURCES = [
  { name: 'barnstormers',    photoFloor: 0.30 },
  { name: 'hangar67',        photoFloor: 0.90 },
  { name: 'aircraftforsale', photoFloor: 0.70 },
]
const RESEEN_MIN = 0.85              // <85% = scrape only partially covered the source
const MAX_LAST_SEEN_HOURS = 26        // catches a totally-silent scrape (systemd fired but container died)
const STATE_DIR = process.env.NS_STATE_DIR || '/home/night/state'

// ─── Per-source checks ───────────────────────────────────────────────────
async function checkSource({ name, photoFloor }) {
  // We reuse the same shape getListingFreshness computes in adminScrapers.ts
  // so the report tracks the on-site admin panel 1:1.
  const nowIso = new Date().toISOString()
  const dayCut = new Date(Date.now() - 24 * 3600_000).toISOString()

  const [{ count: activeTotal }, { count: newLast24h }, { data: latest }] = await Promise.all([
    supa.from('aircraft_for_sale').select('id', { count: 'exact', head: true }).eq('source', name).eq('status', 'active'),
    supa.from('aircraft_for_sale').select('id', { count: 'exact', head: true }).eq('source', name).gte('first_seen_at', dayCut),
    supa.from('aircraft_for_sale').select('last_seen_at').eq('source', name).not('last_seen_at', 'is', null).order('last_seen_at', { ascending: false }).limit(1),
  ])
  const lastScrape = latest?.[0]?.last_seen_at ?? null
  const lastScrapeAgeH = lastScrape ? (Date.now() - Date.parse(lastScrape)) / 3600_000 : null

  const reseenWindow = lastScrape ? new Date(Date.parse(lastScrape) - 6 * 3600_000).toISOString() : null
  const { count: reseenLastRun } = reseenWindow
    ? await supa.from('aircraft_for_sale').select('id', { count: 'exact', head: true }).eq('source', name).eq('status', 'active').gte('last_seen_at', reseenWindow)
    : { count: 0 }
  const reseenRate = activeTotal ? reseenLastRun / activeTotal : 0

  const { count: withPhotos } = await supa
    .from('aircraft_for_sale').select('id', { count: 'exact', head: true })
    .eq('source', name).eq('status', 'active').not('images', 'eq', '[]')
  const photoRate = activeTotal ? withPhotos / activeTotal : 0

  // 7-day rolling average so we can distinguish "big drop" from "silent."
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
  const { data: recent } = await supa
    .from('aircraft_for_sale').select('first_seen_at').eq('source', name)
    .gte('first_seen_at', weekAgo).limit(5000)
  const perDay = new Map()
  for (const r of recent ?? []) {
    const d = (r.first_seen_at || '').slice(0, 10)
    if (d) perDay.set(d, (perDay.get(d) || 0) + 1)
  }
  const avg7d = Math.round([...perDay.values()].reduce((s, n) => s + n, 0) / 7)

  const checks = {
    newListings:   { ok: newLast24h > 0,                                       value: newLast24h, expect: '> 0' },
    reseenRate:    { ok: reseenRate >= RESEEN_MIN,                             value: `${Math.round(reseenRate * 100)}%`, expect: `≥ ${Math.round(RESEEN_MIN * 100)}%` },
    lastScrapeAge: { ok: lastScrapeAgeH !== null && lastScrapeAgeH < MAX_LAST_SEEN_HOURS, value: lastScrapeAgeH != null ? `${lastScrapeAgeH.toFixed(1)}h` : 'never', expect: `< ${MAX_LAST_SEEN_HOURS}h` },
    photoCoverage: { ok: photoRate >= photoFloor,                              value: `${Math.round(photoRate * 100)}%`, expect: `≥ ${Math.round(photoFloor * 100)}%` },
  }
  const failed = Object.entries(checks).filter(([, c]) => !c.ok).map(([k]) => k)

  return { source: name, activeTotal: activeTotal ?? 0, newLast24h: newLast24h ?? 0, avg7d, checks, failed, generatedAt: nowIso }
}

// ─── Debug context for failing sources ────────────────────────────────────
// Reads whatever the container has on disk. Sourced from run-scrape.sh's
// $STATE/scrape.out and $STATE/scrape.err, so we can see the tail without
// SSHing anywhere.
function debugContext(source) {
  const bits = []
  for (const stream of ['scrape.err', 'scrape.out']) {
    const p = join(STATE_DIR, stream)
    if (!existsSync(p)) continue
    try {
      const txt = readFileSync(p, 'utf8')
      // Grep-ish narrow: prefer lines mentioning the source name; fall back to tail.
      const relevant = txt.split('\n').filter((l) => l.includes(source)).slice(-15)
      const tail = relevant.length ? relevant : txt.split('\n').slice(-15)
      if (tail.some((l) => l.trim())) {
        bits.push(`  \`${stream}\` (last 15 lines${relevant.length ? `, filtered by "${source}"` : ''}):`)
        bits.push('  ```\n  ' + tail.filter(Boolean).map((l) => l.slice(0, 200)).join('\n  ') + '\n  ```')
      }
    } catch {
      /* unreadable — skip */
    }
  }
  // BrightData token presence matters for hangar67 photo harvest + controller.
  if (source === 'hangar67' || source === 'controller') {
    bits.push(`  BRIGHTDATA_API_TOKEN: ${process.env.BRIGHTDATA_API_TOKEN ? 'set ✓' : '**not set** — hangar67 photos + controller ingest need this'}`)
  }
  return bits.length ? bits.join('\n') : '  _(no scrape.err / scrape.out on disk — probably running outside the scrape container)_'
}

// ─── Report assembly ─────────────────────────────────────────────────────
function renderReport(results) {
  const overallFailed = results.some((r) => r.failed.length > 0)
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' })

  const lines = []
  lines.push(overallFailed
    ? `> **⚠️ ${results.reduce((n, r) => n + r.failed.length, 0)} check(s) failed** across ${results.filter((r) => r.failed.length).length} of ${results.length} source(s). Details below.`
    : `> **✅ All checks passing** — every public scraper landed new inventory + kept photo coverage above floor.`)
  lines.push(`> _Last run: ${timestamp} PT._`)
  lines.push('')

  const header = ['| Source | New 24h | 7d avg/day | Re-seen | Last scrape | Photos | Verdict |',
                  '|---|---:|---:|---:|---:|---:|:---:|'].join('\n')
  lines.push(header)
  for (const r of results) {
    const c = r.checks
    const mark = (ok) => ok ? '✅' : '⚠️'
    const verdict = r.failed.length === 0 ? '✅' : `⚠️ ${r.failed.length}`
    lines.push([
      `| **${r.source}**`,
      `${mark(c.newListings.ok)} ${c.newListings.value}`,
      `${r.avg7d}`,
      `${mark(c.reseenRate.ok)} ${c.reseenRate.value}`,
      `${mark(c.lastScrapeAge.ok)} ${c.lastScrapeAge.value}`,
      `${mark(c.photoCoverage.ok)} ${c.photoCoverage.value}`,
      `${verdict} |`,
    ].join(' | '))
  }
  lines.push('')

  const failing = results.filter((r) => r.failed.length > 0)
  if (failing.length) {
    lines.push('---')
    lines.push('')
    lines.push('### Debug context')
    lines.push('')
    for (const r of failing) {
      lines.push(`**${r.source}** — failed: ${r.failed.join(', ')}`)
      lines.push(debugContext(r.source))
      lines.push('')
    }
  }

  return { markdown: lines.join('\n'), overallFailed }
}

// ─── Slack post (env-gated) ──────────────────────────────────────────────
async function postSlackIfFailure(results, overallFailed) {
  if (!overallFailed) return
  const token = process.env.SLACK_BOT_TOKEN
  // Prefer a dedicated alerts channel; fall back to the existing visitor channel
  // (both use the same bot). Health alerts are top-level messages there, easy to
  // distinguish from the visitor threads by the 🚨 prefix + no threading.
  const channel = process.env.SLACK_ALERTS_CHANNEL_ID || process.env.SLACK_VISITOR_CHANNEL_ID
  if (!token || !channel) {
    console.log('[slack] skipping — SLACK_BOT_TOKEN or channel env not set')
    return
  }
  const failing = results.filter((r) => r.failed.length > 0)
  const text = [
    `🚨 *Listings health — ${failing.length} source(s) failing*`,
    ...failing.map((r) => `• *${r.source}* — ${r.failed.join(', ')} (new 24h: ${r.checks.newListings.value}, 7d avg: ${r.avg7d}, last scrape: ${r.checks.lastScrapeAge.value})`),
    ``,
    `Full report: https://clubhanger.com/admin/listings`,
  ].join('\n')
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, text, unfurl_links: false }),
  }).then((r) => r.json()).catch((e) => ({ ok: false, error: String(e) }))
  console.log(`[slack] ${res.ok ? 'posted' : `failed: ${res.error}`}`)
}

// ─── Persist to admin_content so /admin/listings shows the panel ─────────
async function persist(markdown) {
  const { error } = await supa.from('admin_content').upsert({
    key: 'listings_health_report',
    title: 'Listings Health',
    content: markdown,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' })
  if (error) console.error('[persist] failed:', error.message)
  else console.log('[persist] wrote admin_content.listings_health_report')
}

// ─── Test-account sweep (safety net) ──────────────────────────────────────
// The overnight drain sometimes leaves @example.com QA accounts + listings in
// the (shared) prod DB when a cycle forgets to clean up. This sweeps any older
// than 24h — the age floor spares an in-flight QA run. Scoped to @example.com
// posters, so the gmail-posted seed listings are never touched. Best-effort:
// a failure here never blocks the health report.
async function sweepTestAccounts() {
  try {
    const { data, error } = await supa.rpc('sweep_test_accounts', { p_min_age_hours: 24 })
    if (error) { console.log(`[sweep] failed: ${error.message}`); return 0 }
    const n = data ?? 0
    console.log(n > 0 ? `[sweep] removed ${n} stale @example.com test account(s) + their rows` : '[sweep] no stale test accounts')
    return n
  } catch (e) {
    console.log(`[sweep] error: ${String(e)}`)
    return 0
  }
}

// ─── Main ────────────────────────────────────────────────────────────────
const swept = await sweepTestAccounts()
const results = await Promise.all(SOURCES.map(checkSource))
let { markdown, overallFailed } = renderReport(results)
if (swept > 0) markdown += `\n\n_Swept ${swept} stale @example.com test account(s) this run._`
console.log(markdown)
await persist(markdown)
await postSlackIfFailure(results, overallFailed)
process.exit(0)
