export interface DemandFamilyEntry {
  makeSlug: string
  modelSlug: string
  make: string
  model: string
  modelPattern: string
  notModelPattern?: string
}

export interface DemandFamily {
  key: string
  label: string
  make: string
  modelPattern: string
  notModelPattern?: string
}

// Mirrors seo.ts's private `ilikeToRegExp` (SQL ilike -> case-insensitive
// RegExp: `%` = any run of chars, `_` = one char). Kept as a local duplicate,
// not imported, so this stays a zero-runtime-import pure module (the curated
// entries are injected by the caller instead) — same precedent as the cron
// route / alertMatchCounts.ts / alertEditCriteria.ts each keeping their own
// independent source_path resolver rather than sharing one.
function ilikeToRegExp(pattern: string): RegExp {
  let out = '^'
  for (const ch of pattern) {
    if (ch === '%') out += '[\\s\\S]*'
    else if (ch === '_') out += '[\\s\\S]'
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(out + '$', 'i')
}

function toFamily(entry: DemandFamilyEntry): DemandFamily {
  return {
    key: `${entry.makeSlug}/${entry.modelSlug}`,
    label: `${entry.make} ${entry.model}`,
    make: entry.make,
    modelPattern: entry.modelPattern,
    notModelPattern: entry.notModelPattern,
  }
}

/**
 * Buckets an alert's `source_path` into a curated make+model "family" for the
 * demand-vs-supply admin block, or null when the alert isn't targeting one
 * specific curated model (make-only, state/price-only, partnerships, seekers,
 * an uncurated model, homepage, browse/filter with no make+model, etc).
 *
 * `entries` is the caller's curated family list (in production, `seo.ts`'s
 * `SEO_MAKE_MODELS`) — injected rather than imported so this stays a pure,
 * zero-runtime-import module unit-testable via the plain Node test runner
 * (same DI precedent as `buildWeeklyTrend(rows, now)`).
 *
 * Only entries present in `entries` are bucketed — that keeps every "N live
 * listings" figure paired with the exact same modelPattern/notModelPattern
 * the public `/aircraft/[make]/[model]` page uses, so admin and public counts
 * always agree.
 */
export function familyForSourcePath(
  sourcePath: string | null | undefined,
  entries: DemandFamilyEntry[]
): DemandFamily | null {
  if (!sourcePath) return null
  const [pathOnly, qs] = sourcePath.split('?')
  const path = pathOnly.toLowerCase().replace(/\/+$/, '') || '/'
  const segments = path.split('/').filter(Boolean)

  // /aircraft/{makeSlug}/{modelSlug} or /aircraft/{makeSlug}/{modelSlug}/{state}
  if (segments[0] === 'aircraft' && (segments.length === 3 || segments.length === 4)) {
    const [, makeSlug, modelSlug] = segments
    const entry = entries.find((e) => e.makeSlug === makeSlug && e.modelSlug === modelSlug)
    return entry ? toFamily(entry) : null
  }

  // /aircraft?make=X&model=Y
  if (path === '/aircraft' && qs) {
    const params = new URLSearchParams(qs)
    const make = params.get('make')?.trim()
    const model = params.get('model')?.trim()
    if (make && model) {
      const makeLc = make.toLowerCase()
      const entry = entries.find((e) => {
        if (!makeLc.includes(e.make.toLowerCase())) return false
        if (!ilikeToRegExp(e.modelPattern).test(model)) return false
        if (e.notModelPattern && ilikeToRegExp(e.notModelPattern).test(model)) return false
        return true
      })
      if (entry) return toFamily(entry)
    }
    return null
  }

  return null
}
