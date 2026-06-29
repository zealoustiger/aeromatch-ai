#!/usr/bin/env node
// ADS-B base-confirmation for outreach targets, via OpenSky Network (free, non-
// commercial). For each target hex it samples recent flights (2-day windows — the
// /flights/aircraft endpoint caps each query at 2 UTC-day partitions), tallies the
// airports it departs/arrives at, and writes the most-frequent field back to
// outreach_targets as the confirmed home base. Registration address ≠ home base, so
// this is what actually verifies a plane is hangared at KHWD/KOAK/KCCR.
//
// OpenSky's free tier is small and GA aircraft fly rarely, so confirming a tail can
// burn many empty-window queries. This script therefore (a) treats HTTP 429 as a
// hard "out of budget" signal and ABORTS rather than ever writing a false "no data",
// and (b) processes only a small batch per run (--limit, default 3) so a nightly
// cron drips through the list over several days without tripping the rate limit.
//
// Usage: node nightshift/bin/adsb-confirm.mjs [--all] [--limit N]
//   default: up to 3 targets not yet ADS-B-resolved.  --all: also re-check resolved.
// Env (falls back to .env.local): OPENSKY_CLIENT_ID, OPENSKY_CLIENT_SECRET,
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

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
const CID = env.OPENSKY_CLIENT_ID
const CSEC = env.OPENSKY_CLIENT_SECRET
const SB_URL = (env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!CID || !CSEC) { console.error('Missing OPENSKY_CLIENT_ID/SECRET'); process.exit(1) }
if (!SB_URL || !SB_KEY) { console.error('Missing Supabase service-role creds'); process.exit(1) }

const ALL = process.argv.includes('--all')
const limArg = process.argv.indexOf('--limit')
const LIMIT = limArg >= 0 ? Math.max(1, parseInt(process.argv[limArg + 1], 10) || 3) : 3

const DAY = 86_400
const MAX_WINDOWS = 15       // ~30 days back — keeps each tail's cost bounded
const ENOUGH_FLIGHTS = 6     // stop early once we have a usable sample
const REQ_GAP_MS = 1500      // polite spacing between calls
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Sentinel thrown to unwind out of a tail + the whole run when the budget is gone.
class RateLimited extends Error {}

async function token() {
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: CID, client_secret: CSEC })
  const res = await fetch(
    'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
    { method: 'POST', body }
  )
  if (!res.ok) throw new Error(`OpenSky auth ${res.status}`)
  return (await res.json()).access_token
}

async function flightsWindow(tok, hex, begin, end) {
  const url = `https://opensky-network.org/api/flights/aircraft?icao24=${hex}&begin=${begin}&end=${end}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } })
  if (res.status === 404) return [] // OpenSky returns 404 for "no flights in window"
  if (res.status === 429) {
    // One grace retry after a longer wait, in case it's a brief per-minute cap.
    await sleep(12_000)
    const r2 = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } })
    if (r2.status === 404) return []
    if (r2.status === 429) throw new RateLimited()
    if (!r2.ok) throw new Error(`flights ${r2.status}`)
    return r2.json()
  }
  if (!res.ok) throw new Error(`flights ${res.status}`)
  return res.json()
}

// Decide a home base from an airport-hit tally. Requires a clear plurality so a
// 1-vs-1 tie (noise) never gets asserted as "confirmed".
function decideBase(tally) {
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1])
  const top = ranked.slice(0, 4).map(([a, n]) => `${a}×${n}`).join(', ')
  if (!ranked.length) return { base: null, confidence: 'no-adsb-data', top }
  const [a1, n1] = ranked[0]
  const n2 = ranked[1]?.[1] ?? 0
  const confident = n1 >= 3 && n1 >= 2 * n2
  return { base: a1, confidence: confident ? 'adsb-confirmed' : 'adsb-inconclusive', top }
}

// Sample a hex's recent flights and infer its home base. Throws RateLimited if the
// budget runs out (so the run aborts without writing a misleading verdict).
async function inferBase(tok, hex) {
  const now = Math.floor(Date.now() / 1000)
  const today = now - (now % DAY)
  const tally = new Map()
  let flights = 0
  for (let w = 0; w < MAX_WINDOWS; w++) {
    const end = today - w * 2 * DAY
    const begin = end - 2 * DAY
    const fl = await flightsWindow(tok, hex, begin, end) // may throw RateLimited
    for (const f of fl) {
      flights++
      for (const a of [f.estDepartureAirport, f.estArrivalAirport]) {
        if (a) tally.set(a, (tally.get(a) ?? 0) + 1)
      }
    }
    if (flights >= ENOUGH_FLIGHTS) break
    await sleep(REQ_GAP_MS)
  }
  const { base, confidence, top } = decideBase(tally)
  const summary = flights
    ? `${flights} flights (~30d) · ${top}`
    : 'no flights in ~30d'
  return { base, confidence, summary }
}

async function sbGet(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  })
  if (!res.ok) throw new Error(`supabase GET ${res.status}`)
  return res.json()
}
async function sbPatch(id, patch) {
  const res = await fetch(`${SB_URL}/rest/v1/outreach_targets?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`supabase PATCH ${res.status}: ${await res.text()}`)
}

// Pick the least-recently-checked unresolved targets first, so reruns make progress.
const resolved = "('adsb-confirmed','adsb-inconclusive','no-adsb-data')"
const filter = ALL ? '' : `&based_confidence=not.in.${resolved}`
const targets = await sbGet(
  `outreach_targets?select=id,n_number,mode_s_hex,airport,owner${filter}` +
    `&order=base_checked_at.asc.nullsfirst&limit=${LIMIT}`
)
if (!targets.length) {
  console.log('No targets to check.')
  process.exit(0)
}
const tok = await token()
console.log(`Checking ${targets.length} target(s) via OpenSky (limit ${LIMIT})…\n`)

const stamp = new Date().toISOString()
let done = 0
try {
  for (const t of targets) {
    const hex = (t.mode_s_hex || '').toLowerCase().trim()
    if (!hex) { console.log(`${t.n_number}: no hex, skipped`); continue }
    const { base, confidence, summary } = await inferBase(tok, hex)
    const matches = base && t.airport && base.toUpperCase() === t.airport.toUpperCase()
    await sbPatch(t.id, {
      confirmed_base: base,
      adsb_summary: summary,
      base_checked_at: stamp,
      based_confidence: confidence,
    })
    done++
    const flag = !base
      ? '— no data'
      : confidence === 'adsb-confirmed'
        ? (matches ? `✓ ${base}` : `≠ at ${base} (target ${t.airport})`)
        : `~ ${base} (inconclusive)`
    console.log(`${t.n_number.padEnd(8)} ${String(t.airport).padEnd(5)} ${flag.padEnd(28)} ${summary}`)
    await sleep(REQ_GAP_MS)
  }
  console.log(`\nDone — ${done} target(s) updated.`)
} catch (e) {
  if (e instanceof RateLimited) {
    console.log(`\n⚠️  OpenSky rate limit hit — stopped after ${done} clean update(s).`)
    console.log('Remaining targets left UNCHANGED (no false verdicts). Re-run later / let the nightly cron continue.')
    process.exit(0)
  }
  throw e
}
