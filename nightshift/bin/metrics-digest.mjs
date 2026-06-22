#!/usr/bin/env node
// Twice-daily key-metrics digest → Slack. Pages indexed (GSC proxy), pageviews
// (PostHog), signups (Supabase) — last 24h vs the prior 24h. Read-only except a
// snapshot row it writes for day-over-day GSC deltas. Fails soft.
//
// Usage: node nightshift/bin/metrics-digest.mjs
// Reads keys from process.env, falling back to .env.local.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { getGscSummary } from './gsc.mjs'

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
const SLACK = env.SLACK_BOT_TOKEN
const CHANNEL = env.SLACK_METRICS_CHANNEL_ID || env.SLACK_VISITOR_CHANNEL_ID
const PH_KEY = env.POSTHOG_API_KEY
const PH_PROJECT = env.POSTHOG_PROJECT_ID
const PH_HOST = (env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/+$/, '')
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const delta = (now, prev) => {
  if (prev == null || now == null) return ''
  const d = now - prev
  const pctTxt = prev > 0 ? ` (${d >= 0 ? '+' : ''}${Math.round((d / prev) * 100)}%)` : ''
  return ` — ${d >= 0 ? '▲' : '▼'} ${d >= 0 ? '+' : ''}${d} vs prior 24h${pctTxt}`
}

async function ph(hogql) {
  if (!PH_KEY || !PH_PROJECT) return null
  try {
    const res = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT}/query/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PH_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
    })
    if (!res.ok) return null
    return (await res.json()).results || null
  } catch {
    return null
  }
}

async function sb(path, init) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) return null
  const text = await res.text()
  return text ? JSON.parse(text) : true // inserts with return=minimal send an empty body
}

// ── Pageviews: exact 24h windows ──
let pv24 = null, pvPrior = null
const pvRes = await ph(`
  SELECT countIf(timestamp > now() - toIntervalHour(24)) AS a,
         countIf(timestamp <= now() - toIntervalHour(24) AND timestamp > now() - toIntervalHour(48)) AS b
  FROM events WHERE event = '$pageview'`)
if (pvRes?.[0]) { pv24 = pvRes[0][0]; pvPrior = pvRes[0][1] }

// ── Signups: exact 24h windows via the SECURITY DEFINER counter ──
let su24 = null, suPrior = null
if (SB_URL && SB_KEY) {
  const nowMs = Date.now()
  const iso = (ms) => new Date(ms).toISOString()
  const a = await sb('rpc/count_signups', { method: 'POST', body: JSON.stringify({ p_since: iso(nowMs - 864e5), p_until: iso(nowMs) }) })
  const b = await sb('rpc/count_signups', { method: 'POST', body: JSON.stringify({ p_since: iso(nowMs - 1728e5), p_until: iso(nowMs - 864e5) }) })
  if (a != null) su24 = a
  if (b != null) suPrior = b
}

// ── GSC: current indexed proxy + clicks/impressions; day-over-day vs last snapshot ──
const g = await getGscSummary()
const gscPages = g.ok ? (g.pages?.length ?? 0) : null
const gscClicks = g.ok ? g.clicks : null
const gscImpr = g.ok ? g.impressions : null

// prior snapshot for GSC deltas (laggy metric — exact-window doesn't work)
let prevSnap = null
if (SB_URL && SB_KEY) {
  const rows = await sb('metric_snapshots?select=*&order=captured_at.desc&limit=1')
  prevSnap = rows?.[0] ?? null
}

const now = new Date()
const stamp = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
const lines = []
lines.push(`📈 *ClubHanger — key metrics* · ${stamp}`)
lines.push(`_Last 24 hours vs the prior 24 hours._`)
lines.push('')
lines.push(`• *Pages in Google:* ${gscPages ?? '—'}${gscPages != null && prevSnap?.gsc_pages != null ? delta(gscPages, prevSnap.gsc_pages).replace('vs prior 24h', 'vs last snapshot') : ''}  _(GSC lags ~2–3 days; sitemap has ${g.ok && g.submitted ? g.submitted : 'all'} URLs)_`)
lines.push(`• *Search clicks (28d):* ${gscClicks ?? '—'} · *impressions:* ${gscImpr ?? '—'}`)
lines.push(`• *Pageviews:* ${pv24 ?? '—'}${delta(pv24, pvPrior)}`)
lines.push(`• *Signups:* ${su24 ?? '—'}${delta(su24, suPrior)}`)
if (!g.ok) lines.push(`\n_GSC unavailable: ${g.reason}_`)

// Post to Slack
if (SLACK && CHANNEL) {
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SLACK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: CHANNEL, text: lines.join('\n'), unfurl_links: false }),
  })
}
console.log(lines.join('\n'))

// Write a snapshot for next time's GSC delta
if (SB_URL && SB_KEY) {
  await sb('metric_snapshots', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ pageviews_24h: pv24, signups_24h: su24, gsc_pages: gscPages, gsc_clicks: gscClicks, gsc_impressions: gscImpr }),
  })
}
