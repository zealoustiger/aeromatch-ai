#!/usr/bin/env node
// Night Shift traffic report — pulls visitor/pageview numbers from PostHog and
// prints a markdown "Traffic" block for the morning Daily Report. Read-only.
// Fails soft: if the key is missing or PostHog is unreachable, prints a short
// notice and exits 0 so the digest still produces a report.
//
// Usage: node nightshift/bin/traffic-report.mjs
// Reads POSTHOG_API_KEY, POSTHOG_PROJECT_ID, NEXT_PUBLIC_POSTHOG_HOST from env,
// falling back to .env.local in the repo root.

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
const KEY = env.POSTHOG_API_KEY
const PROJECT = env.POSTHOG_PROJECT_ID
const HOST = (env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/+$/, '')

function soft(msg) {
  console.log(`## Traffic\n\n_Traffic numbers unavailable — ${msg}._`)
  process.exit(0)
}
if (!KEY || !PROJECT) soft('PostHog key/project not configured')

// Sequential + per-query fallback: PostHog's free tier 504s under parallel load,
// and one slow query shouldn't sink the whole report.
async function q(hogql, fallback = []) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
      })
      if (res.ok) return (await res.json()).results || fallback
    } catch {
      /* retry once */
    }
    await new Promise((r) => setTimeout(r, 1500))
  }
  return fallback
}

const PV = "event = '$pageview'"

try {
  const [allTime] = await q(`SELECT count(DISTINCT person_id) AS v, count() AS pv FROM events WHERE ${PV}`, [[0, 0]])
  const [last7] = await q(`SELECT count(DISTINCT person_id) AS v, count() AS pv FROM events WHERE ${PV} AND timestamp > now() - INTERVAL 7 DAY`, [[0, 0]])
  const [nonLocal] = await q(`SELECT count(DISTINCT person_id) AS v FROM events WHERE ${PV} AND (properties.$geoip_city_name != 'Oakland' OR properties.$geoip_city_name IS NULL)`, [[0]])

  // Per-city and per-page breakdowns now live in the first-party day/week
  // comparison block (visitor-comparison.mjs) — this block stays a high-level
  // PostHog summary so the two aren't redundant.
  const today = new Date().toISOString().slice(0, 10)
  const out = []
  out.push(`## 📊 Traffic (PostHog) — as of ${today}`)
  out.push('')
  out.push(
    `- **Visitors:** ${allTime?.[0] ?? 0} all-time · ${last7?.[0] ?? 0} in the last 7 days`
  )
  out.push(`- **Pageviews:** ${allTime?.[1] ?? 0} all-time · ${last7?.[1] ?? 0} in the last 7 days`)
  out.push(
    `- **Not from Oakland:** ${nonLocal?.[0] ?? 0} visitors _(early on, most non-local hits are crawlers/bots, not real users)_`
  )
  out.push('')
  console.log(out.join('\n'))
} catch (e) {
  soft(String(e.message || e))
}
