#!/usr/bin/env node
/**
 * Standalone spec-extraction runner — pull structured specs (TTAF/SMOH/engine/
 * avionics/fuel/annual/damage) out of free-text listing descriptions via Claude
 * Haiku, and write the validated results back to aircraft_for_sale.
 *
 * The daily `ingest.mjs` calls runExtractSpecs() automatically after upsert; use
 * this script to backfill or to re-run a single source on demand.
 *
 *   node scraper/extract-specs.mjs                       # all sources, up to --limit
 *   node scraper/extract-specs.mjs --source=barnstormers
 *   node scraper/extract-specs.mjs --limit=50 --dry-run
 *
 * Env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 */

import { loadEnvLocal } from './lib/ingest-core.mjs'
import { runExtractSpecs } from './lib/extract-specs.mjs'

async function main() {
  loadEnvLocal()
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 5000
  const sourceArg = args.find((a) => a.startsWith('--source='))
  const source = sourceArg ? sourceArg.split('=')[1] : null

  console.log(`=== Spec extraction (${dryRun ? 'DRY RUN' : 'live'}, limit=${limit}${source ? `, source=${source}` : ''}) ===`)
  const stats = await runExtractSpecs({ source, limit, dryRun, log: console.log })
  console.log(`\nDone. ${stats.updated} listing(s) enriched of ${stats.candidates} candidate(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
