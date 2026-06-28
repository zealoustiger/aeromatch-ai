#!/usr/bin/env node
// Night Shift visitor comparison — first-party day-over-day + week-over-week tables
// for the morning Daily Report, built from `visitor_threads` (the same source as the
// live /admin "Visitor analytics" card, so the emailed/archived digest matches the
// dashboard exactly). By-city and top-landing-page, bots excluded, day boundaries in
// Pacific time. Read-only. Fails soft: on any missing-creds / network error it prints
// a short notice and exits 0 so the digest still produces a report.
//
// Usage: node nightshift/bin/visitor-comparison.mjs
// Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from env, falling back to
// .env.local in the repo root.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function loadEnv() {
  const env = { ...process.env }
  try {
    for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
  return env
}

const env = loadEnv()
const URL = (env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
const KEY = env.SUPABASE_SERVICE_ROLE_KEY

function soft(msg) {
  console.log(`## 🧭 Visitors — day-over-day & week-over-week\n\n_Comparison unavailable — ${msg}._`)
  process.exit(0)
}
if (!URL || !KEY) soft('Supabase service-role creds not configured')

// Pacific-time offset (minutes, e.g. -420 for PDT) for a given instant — keeps the
// day buckets correct across the DST boundary instead of hardcoding -07/-08.
function ptOffsetMinutes(d) {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'longOffset',
  })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')?.value
  const m = (name || 'GMT-08:00').match(/GMT([+-])(\d{2}):?(\d{2})?/)
  if (!m) return -480
  const sign = m[1] === '-' ? -1 : 1
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3] || '0', 10))
}

// UTC epoch (ms) of midnight Pacific, `daysAgo` days before today.
function ptMidnight(daysAgo, now) {
  const target = new Date(now.getTime() - daysAgo * 86_400_000)
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(target)
  const off = ptOffsetMinutes(new Date(`${ymd}T12:00:00Z`))
  return new Date(`${ymd}T00:00:00Z`).getTime() - off * 60_000
}

function cityLabel(r) {
  if (r.city && r.region) return `${r.city}, ${r.region}`
  if (r.city) return r.city
  if (r.country) return r.country
  return 'Unknown'
}

function countBy(rows, key, from, to) {
  const out = new Map()
  for (const r of rows) {
    const t = new Date(r.created_at).getTime()
    if (t >= from && t < to) {
      const k = key(r)
      out.set(k, (out.get(k) ?? 0) + 1)
    }
  }
  return out
}

function compare(cur, prev, topN = 8) {
  const keys = new Set([...cur.keys(), ...prev.keys()])
  return [...keys]
    .map((label) => ({ label, cur: cur.get(label) ?? 0, prev: prev.get(label) ?? 0 }))
    .sort((a, b) => b.cur - a.cur || b.prev - a.prev || a.label.localeCompare(b.label))
    .slice(0, topN)
}

function delta(cur, prev) {
  const d = cur - prev
  if (d === 0) return '—'
  return d > 0 ? `▲ +${d}` : `▼ −${Math.abs(d)}`
}

function table(dim, curLabel, prevLabel, rows) {
  if (rows.length === 0) return [`_No visitors in this window._`, '']
  const out = [`| ${dim} | ${curLabel} | ${prevLabel} | Δ |`, '|---|--:|--:|:--|']
  for (const r of rows) out.push(`| ${r.label} | ${r.cur} | ${r.prev} | ${delta(r.cur, r.prev)} |`)
  out.push('')
  return out
}

try {
  const now = new Date()
  const t0 = ptMidnight(0, now)
  const t1 = ptMidnight(1, now)
  const t2 = ptMidnight(2, now)
  const t7 = ptMidnight(7, now)
  const t14 = ptMidnight(14, now)

  const qs = new URLSearchParams({
    select: 'city,region,country,first_path,created_at',
    is_bot: 'eq.false',
    created_at: `gte.${new Date(t14).toISOString()}`,
    order: 'created_at.desc',
    limit: '5000',
  })
  const res = await fetch(`${URL}/rest/v1/visitor_threads?${qs}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) soft(`Supabase returned ${res.status}`)
  const rows = await res.json()

  const total = (from, to) =>
    rows.filter((r) => {
      const t = new Date(r.created_at).getTime()
      return t >= from && t < to
    }).length
  const yesterday = total(t1, t0)
  const dayBefore = total(t2, t1)
  const last7 = total(t7, t0)
  const prev7 = total(t14, t7)

  const pageKey = (r) => r.first_path || '/'
  const cityDoD = compare(countBy(rows, cityLabel, t1, t0), countBy(rows, cityLabel, t2, t1))
  const cityWoW = compare(countBy(rows, cityLabel, t7, t0), countBy(rows, cityLabel, t14, t7))
  const pageDoD = compare(countBy(rows, pageKey, t1, t0), countBy(rows, pageKey, t2, t1))
  const pageWoW = compare(countBy(rows, pageKey, t7, t0), countBy(rows, pageKey, t14, t7))

  const out = []
  out.push('## 🧭 Visitors — day-over-day & week-over-week')
  out.push('')
  out.push('_Real visitors (bots excluded), first-party, Pacific-day windows — matches the live `/admin` card._')
  out.push('')
  out.push(
    `- **Totals:** ${yesterday} yesterday _(vs ${dayBefore} the day before)_ · ${last7} last 7 days _(vs ${prev7} the prior 7)_`
  )
  out.push('')
  out.push('**By city — day over day** (yesterday vs. the day before)')
  out.push('')
  out.push(...table('City', 'Yest.', 'Prev', cityDoD))
  out.push('**By city — week over week** (last 7 days vs. the prior 7)')
  out.push('')
  out.push(...table('City', 'Last 7d', 'Prev 7d', cityWoW))
  out.push('**Top landing pages — day over day**')
  out.push('')
  out.push(...table('Page', 'Yest.', 'Prev', pageDoD))
  out.push('**Top landing pages — week over week**')
  out.push('')
  out.push(...table('Page', 'Last 7d', 'Prev 7d', pageWoW))
  console.log(out.join('\n'))
} catch (e) {
  soft(String(e.message || e))
}
