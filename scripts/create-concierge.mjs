/**
 * One-time: create the ClubHanger "concierge" house account and assign it as the
 * owner (poster_id) of every seed/demo partnership listing (the generated personas
 * like "Marcus T."). Once owned by a real auth user, the existing in-site messaging
 * flow works against them — an inquiry creates a real thread and emails the
 * concierge's address (set to the operator's inbox), so the operator can read &
 * reply by logging in as the concierge.
 *
 * Idempotent: re-running finds the existing concierge by email (never duplicates)
 * and re-syncs poster_id on any seed rows that are still unassigned.
 *
 * Seed listing = poster_id IS NULL AND source_url IS NULL AND the contact_email is
 * a synthetic demo domain (@example.com / @aeromatch-demo.com). Scraped listings
 * (facebook/craigslist) are deliberately NOT touched.
 *
 *   node scripts/create-concierge.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Minimal .env.local loader (same approach as scraper/lib/ingest-core.mjs).
function loadEnvLocal() {
  try {
    const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
      if (!m) continue
      const key = m[1]
      let val = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {}
}
loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Where seed-listing inquiries should land. The concierge account's own email is
// what the existing message-notification emails are sent to.
const CONCIERGE_EMAIL =
  process.env.SEED_CONCIERGE_EMAIL ||
  (process.env.ADMIN_EMAILS || '').split(',')[0].trim() ||
  'brian@iterative.vc'

const SYNTHETIC_DOMAINS = ['@example.com', '@aeromatch-demo.com']

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

// Find or create the concierge auth user.
async function ensureConcierge() {
  // Page through users to find an existing concierge by email (no get-by-email API).
  let page = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const found = data.users.find((u) => u.email?.toLowerCase() === CONCIERGE_EMAIL.toLowerCase())
    if (found) return { user: found, created: false, password: null }
    if (data.users.length < 200) break
    page++
  }

  // Strong random password (printed once so the operator can log in to reply).
  const password = `Ch-${cryptoRandom(24)}!7`
  const { data, error } = await admin.auth.admin.createUser({
    email: CONCIERGE_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { display_name: 'ClubHanger Concierge', concierge: true },
  })
  if (error) throw new Error(`createUser: ${error.message}`)
  return { user: data.user, created: true, password }
}

function cryptoRandom(n) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const buf = new Uint8Array(n)
  globalThis.crypto.getRandomValues(buf)
  return [...buf].map((b) => chars[b % chars.length]).join('')
}

async function main() {
  const { user, created, password } = await ensureConcierge()
  console.log(`Concierge user: ${user.email} (${user.id}) — ${created ? 'CREATED' : 'already existed'}`)
  if (created) {
    console.log(`\n  ⚠ SAVE THIS PASSWORD (shown once): ${password}`)
    console.log(`  Log in at /auth with ${user.email} to read & reply to seed-listing inquiries.\n`)
  }

  // Assign the concierge as owner of every still-unassigned seed listing.
  const orDomains = SYNTHETIC_DOMAINS.map((d) => `contact_email.ilike.*${d}`).join(',')
  const { data: seeds, error: selErr } = await admin
    .from('partnerships')
    .select('id, title, contact_name, contact_email')
    .is('poster_id', null)
    .is('source_url', null)
    .or(orDomains)
  if (selErr) throw new Error(`select seeds: ${selErr.message}`)

  if (!seeds || seeds.length === 0) {
    console.log('No unassigned seed listings found.')
    return
  }

  const ids = seeds.map((s) => s.id)
  const { error: updErr } = await admin
    .from('partnerships')
    .update({ poster_id: user.id })
    .in('id', ids)
  if (updErr) throw new Error(`update poster_id: ${updErr.message}`)

  console.log(`Assigned concierge as owner of ${ids.length} seed listing(s):`)
  for (const s of seeds) console.log(`  • ${s.contact_name ?? '—'} — ${s.title}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
