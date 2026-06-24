#!/usr/bin/env node
// Daily Google-index watcher → Slack. Detects pages that have NEWLY started
// showing in Google search (vs the `indexed_pages` tracker) and, for each, reports
// its top search term + average position + which results page that implies.
// Silent unless something new appeared. Run once a day (GSC data refreshes ~daily
// and lags 2-3 days, so more often is pointless). Read-only except inserts into
// indexed_pages. Fails soft.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { gscQuery } from './gsc.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const env = { ...process.env }
try {
  for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {}

const SB_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE
const SLACK = env.SLACK_BOT_TOKEN
const CHANNEL = env.SLACK_METRICS_CHANNEL_ID || env.SLACK_VISITOR_CHANNEL_ID
const SITE = env.NEXT_PUBLIC_SITE_URL || 'https://clubhanger.com'

async function sb(path, init) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  const t = await r.text()
  return t ? JSON.parse(t) : null
}
async function postSlack(text) {
  if (!SLACK || !CHANNEL) { console.log('(no Slack creds — would post)\n' + text); return }
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST', headers: { Authorization: `Bearer ${SLACK}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: CHANNEL, text, unfurl_links: false }),
  })
}
const rel = (u) => u.replace(SITE, '').replace(/\/$/, '') || '/'
const resultsPage = (pos) => Math.max(1, Math.ceil(pos / 10))

async function main() {
  // Pages × queries appearing in Google over the last 28 days (impressions-based).
  const res = await gscQuery(['page', 'query'], { rowLimit: 5000 })
  if (!res.ok) { console.error('GSC query failed:', res.reason); return }

  // Collapse to one row per page = its best (most-impressed) query + that query's position.
  const byPage = new Map()
  for (const row of res.rows) {
    const [page, query] = row.keys
    const cur = byPage.get(page)
    if (!cur || row.impressions > cur.impressions) {
      byPage.set(page, { top_query: query, position: row.position, impressions: row.impressions })
    }
  }
  if (byPage.size === 0) { console.log('No pages with impressions yet.'); return }

  const known = new Set((await sb('indexed_pages?select=url&limit=20000')).map((r) => r.url))
  const fresh = [...byPage.keys()].filter((u) => !known.has(u))

  // First run: seed the baseline silently (don't alert about every existing page).
  if (known.size === 0) {
    await sb('indexed_pages', {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify([...byPage.entries()].map(([url, d]) => ({ url, ...d, position: round(d.position) }))),
    })
    await postSlack(`📡 *Index watcher is live.* Baseline set — Google is currently showing *${byPage.size}* of your pages in search. I'll ping here the moment new pages start appearing.`)
    console.log(`Baseline seeded: ${byPage.size} pages.`)
    return
  }

  if (fresh.length === 0) { console.log(`No new pages (tracking ${known.size}).`); return }

  // Record the new pages, then alert.
  await sb('indexed_pages', {
    method: 'POST', headers: { Prefer: 'return=minimal,resolution=ignore-duplicates' },
    body: JSON.stringify(fresh.map((url) => ({ url, ...byPage.get(url), position: round(byPage.get(url).position) }))),
  })

  const lines = fresh
    .sort((a, b) => byPage.get(a).position - byPage.get(b).position)
    .map((url) => {
      const d = byPage.get(url)
      const q = d.top_query ? `for *"${d.top_query}"*` : '_(query not shown yet)_'
      return `• \`${rel(url)}\` — ${q} — position ${round(d.position)} (results page ${resultsPage(d.position)})`
    })

  const head = `📈 *${fresh.length} new page${fresh.length === 1 ? '' : 's'} now showing in Google!*`
  const foot = `\n_Total pages in Google: ${byPage.size}. Data lags ~2–3 days; positions are 28-day averages; Google hides some low-volume queries._`
  await postSlack(`${head}\n\n${lines.join('\n')}${foot}`)
  console.log(`Alerted on ${fresh.length} new page(s).`)
}
function round(n) { return Math.round((n + Number.EPSILON) * 10) / 10 }
main().catch((e) => { console.error(e); process.exit(1) })
