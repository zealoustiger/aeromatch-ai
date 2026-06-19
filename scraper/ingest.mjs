#!/usr/bin/env node
/**
 * Planes-for-Sale ingestion orchestrator.
 *
 * Runs one or more source adapters and feeds their listings through the shared
 * ingestion core (upsert + content-hash + price-change + sold-detection).
 *
 * Usage:
 *   node scraper/ingest.mjs                      # all sources, default depth
 *   node scraper/ingest.mjs --source=barnstormers
 *   node scraper/ingest.mjs --pages=3 --dry-run
 *
 * Env (from .env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { loadEnvLocal, runIngest } from './lib/ingest-core.mjs'
import * as barnstormers from './adapters/barnstormers.mjs'
import * as hangar67 from './adapters/hangar67.mjs'
import * as aircraftforsale from './adapters/aircraftforsale.mjs'
// globalplanesearch is written and works, but DISABLED by default: its static
// browse feed is airliner/ACMI-heavy and its make/category filters only apply
// via JS, so it's a poor GA fit until we add a headless/unblocker fetch layer.
// Enable explicitly with --source=globalplanesearch if you want to experiment.
import * as globalplanesearch from './adapters/globalplanesearch.mjs'

const DEFAULT_ADAPTERS = [barnstormers, hangar67, aircraftforsale]
const ALL_ADAPTERS = [barnstormers, hangar67, aircraftforsale, globalplanesearch]

async function main() {
  loadEnvLocal()
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const pagesArg = args.find((a) => a.startsWith('--pages='))
  const pages = pagesArg ? parseInt(pagesArg.split('=')[1], 10) : 2
  const sourceArg = args.find((a) => a.startsWith('--source='))
  const only = sourceArg ? sourceArg.split('=')[1] : null

  const adapters = only ? ALL_ADAPTERS.filter((a) => a.source === only) : DEFAULT_ADAPTERS
  if (adapters.length === 0) {
    console.error(`Unknown source "${only}". Known: ${ALL_ADAPTERS.map((a) => a.source).join(', ')}`)
    process.exit(1)
  }

  console.log(`=== Planes-for-Sale ingestion (${dryRun ? 'DRY RUN' : 'live'}, pages=${pages}) ===\n`)
  const summary = []
  for (const adapter of adapters) {
    console.log(`▸ ${adapter.label}`)
    let rows = []
    try {
      rows = await adapter.fetchListings({ pages, log: console.log })
    } catch (e) {
      console.log(`  fetch error: ${e.message}`)
    }
    const stats = await runIngest({ source: adapter.source, rows, dryRun })
    summary.push(stats)
    console.log(
      `  → ${stats.scraped} scraped` +
        (dryRun
          ? ' (dry run, no writes)'
          : `, ${stats.changed} changed, ${stats.priceDrops} price drops, ${stats.priceRises} price rises, ${stats.markedSold} marked sold`) +
        '\n'
    )
  }

  console.log('=== Summary ===')
  for (const s of summary) {
    console.log(`  ${s.source.padEnd(18)} ${s.scraped} listings`)
  }
  console.log(`\nDone${dryRun ? ' (dry run)' : ''}.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
