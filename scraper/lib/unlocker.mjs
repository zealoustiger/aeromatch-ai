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

// Fetch a URL through the Unlocker. Some protected pages intermittently return an
// empty/blocked body even through the Unlocker, so `minBytes` lets the caller
// reject those and retry until a real page comes back.
export async function unlockerFetch(url, { retries = 3, minBytes = 0, timeoutMs = 45000 } = {}) {
  if (!TOKEN) throw new Error('BRIGHTDATA_API_TOKEN not set (residential unlock unavailable)')
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
      if (res.ok && text.length >= minBytes) return text
      lastErr = new Error(`HTTP ${res.status}, ${text.length} bytes`)
    } catch (e) {
      lastErr = e
    }
    if (i < retries) await sleep(1200 * (i + 1) + Math.floor(Math.random() * 500))
  }
  throw lastErr
}
