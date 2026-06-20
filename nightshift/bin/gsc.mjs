#!/usr/bin/env node
// Night Shift — Google Search Console reader. Pulls REAL search performance
// (clicks, impressions, indexed-count, top queries/pages) so the PM optimizes
// against what's actually ranking. Read-only, service-account auth, no npm deps.
// Exposes getGscSummary() for the scoreboard; prints a report when run directly.
// Fails soft if creds are absent. Setup: nightshift/GSC_SETUP.md.

import { readFileSync, realpathSync } from 'node:fs'
import { createSign } from 'node:crypto'
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

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function getToken(sa) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }))
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const jwt = `${header}.${claim}.${b64url(signer.sign(sa.private_key))}`
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).access_token
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

/** Returns { ok:true, clicks, impressions, ctr, position, indexed, submitted, queries, pages }
 *  or { ok:false, reason }. Never throws, never exits. */
export async function getGscSummary() {
  const env = loadEnv()
  const SITE = env.GSC_SITE_URL || 'https://clubhanger.com/'
  let sa
  if (env.GSC_SA_JSON) { try { sa = JSON.parse(env.GSC_SA_JSON) } catch { return { ok: false, reason: 'GSC_SA_JSON is not valid JSON' } } }
  else if (env.GSC_SA_FILE) { try { sa = JSON.parse(readFileSync(env.GSC_SA_FILE, 'utf8')) } catch { return { ok: false, reason: 'cannot read GSC_SA_FILE' } } }
  else return { ok: false, reason: 'no service-account creds (GSC_SA_JSON / GSC_SA_FILE)' }

  try {
    const token = await getToken(sa)
    const auth = { Authorization: `Bearer ${token}` }
    const enc = encodeURIComponent(SITE)
    const range = { startDate: daysAgo(28), endDate: daysAgo(1) }
    const saq = async (body) => {
      const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${enc}/searchAnalytics/query`, {
        method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error(`searchAnalytics ${r.status}: ${(await r.text()).slice(0, 200)}`)
      return (await r.json()).rows || []
    }
    const [totals, queries, pages] = await Promise.all([
      saq({ ...range, dimensions: [] }),
      saq({ ...range, dimensions: ['query'], rowLimit: 10 }),
      saq({ ...range, dimensions: ['page'], rowLimit: 10 }),
    ])
    let indexed = null, submitted = null
    try {
      const sm = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${enc}/sitemaps`, { headers: auth })
      if (sm.ok) {
        submitted = 0; indexed = 0
        for (const s of (await sm.json()).sitemap || [])
          for (const c of s.contents || []) { submitted += +c.submitted || 0; indexed += +c.indexed || 0 }
      }
    } catch {}
    const t = totals[0] || {}
    return {
      ok: true,
      clicks: t.clicks || 0, impressions: t.impressions || 0, ctr: t.ctr || 0, position: t.position || 0,
      indexed, submitted, queries, pages,
    }
  } catch (e) {
    return { ok: false, reason: String(e.message || e) }
  }
}

/** Stage of the search funnel + what to prioritize. Drives the loop's SEO focus. */
export function gscStage(g) {
  if (!g.ok) return null
  const indexedRatio = g.submitted ? (g.indexed || 0) / g.submitted : 0
  if ((g.indexed || 0) === 0 || indexedRatio < 0.1)
    return { stage: 'INDEXING', focus: 'Get pages INDEXED — indexability, internal linking, sitemap freshness, page quality, request-indexing. Do NOT just build more pages Google can\'t index yet. (Backlinks, a human lever, accelerate this most.)' }
  if (g.impressions < 100)
    return { stage: 'VISIBILITY', focus: 'Pages are indexing — now earn impressions: more quality pages targeting real queries, better titles/H1s/internal links for the families already showing up.' }
  if (g.ctr < 0.02)
    return { stage: 'CTR', focus: 'Good impressions, weak click-through — improve titles, meta descriptions, and structured data on high-impression / low-click pages to win the click.' }
  return { stage: 'SCALING', focus: 'Funnel is converting — scale breadth on what works and push almost-ranking pages (position 5-15) onto page one.' }
}

// CLI
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const g = await getGscSummary()
  if (!g.ok) {
    console.log(`GSC UNAVAILABLE — ${g.reason}`)
    console.log('Set GSC_SA_JSON (or GSC_SA_FILE) + GSC_SITE_URL in .env.local. See nightshift/GSC_SETUP.md.')
    process.exit(0)
  }
  const st = gscStage(g)
  console.log('=== GOOGLE SEARCH CONSOLE (last 28d) ===')
  console.log(`Clicks ${g.clicks}  ·  Impressions ${g.impressions}  ·  CTR ${(g.ctr * 100).toFixed(1)}%  ·  Avg position ${g.position.toFixed(1)}`)
  if (g.indexed != null) console.log(`Indexed: ${g.indexed} / ${g.submitted} submitted`)
  console.log(`STAGE: ${st.stage} — ${st.focus}`)
  console.log('\nTop queries (clicks/impr):')
  if (!g.queries.length) console.log('  (no search impressions yet — newly indexed)')
  for (const q of g.queries) console.log(`  ${String(q.keys[0]).slice(0, 44).padEnd(44)} ${q.clicks}/${q.impressions}`)
  console.log('\nTop pages (clicks/impr):')
  for (const p of g.pages) console.log(`  ${String(p.keys[0]).replace('https://clubhanger.com', '').slice(0, 44).padEnd(44)} ${p.clicks}/${p.impressions}`)
}
