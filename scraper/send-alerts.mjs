#!/usr/bin/env node
/**
 * Alert match-and-send. Run after ingestion: finds listings new since each
 * confirmed alert's last digest, matches them to that alert's saved search, and
 * sends a digest email via Resend.
 *
 * Also SYNCS saved_searches → confirmed alerts, so logged-in users' saved
 * searches get notified too (the SignUpGate already promises this).
 *
 * SAFETY (this emails real people):
 *  - Only CONFIRMED, active alerts are emailed (status='active', confirmed_at set).
 *  - Baseline-first: an alert with no `last_digest_at` is marked caught-up WITHOUT
 *    sending — so we NEVER blast a back-catalog; only future-new listings notify.
 *  - Dedup via `last_digest_at`; one-click unsubscribe in every email.
 *  - Caps listings per email; --dry-run writes nothing and sends nothing.
 *
 * Usage:  node scraper/send-alerts.mjs [--dry-run]
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *                   RESEND_API_KEY, ALERTS_FROM_EMAIL, NEXT_PUBLIC_SITE_URL
 */
import crypto from 'node:crypto'
import { loadEnvLocal } from './lib/ingest-core.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnvLocal()
const DRY = process.argv.includes('--dry-run')
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://clubhanger.com').replace(/\/+$/, '')
const FROM = process.env.ALERTS_FROM_EMAIL || 'ClubHanger <alerts@clubhanger.com>'
const RESEND = process.env.RESEND_API_KEY
const MAX_PER_EMAIL = 10

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
const log = (...a) => console.log(...a)
const now = () => new Date().toISOString()

// 1) Sync saved_searches → confirmed alerts (idempotent, by email + source_path).
async function syncSavedSearches() {
  const { data: saved, error } = await supa.from('saved_searches').select('id,path,search_params,user_id')
  if (error) { log('saved_searches read failed:', error.message); return }
  const emailByUser = {}
  for (const s of saved || []) {
    if (!s.user_id || emailByUser[s.user_id] !== undefined) continue
    const { data } = await supa.auth.admin.getUserById(s.user_id)
    emailByUser[s.user_id] = data?.user?.email || null
  }
  for (const s of saved || []) {
    const email = emailByUser[s.user_id]
    if (!email) continue
    const source_path = s.search_params ? `${s.path}?${s.search_params}` : s.path
    const { data: existing } = await supa.from('alerts').select('id').eq('email', email).eq('source_path', source_path).limit(1)
    if (existing?.length) continue
    if (DRY) { log(`  [dry] would create alert from saved search: ${email}  ${source_path}`); continue }
    await supa.from('alerts').insert({
      email, source_path, context: 'saved search', status: 'active', confirmed_at: now(),
      confirm_token: crypto.randomUUID(), unsubscribe_token: crypto.randomUUID(),
    })
    log(`  synced saved search → alert: ${email}  ${source_path}`)
  }
}

// 2) Parse a saved-search path+params into a table + a Supabase filter builder.
function parseSearch(source_path) {
  const [path, qs = ''] = String(source_path || '').split('?')
  const p = new URLSearchParams(qs)
  const g = (k) => p.get(k)?.trim()
  if (path.startsWith('/aircraft')) {
    return {
      table: 'aircraft_for_sale', label: 'aircraft for sale',
      apply: (q) => {
        if (g('make')) q = q.ilike('make', `%${g('make')}%`)
        if (g('model')) q = q.ilike('model', `%${g('model')}%`)
        if (g('state')) q = q.eq('state', g('state').toUpperCase())
        if (g('max_price')) q = q.lte('asking_price', +g('max_price'))
        if (g('min_price')) q = q.gte('asking_price', +g('min_price'))
        if (g('year_min')) q = q.gte('year', +g('year_min'))
        if (g('year_max')) q = q.lte('year', +g('year_max'))
        return q
      },
    }
  }
  if (path.startsWith('/partnerships')) {
    return {
      table: 'partnerships', label: 'partnerships',
      apply: (q) => {
        if (g('airport')) q = q.eq('home_airport', g('airport').toUpperCase())
        if (g('make')) q = q.ilike('make', `%${g('make')}%`)
        if (g('state')) q = q.eq('state', g('state').toUpperCase())
        return q
      },
    }
  }
  return null
}

