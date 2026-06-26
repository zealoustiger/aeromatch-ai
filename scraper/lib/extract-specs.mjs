/**
 * Spec extraction — pull structured specs out of free-text aircraft descriptions.
 *
 * Aggregated listings (esp. Barnstormers) bury TTAF/SMOH/avionics/engine/fuel in
 * dense aviation shorthand ("2700TT, 1570SMOH, 180hp O-360, 530W G3X GFC500").
 * Regex can't keep up with the format variety, so we use Claude Haiku with forced
 * tool-use (structured output) to extract them — then write only what survives a
 * verbatim guard, so we never store an inferred-but-unstated spec on the site.
 *
 * Columns populated (all already exist on aircraft_for_sale):
 *   ttaf, smoh, engine_type, avionics[], annual_due, damage_history
 *
 * Cost-safe by construction:
 *   - Only rows with a real description AND at least one missing spec are processed.
 *   - Each row is fingerprinted (content_hash + a version tag) in spec_extracted_hash
 *     so an unchanged listing is never re-extracted on later runs (~$0.002/listing).
 *   - No ANTHROPIC_API_KEY → no-op (logs and returns), never throws.
 *
 * Run standalone:  node scraper/extract-specs.mjs [--limit=N] [--source=barnstormers] [--dry-run]
 * Or as a pipeline step via runExtractSpecs() (called from ingest.mjs).
 */

import Anthropic from '@anthropic-ai/sdk'
import { adminClient, mapPool, sleep } from './ingest-core.mjs'

const MODEL = 'claude-haiku-4-5-20251001'
// Bump when the prompt/schema changes so existing rows re-extract on the next run.
const EXTRACT_VERSION = 'v1'

const SPEC_TOOL = {
  name: 'aircraft_specs',
  description:
    'Structured specs extracted from a US general-aviation aircraft sale listing. ' +
    'Use null for anything not clearly and explicitly stated. Never guess or infer.',
  input_schema: {
    type: 'object',
    properties: {
      ttaf: {
        type: ['number', 'null'],
        description:
          'Total time on the airframe in hours (TT / TTAF / TTSN / "Airframe N"). Number only, no units.',
      },
      smoh: {
        type: ['number', 'null'],
        description:
          'Hours since major engine overhaul (SMOH), or hours since a stated factory/major overhaul ("Engine 800 factory overhaul" → 800). Null if the engine is only described as new/SNEW with no hours.',
      },
      engine_type: {
        type: ['string', 'null'],
        description:
          'Engine model designation ONLY IF an explicit designation appears verbatim in the text, e.g. "O-360-A4M", "IO-550", "Lycoming O-320". Copy it as written. Do NOT infer an engine from the aircraft make/model. If no engine designation is written, return null.',
      },
      avionics: {
        type: ['array', 'null'],
        items: { type: 'string' },
        description:
          'Notable avionics/instruments named in the text, lightly normalized, e.g. ["Garmin GTN 530W","Garmin G3X Touch","GFC 500 autopilot","ADS-B Out"]. Null if none mentioned.',
      },
      fuel_gal: {
        type: ['number', 'null'],
        description: 'Usable fuel capacity in US gallons if stated. Number only.',
      },
      annual_due: {
        type: ['string', 'null'],
        description:
          'Annual inspection date/month if stated, e.g. "November 2025", "Oct 2025". Null if unstated.',
      },
      damage_history: {
        type: ['boolean', 'null'],
        description:
          'true if any damage/accident history is mentioned; false if explicitly "no damage"/"no damage history"; null if unstated.',
      },
    },
    required: ['ttaf', 'smoh', 'engine_type', 'avionics', 'fuel_gal', 'annual_due', 'damage_history'],
  },
}

const SYSTEM =
  'You extract structured specs from aircraft for-sale listings. Be conservative: ' +
  'only output a value when it is explicitly stated in the text. When a value is not ' +
  'stated, return null. Never fabricate an engine model, hours, or equipment.'

// A normalized token used to confirm an engine designation actually appears in the
// source text (guards against the model inventing a plausible engine for the type).
function engineCore(s) {
  if (!s) return null
  // Match the canonical GA piston/turbine designation pattern, e.g. O-360, IO-550, TSIO-520, GTSIO-520.
  const m = String(s).toUpperCase().match(/\b([A-Z]{1,5}-?\d{2,4}[A-Z0-9-]*)\b/)
  return m ? m[1].replace(/-/g, '') : null
}

// Drop an engine_type the source text doesn't actually contain — the one field
// the model is prone to hallucinate. Everything else is copied, not inferred.
function validateEngine(engine, description) {
  if (!engine) return null
  const core = engineCore(engine)
  if (!core) return null
  const hay = description.toUpperCase().replace(/-/g, '')
  return hay.includes(core) ? engine : null
}

// Clamp absurd numeric extractions (mis-parsed prices, tail numbers, years).
function cleanHours(n) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 50000) return null
  return Math.round(n)
}

// annual_due is a DATE column, but listings state it as a month/year ("November
// 2025", "Nov 2025", "11/2025", "2025-11"). Parse to an ISO date (first of the
// stated month) so the write is valid; return null when it can't be parsed to a
// real month+year, so we never fail the row update on an unparseable string.
const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
}
function parseAnnualDate(raw) {
  if (typeof raw !== 'string') return null
  const s = raw.trim().toLowerCase()
  // "November 2025" / "nov 2025"
  let m = s.match(/\b([a-z]{3,9})\.?\s+(\d{4})\b/)
  if (m && MONTHS[m[1]]) return `${m[2]}-${String(MONTHS[m[1]]).padStart(2, '0')}-01`
  // "2025-11" or "2025/11"
  m = s.match(/\b(\d{4})[-/](\d{1,2})\b/)
  if (m && +m[2] >= 1 && +m[2] <= 12) return `${m[1]}-${String(+m[2]).padStart(2, '0')}-01`
  // "11/2025"
  m = s.match(/\b(\d{1,2})[-/](\d{4})\b/)
  if (m && +m[1] >= 1 && +m[1] <= 12) return `${m[2]}-${String(+m[1]).padStart(2, '0')}-01`
  return null
}

