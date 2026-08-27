/**
 * Bright Data Web Unlocker fetch — shared by the photo harvester + Controller
 * ingester. Solves Cloudflare/anti-bot server-side and returns the raw HTML.
 * Env (.env.local): BRIGHTDATA_API_TOKEN, BRIGHTDATA_ZONE (default web_unlocker1).
 */
import { loadEnvLocal } from './ingest-core.mjs'

loadEnvLocal()
const TOKEN = process.env.BRIGHTDATA_API_TOKEN || ''
const ZONE = process.env.BRIGHTDATA_ZONE || 'web_unlocker1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const hasUnlocker = () => !!TOKEN

// ── Circuit breaker ──────────────────────────────────────────────────────────
// When the Bright Data account runs dry (balance exhausted or a spend cap hit),
// every request still answers HTTP 200 — with an EMPTY body. There is no error
// to distinguish it from a page that merely got blocked, so the retry logic
// below treats each one as worth another go: a 1465-listing run then burns
// ~4400 futile BILLED requests before giving up, on an account that is already
// over its limit. Once enough consecutive calls come back empty, stop trying for
// the rest of the process and fail loudly instead.
const EMPTY_TRIP = 12
let consecutiveEmpty = 0
let tripped = false
export const unlockerTripped = () => tripped

// Fetch a URL through the Unlocker. Some protected pages intermittently return an
// empty/blocked body even through the Unlocker, so `minBytes` lets the caller
// reject those and retry until a real page comes back.
export async function unlockerFetch(url, { retries = 3, minBytes = 0, timeoutMs = 45000 } = {}) {
  if (!TOKEN) throw new Error('BRIGHTDATA_API_TOKEN not set (residential unlock unavailable)')
  if (tripped) {
    throw new Error(
      `Web Unlocker returned an empty body ${EMPTY_TRIP}x in a row — treating the account as exhausted ` +
        `(check the Bright Data balance / spend cap). Skipping further requests this run.`
    )
  }
  let lastErr
  for (let i = 0; i <= retries; i++) {
    try {
      const signal = typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined
      const res = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone: ZONE, url, format: 'raw' }),
        signal,
      })
      const text = await res.text()
      // Track the empty-body signature specifically: a 200 with nothing in it.
      // A real block or error resets the counter — only the account-exhausted
      // pattern is sustained and uniform across every target.
      if (res.ok && text.length === 0) {
        if (++consecutiveEmpty >= EMPTY_TRIP) tripped = true
      } else {
        consecutiveEmpty = 0
      }
      if (res.ok && text.length >= minBytes && text.length > 0) return text
      lastErr = new Error(`HTTP ${res.status}, ${text.length} bytes`)
      if (tripped) throw lastErr
    } catch (e) {
      lastErr = e
      if (tripped) throw lastErr
    }
    if (i < retries) await sleep(1200 * (i + 1) + Math.floor(Math.random() * 500))
  }
  throw lastErr
}
