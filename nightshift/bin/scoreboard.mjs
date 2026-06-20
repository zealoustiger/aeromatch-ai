#!/usr/bin/env node
// Night Shift scoreboard — reads the goal metric (pageviews) from PostHog so the
// PM step can prioritize by measured impact. Read-only. Fails soft: if the key is
// missing or PostHog is unreachable, it prints a clear notice and exits 0 so the
// loop keeps running on the backlog.
//
// Usage: node nightshift/bin/scoreboard.mjs
// Reads POSTHOG_API_KEY, POSTHOG_PROJECT_ID, NEXT_PUBLIC_POSTHOG_HOST from
// process.env, falling back to parsing .env.local in the repo root.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function loadEnv() {
  const env = { ...process.env }
  try {
    const raw = readFileSync(join(root, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
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

function softExit(msg) {
  console.log(`SCOREBOARD UNAVAILABLE — ${msg}`)
  console.log('Proceed on the backlog; judge SEO/traffic work by leading indicators (see GOAL.md).')
  process.exit(0)
}

if (!KEY || !PROJECT) softExit('POSTHOG_API_KEY or POSTHOG_PROJECT_ID not set in env/.env.local')

async function q(hogql) {
  const res = await fetch(`${HOST}/api/projects/${PROJECT}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
  })
  if (!res.ok) throw new Error(`PostHog ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).results || []
}

const pct = (now, prev) =>
  prev > 0 ? `${now >= prev ? '+' : ''}${Math.round(((now - prev) / prev) * 100)}%` : 'n/a'

try {
  const [[last7, prior7]] = await q(`
    SELECT countIf(timestamp > now() - toIntervalDay(7)) AS last7,
           countIf(timestamp <= now() - toIntervalDay(7) AND timestamp > now() - toIntervalDay(14)) AS prior7
    FROM events WHERE event = '$pageview'`)

  const top = await q(`
    SELECT properties.$pathname AS path, count() AS views, count(DISTINCT person_id) AS visitors
    FROM events WHERE event = '$pageview' AND timestamp > now() - toIntervalDay(7)
    GROUP BY path ORDER BY views DESC LIMIT 20`)

  const [[totalViews, distinctPaths]] = await q(`
    SELECT count() AS total, count(DISTINCT properties.$pathname) AS paths
    FROM events WHERE event = '$pageview'`)

  console.log('=== NIGHT SHIFT SCOREBOARD (goal: maximize pageviews) ===')
  console.log(`Pageviews last 7d: ${last7}  (prior 7d: ${prior7}, ${pct(last7, prior7)})`)
  console.log(`All-time: ${totalViews} pageviews across ${distinctPaths} distinct paths indexed by traffic`)
  console.log('\nTop pages (7d)        views / visitors')
  if (top.length === 0) console.log('  (no pageviews in the last 7 days)')
  for (const [path, views, visitors] of top) {
    console.log(`  ${String(path || '(unknown)').padEnd(36)} ${String(views).padStart(4)} / ${visitors}`)
  }
  console.log('\nRead: low absolute numbers + few distinct paths = traffic is the bottleneck.')
  console.log('Lever = SEO breadth + quality (see GOAL.md). Pageview lift LAGS indexing by weeks —')
  console.log('judge SEO cycles by leading indicators (new quality indexable pages, metadata, speed),')
  console.log('and track this scoreboard week-over-week, not night-over-night.')
} catch (e) {
  softExit(String(e.message || e))
}
