#!/usr/bin/env node
// Night Shift — Google Search Console reader. Pulls REAL search performance
// (clicks, impressions, top queries/pages, indexed count) so the PM optimizes
// against what's actually ranking, not just on-site pageviews. Read-only.
// Service-account auth, no npm deps. Fails soft if creds are absent.
//
// Env (put in .env.local — it's a SECRET, never commit. See nightshift/GSC_SETUP.md):
//   GSC_SA_JSON   full service-account JSON on one line, OR
//   GSC_SA_FILE   absolute path to the service-account JSON file
//   GSC_SITE_URL  'https://clubhanger.com/' (URL-prefix property) or
//                 'sc-domain:clubhanger.com' (Domain property)

import { readFileSync } from 'node:fs'
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

const env = loadEnv()
const SITE = env.GSC_SITE_URL || 'https://clubhanger.com/'

function soft(msg) {
  console.log(`GSC UNAVAILABLE — ${msg}`)
  console.log('Set GSC_SA_JSON (or GSC_SA_FILE) + GSC_SITE_URL in .env.local. See nightshift/GSC_SETUP.md.')
  process.exit(0)
}

function loadSA() {
  if (env.GSC_SA_JSON) {
    try { return JSON.parse(env.GSC_SA_JSON) } catch { soft('GSC_SA_JSON is not valid JSON') }
  }
  if (env.GSC_SA_FILE) {
    try { return JSON.parse(readFileSync(env.GSC_SA_FILE, 'utf8')) } catch { soft('cannot read GSC_SA_FILE') }
  }
  soft('no service-account creds (GSC_SA_JSON / GSC_SA_FILE)')
}

const sa = loadSA()
const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function getToken() {
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
  if (!res.ok) soft(`token exchange failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  return (await res.json()).access_token
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

try {
  const token = await getToken()
  const auth = { Authorization: `Bearer ${token}` }
  const enc = encodeURIComponent(SITE)
  const range = { startDate: daysAgo(28), endDate: daysAgo(1) }

  async function saq(body) {
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
  console.log('=== GOOGLE SEARCH CONSOLE (last 28d) ===')
  console.log(`Clicks ${t.clicks || 0}  ·  Impressions ${t.impressions || 0}  ·  CTR ${((t.ctr || 0) * 100).toFixed(1)}%  ·  Avg position ${(t.position || 0).toFixed(1)}`)
  if (indexed != null) console.log(`Sitemap: ${indexed} indexed / ${submitted} submitted`)
  console.log('\nTop queries (clicks/impr):')
  if (!queries.length) console.log('  (no search impressions yet — newly indexed)')
  for (const q of queries) console.log(`  ${String(q.keys[0]).slice(0, 40).padEnd(40)} ${q.clicks}/${q.impressions}`)
  console.log('\nTop pages (clicks/impr):')
  for (const p of pages) console.log(`  ${String(p.keys[0]).replace('https://clubhanger.com', '').slice(0, 40).padEnd(40)} ${p.clicks}/${p.impressions}`)
  console.log('\nReal search funnel: grow indexed-count → impressions → clicks. Mine "top queries" for')
  console.log('high-impression/low-click pages to improve, and queries you ALMOST rank for → new pages.')
} catch (e) {
  soft(String(e.message || e))
}
