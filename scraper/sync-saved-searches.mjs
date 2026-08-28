#!/usr/bin/env node
/**
 * Saved-search → alert sync. Run after ingestion (nightshift/bin/run-scrape.sh).
 *
 * Mirrors every logged-in user's `saved_searches` row into a confirmed `alerts`
 * row, so a saved search actually notifies (the SignUpGate already promises
 * this). Idempotent, keyed on email + source_path.
 *
 * THIS SCRIPT DOES NOT SEND EMAIL. `/api/cron/alert-digest` (Vercel cron, see
 * vercel.json) is the single owner of alert digests, and `/api/cron/alert-instant`
 * of instant sends. This script used to send its own digests off the same
 * `alerts` rows and the same `last_digest_at` cursor, which meant the two
 * senders raced: whichever ran first each day advanced the cursor and the other
 * silently sent nothing. Worse, the cron is the only one that honours per-alert
 * frequency / snooze / pause / opt-outs, understands the full route set
 * (make/model SEO slugs, `?watch=price` single-listing watches, seekers, price
 * drops), and groups a subscriber's due alerts into ONE combined email — this
 * script honoured none of that and matched `/aircraft/<make>/<model>` SEO paths
 * with zero filters applied, i.e. an unfiltered firehose. The cron already
 * covers this script's entire alert set (`status in ('confirmed','active')` is
 * a superset of `status='active' AND confirmed_at IS NOT NULL`), so retiring
 * the send step here loses no subscriber and no listing. See git history for
 * the removed send path.
 *
 * Baseline-first is preserved by the cron, not by a stamp here: rows created
 * below have `last_digest_at` NULL, and the cron windows those from
 * `created_at` (= now), so a newly-synced search never blasts the back-catalog.
 * Do NOT reintroduce a `last_digest_at` stamp here — it would move the cursor
 * for a send the cron has not made yet, silently eating that alert's window.
 *
 * Usage:  node scraper/sync-saved-searches.mjs [--dry-run]
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import crypto from 'node:crypto'
import { loadEnvLocal } from './lib/ingest-core.mjs'
import { createClient } from '@supabase/supabase-js'

loadEnvLocal()
const DRY = process.argv.includes('--dry-run')

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
const log = (...a) => console.log(...a)
const now = () => new Date().toISOString()

// Sync saved_searches → confirmed alerts (idempotent, by email + source_path).
//
// NOTE (pre-existing, flagged not fixed): rows land `status: 'active'` rather
// than `'confirmed'`. The digest cron treats both as live, but `pauseAlert` /
// `snoozeAlert` in src/app/actions.ts only accept `'confirmed'`, so a
// synced-from-saved-search alert cannot be paused or snoozed from
// /alerts/manage. Changing this insert to `'confirmed'` (plus a one-off
// backfill of the existing 'active' rows) is the fix; it is a consent change,
// so it wants a human call rather than a silent flip here.
async function syncSavedSearches() {
  const { data: saved, error } = await supa.from('saved_searches').select('id,path,search_params,user_id')
  if (error) { log('saved_searches read failed:', error.message); return { synced: 0, failed: 1 } }
  const emailByUser = {}
  for (const s of saved || []) {
    if (!s.user_id || emailByUser[s.user_id] !== undefined) continue
    const { data } = await supa.auth.admin.getUserById(s.user_id)
    emailByUser[s.user_id] = data?.user?.email || null
  }
  let synced = 0, failed = 0
  for (const s of saved || []) {
    const email = emailByUser[s.user_id]
    if (!email) continue
    const source_path = s.search_params ? `${s.path}?${s.search_params}` : s.path
    const { data: existing } = await supa.from('alerts').select('id').eq('email', email).eq('source_path', source_path).limit(1)
    if (existing?.length) continue
    if (DRY) { log(`  [dry] would create alert from saved search: ${email}  ${source_path}`); synced++; continue }
    const { error: insertError } = await supa.from('alerts').insert({
      email, source_path, context: 'saved search', status: 'active', confirmed_at: now(),
      confirm_token: crypto.randomUUID(), unsubscribe_token: crypto.randomUUID(),
    })
    if (insertError) { log(`  ✗ sync failed ${email}  ${source_path}: ${insertError.message}`); failed++; continue }
    log(`  synced saved search → alert: ${email}  ${source_path}`)
    synced++
  }
  return { synced, failed }
}

async function main() {
  log(`=== saved-search → alert sync ${DRY ? '(DRY RUN — no writes)' : ''} ===`)
  const { synced, failed } = await syncSavedSearches()
  log(`Done. synced=${synced}  failed=${failed}  (digests are sent by /api/cron/alert-digest, not here)`)
}
main().catch((e) => { console.error(e); process.exit(1) })
