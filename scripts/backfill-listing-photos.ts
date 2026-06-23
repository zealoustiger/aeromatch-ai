// Backfill real photos onto aircraft_for_sale listings by re-fetching each
// source page and harvesting its gallery (hotlinked URLs — Phase 1).
//
//   npx tsx scripts/backfill-listing-photos.ts            # all pending
//   npx tsx scripts/backfill-listing-photos.ts --limit 30 # test batch
//   npx tsx scripts/backfill-listing-photos.ts --force    # re-fetch already-done rows
//
// Idempotent: rows with images_fetched_at set are skipped unless --force.

import { fetchListingPhotos } from '../src/lib/listingPhotos'

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!
const SUPPORTED = ['barnstormers', 'aircraftforsale']
const CONCURRENCY = 6

const args = process.argv.slice(2)
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity
const force = args.includes('--force')

type Row = { id: string; source: string; source_url: string }

async function sb(path: string, init?: RequestInit) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function pool<T>(items: T[], n: number, fn: (t: T) => Promise<void>) {
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) await fn(items[i++])
    })
  )
}

async function main() {
  const srcFilter = `source=in.(${SUPPORTED.join(',')})`
  const fetchedFilter = force ? '' : '&images_fetched_at=is.null'
  const rows: Row[] = await sb(
    `aircraft_for_sale?select=id,source,source_url&${srcFilter}${fetchedFilter}&order=first_seen_at.desc`
  )
  const todo = rows.slice(0, limit === Infinity ? rows.length : limit)
  console.log(`Backfilling photos for ${todo.length} listing(s) (of ${rows.length} pending)…`)

  let withPhotos = 0,
    noPhotos = 0,
    errors = 0,
    done = 0
  await pool(todo, CONCURRENCY, async (row) => {
    try {
      const { images } = await fetchListingPhotos(row.source, row.source_url)
      await sb(`aircraft_for_sale?id=eq.${row.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          images,
          image_is_placeholder: images.length === 0,
          images_fetched_at: new Date().toISOString(),
        }),
      })
      if (images.length) withPhotos++
      else noPhotos++
    } catch (e) {
      errors++
      console.error(`  ✗ ${row.source} ${row.source_url}: ${(e as Error).message}`)
    }
    if (++done % 25 === 0) console.log(`  …${done}/${todo.length}`)
  })

  console.log(`\nDone. ${withPhotos} got photos, ${noPhotos} had none, ${errors} errors.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