function cleanAvionics(arr) {
  if (!Array.isArray(arr)) return null
  const out = [...new Set(arr.map((x) => String(x).trim()).filter((x) => x && x.length <= 60))]
  return out.length ? out.slice(0, 24) : null
}

async function extractOne(client, row) {
  const desc = (row.description || '').slice(0, 4000)
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 700,
    system: SYSTEM,
    tools: [SPEC_TOOL],
    tool_choice: { type: 'tool', name: 'aircraft_specs' },
    messages: [{ role: 'user', content: `Title: ${row.title || ''}\nDescription: ${desc}` }],
  })
  const out = res.content.find((c) => c.type === 'tool_use')?.input
  if (!out) return null

  // Build the column patch — only set columns that are currently null so we never
  // clobber a value a source feed already provided (e.g. hangar67/AFS ttaf).
  const patch = {}
  if (row.ttaf == null) { const v = cleanHours(out.ttaf); if (v != null) patch.ttaf = v }
  if (row.smoh == null) { const v = cleanHours(out.smoh); if (v != null) patch.smoh = v }
  if (row.engine_type == null) {
    const v = validateEngine(out.engine_type, desc)
    if (v) patch.engine_type = v
  }
  if (row.avionics == null) { const v = cleanAvionics(out.avionics); if (v) patch.avionics = v }
  if (row.annual_due == null) {
    const d = parseAnnualDate(out.annual_due)
    if (d) patch.annual_due = d
  }
  if (row.damage_history == null && typeof out.damage_history === 'boolean') {
    patch.damage_history = out.damage_history
  }
  return patch
}

/**
 * Extract specs for active listings that have a description but are missing specs.
 * Returns stats. Safe no-op without ANTHROPIC_API_KEY. Never throws on a single
 * row failure — it just skips that row (logged), so a bad description can't abort
 * the daily run.
 */
export async function runExtractSpecs({
  source = null,
  limit = 5000,
  dryRun = false,
  concurrency = 4,
  log = console.log,
} = {}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    log('  spec-extract: no ANTHROPIC_API_KEY — skipping')
    return { candidates: 0, extracted: 0, updated: 0, skipped: 0 }
  }

  const supa = adminClient()
  const fingerprint = (r) => `${EXTRACT_VERSION}:${r.content_hash ?? ''}`

  // Candidates: active listings with a real description, at least one spec column
  // still null, and not already extracted at this content_hash+version. Paginate in
  // 1000-row batches — PostgREST caps a single response at ~1000 rows, so without
  // this the unstamped candidates that fall past the first page are never seen and
  // the backfill can't converge. We stop early once we've collected `limit` rows
  // that actually need work.
  const cols =
    'id, source, title, description, content_hash, ttaf, smoh, engine_type, avionics, annual_due, damage_history, spec_extracted_hash'
  const PAGE = 1000
  const rows = []
  for (let from = 0; rows.length < limit; from += PAGE) {
    let q = supa
      .from('aircraft_for_sale')
      .select(cols)
      .eq('status', 'active')
      .not('description', 'is', null)
      .or('ttaf.is.null,smoh.is.null,engine_type.is.null,avionics.is.null,annual_due.is.null,damage_history.is.null')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (source) q = q.eq('source', source)
    const { data, error } = await q
    if (error) { log(`  spec-extract: query error: ${error.message}`); break }
    if (!data || data.length === 0) break
    // Skip thin descriptions and rows already extracted at this fingerprint.
    for (const r of data) {
      if ((r.description || '').trim().length >= 40 && r.spec_extracted_hash !== fingerprint(r)) {
        rows.push(r)
        if (rows.length >= limit) break
      }
    }
    if (data.length < PAGE) break
  }
  log(`  spec-extract: ${rows.length} candidate listing(s)${source ? ` (${source})` : ''}`)
  if (rows.length === 0) return { candidates: 0, extracted: 0, updated: 0, skipped: 0 }

  const client = new Anthropic()
  let extracted = 0
  let updated = 0
  let skipped = 0
  let done = 0

  await mapPool(rows, concurrency, async (row) => {
    let patch = null
    try {
      patch = await extractOne(client, row)
      extracted++
    } catch (e) {
      skipped++
      if (e?.status === 429) await sleep(2000)
      if (++done % 100 === 0) log(`  …${done}/${rows.length}`)
      return
    }

    const fp = fingerprint(row)
    if (!dryRun) {
      // Always stamp the fingerprint (even when nothing new was found) so we don't
      // re-pay for this listing until its description changes.
      const update = { ...(patch ?? {}), spec_extracted_hash: fp }
      const { error: uErr } = await supa.from('aircraft_for_sale').update(update).eq('id', row.id)
      if (uErr) { skipped++; log(`  update error (${row.id}): ${uErr.message}`); return }
      if (patch && Object.keys(patch).length) updated++
    } else if (patch && Object.keys(patch).length) {
      updated++
    }
    if (++done % 100 === 0) log(`  …${done}/${rows.length} (${updated} enriched)`)
  })

  log(`  spec-extract: ${extracted} read, ${updated} enriched, ${skipped} skipped`)
  return { candidates: rows.length, extracted, updated, skipped }
}
