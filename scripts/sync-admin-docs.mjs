/**
 * Sync the nightshift markdown docs into the `admin_content` table so the
 * on-site admin dashboard (production) always shows the current backlog +
 * latest daily report — even though the report is generated on the staging
 * branch (prod and staging share one Supabase database).
 *
 * Run from the repo root:  node scripts/sync-admin-docs.mjs
 * Reads SUPABASE creds from .env.local.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { estimateMarkdown } from '../nightshift/bin/backlog-estimate.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Minimal .env.local loader (no dependency).
for (const line of existsSync(join(root, '.env.local'))
  ? readFileSync(join(root, '.env.local'), 'utf8').split('\n')
  : []) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const DOCS = [
  { key: 'backlog', title: 'Feature Backlog', file: 'nightshift/BACKLOG.md' },
  { key: 'daily_report', title: 'Daily Report', file: 'nightshift/REVIEW.md' },
]

const rows = DOCS.filter((d) => existsSync(join(root, d.file))).map((d) => {
  let content = readFileSync(join(root, d.file), 'utf8')
  // Prepend a live burn-down estimate (open items / cycles / hours / nights) to
  // the Backlog page so the admin sees how much work remains at a glance.
  if (d.key === 'backlog') {
    try { content = `${estimateMarkdown(content)}\n\n---\n\n${content}` } catch {}
  }
  return { key: d.key, title: d.title, content, updated_at: new Date().toISOString() }
})

if (rows.length === 0) {
  console.log('No docs found to sync.')
  process.exit(0)
}

const res = await fetch(`${URL}/rest/v1/admin_content?on_conflict=key`, {
  method: 'POST',
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
})

if (!res.ok) {
  console.error(`Sync failed ${res.status}: ${await res.text()}`)
  process.exit(1)
}
console.log(`Synced ${rows.map((r) => r.key).join(', ')} to admin_content.`)