function lineFor(table, r) {
  if (table === 'aircraft_for_sale') {
    const price = r.price_text || (r.asking_price ? `$${r.asking_price.toLocaleString()}` : 'Contact for price')
    return { title: [r.year, r.make, r.model].filter(Boolean).join(' ') || 'Aircraft', price, location: r.location || r.state || '', url: `${SITE}/aircraft` }
  }
  const price = r.buy_in_price ? `$${r.buy_in_price.toLocaleString()} buy-in` : 'Contact for details'
  return { title: [r.year, r.make, r.model].filter(Boolean).join(' ') || r.title || 'Partnership', price, location: r.home_airport || r.state || '', url: `${SITE}/partnerships/${r.id}` }
}

async function sendDigest(alert, items, label) {
  const unsub = `${SITE}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}`
  const shown = items.slice(0, MAX_PER_EMAIL)
  const rows = shown.map((m) => `
    <tr><td style="padding:12px 0;border-bottom:1px solid #eef2f7">
      <div style="font-weight:700;color:#0284c7;font-size:16px">${m.price}</div>
      <div style="font-weight:600">${m.title}</div>
      <div style="font-size:13px;color:#64748b">${m.location}</div>
      <a href="${m.url}" style="font-size:13px;color:#0284c7;text-decoration:none">View on ClubHanger →</a>
    </td></tr>`).join('')
  const subject = `✈️ ${items.length} new ${label} match your ClubHanger search`
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:540px;margin:0 auto;color:#0f172a">
    <p style="font-size:13px;color:#64748b;margin:0">ClubHanger alert</p>
    <h2 style="font-size:18px;margin:4px 0 14px">${items.length} new ${label} matched your saved search</h2>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    ${items.length > shown.length ? `<p style="font-size:13px;color:#64748b">…and ${items.length - shown.length} more on ClubHanger.</p>` : ''}
    <p style="font-size:12px;color:#94a3b8;margin-top:20px">You saved this search on ClubHanger, so we email you new matches. <a href="${unsub}" style="color:#94a3b8">Unsubscribe</a>.</p>
  </div>`
  const text = `${items.length} new ${label} matched your ClubHanger saved search:\n\n` +
    shown.map((m) => `${m.title} — ${m.price} (${m.location})\n${m.url}`).join('\n\n') +
    `\n\nUnsubscribe: ${unsub}`
  // --dry-run: pretend success WITHOUT advancing the cursor (handled by caller via DRY).
  if (DRY) { log(`  [dry] would email ${alert.email}: ${subject}`); return true }
  // No Resend key: we genuinely cannot send. Return false so the caller does NOT
  // advance last_digest_at — otherwise a missing/expired key silently eats every
  // match in the window (the cursor moves past listings that were never emailed).
  if (!RESEND) { log(`  ✗ no RESEND_API_KEY — NOT sending and NOT advancing cursor for ${alert.email}`); return false }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: alert.email, subject, html, text }),
  })
  if (!res.ok) { log(`  ✗ send failed ${alert.email}: ${res.status} ${(await res.text()).slice(0, 140)}`); return false }
  log(`  ✓ emailed ${alert.email} — ${items.length} new ${label}`)
  return true
}

async function main() {
  log(`=== alert match-and-send ${DRY ? '(DRY RUN — no writes/sends)' : ''} ===`)
  if (!RESEND && !DRY) log('WARNING: no RESEND_API_KEY — emails will be skipped.')
  await syncSavedSearches()
  const { data: alerts } = await supa.from('alerts').select('*').eq('status', 'active').not('confirmed_at', 'is', null)
  log(`${alerts?.length || 0} confirmed active alerts`)
  let baselined = 0, emailed = 0, skipped = 0
  for (const a of alerts || []) {
    const spec = parseSearch(a.source_path)
    if (!spec) { log(`  skip (unparseable): ${a.source_path}`); skipped++; continue }
    if (!a.last_digest_at) {
      if (!DRY) await supa.from('alerts').update({ last_digest_at: now() }).eq('id', a.id)
      log(`  baseline (no send): ${a.email}  ${a.source_path}`); baselined++; continue
    }
    let q = supa.from(spec.table).select('*').eq('status', 'active').gt('created_at', a.last_digest_at)
    const { data: matches, error } = await spec.apply(q).limit(50)
    if (error) { log(`  query error ${a.email}: ${error.message}`); skipped++; continue }
    if (!matches?.length) continue
    const items = matches.map((m) => lineFor(spec.table, m))
    const ok = await sendDigest(a, items, spec.label)
    if (ok && !DRY) await supa.from('alerts').update({ last_digest_at: now() }).eq('id', a.id)
    if (ok) emailed++
  }
  log(`\nDone. baselined=${baselined}  emailed=${emailed}  skipped=${skipped}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
