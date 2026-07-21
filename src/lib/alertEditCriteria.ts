import { STATE_NAMES, describeAircraftFilters } from '@/lib/seo'
import { AVIONICS_FILTER_OPTIONS, parseAvionicsFilter } from '@/lib/avionicsClassify'

/**
 * Editable-criteria support for `/alerts/manage`'s inline Edit form.
 *
 * Deliberately narrower than alert-digest's `parseSourcePath`
 * (`src/app/api/cron/alert-digest/route.ts`) — only the "modern query-string
 * shape" (`/aircraft?make=..`, `/partnerships?make=..`, `/partnerships/seeking?make=..`)
 * is editable here, because it's the only shape every current capture point
 * (`AlertSignup` on `/aircraft`, `/partnerships`, listing detail pages) actually
 * produces AND the only shape whose fields round-trip losslessly through a flat
 * form. Legacy path-segment SEO shapes (`/aircraft/[make]/[model]`,
 * `/aircraft/for-sale/[state]`, etc.) resolve through a curated
 * `modelPattern`/`notModelPattern` pair that can't be safely reconstructed from a
 * plain make/model text field — editing one of those could silently narrow or
 * widen the match in a way the user never asked for. Alerts on a legacy or
 * unparseable `source_path` simply get no Edit button; Pause/Resume/Delete still
 * work on them.
 *
 * This file intentionally does NOT import from (or get imported by) the cron
 * route — that route is left untouched this cycle. If the two ever need to share
 * more logic, extracting a common module is a follow-up, not this slice.
 */

export type EditableAlertTarget =
  | { type: 'aircraft'; make: string; model: string; state: string; minPrice: string; maxPrice: string; dealOnly: boolean }
  | { type: 'partnership'; make: string; state: string; airports: string[] }
  | { type: 'seeker'; make: string; model: string; state: string; airports: string[] }

export interface AlertCriteriaFields {
  make?: string
  model?: string
  state?: string
  minPrice?: string
  maxPrice?: string
  airports?: string[]
  dealOnly?: boolean
}

const EDITABLE_PATHS = new Set(['/aircraft', '/partnerships', '/partnerships/seeking'])

// Normalize free text / a comma-joined query value into a deduped list of
// ICAO/FAA airport codes. Mirrors `SeekerFilters.tsx`/`PartnershipFilters.tsx`'s
// identical local helper (small enough, and specific enough to each caller's
// input shape, that a shared extraction isn't worth it yet).
function parseAirportCodes(raw: string): string[] {
  const out: string[] = []
  for (const token of raw.split(/[\s,]+/)) {
    const code = token.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length >= 2 && code.length <= 4 && !out.includes(code)) out.push(code)
  }
  return out
}

/** Parse a `source_path` into pre-fillable form fields, or null when not editable. */
export function parseEditableAlertTarget(raw: string | null): EditableAlertTarget | null {
  const [pathOnly, qs] = (raw ?? '').split('?')
  const p = pathOnly.toLowerCase().replace(/\/$/, '') || '/'
  if (!EDITABLE_PATHS.has(p)) return null

  const params = new URLSearchParams(qs ?? '')
  const g = (k: string) => params.get(k)?.trim() ?? ''

  if (p === '/aircraft') {
    return {
      type: 'aircraft',
      make: g('make'),
      model: g('model'),
      state: g('state').toUpperCase(),
      minPrice: g('min_price'),
      maxPrice: g('max_price'),
      dealOnly: g('deal') === 'good',
    }
  }
  if (p === '/partnerships/seeking') {
    // `airports=` (the modern multi-select shape, 1+ codes) wins; falls back to
    // the legacy single `airport=` field for old links/saved searches.
    const airports = parseAirportCodes(g('airports') || g('airport'))
    return {
      type: 'seeker',
      make: g('make'),
      model: g('model'),
      state: g('state').toUpperCase(),
      airports,
    }
  }
  return {
    type: 'partnership',
    make: g('make'),
    state: g('state').toUpperCase(),
    airports: parseAirportCodes(g('airports') || g('airport')),
  }
}

/** A positive-integer price string, or undefined for anything else (blank, 0, negative, junk). */
function cleanPrice(v: string | undefined): string | undefined {
  if (!v) return undefined
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? String(n) : undefined
}

/**
 * Rebuild `source_path` + `context` from edited fields, layered onto the alert's
 * EXISTING query string so any param the edit form doesn't expose (e.g. an
 * aircraft alert's `min_year`/`max_tt`, set from a more advanced filter search
 * originally) survives the edit untouched instead of being silently dropped.
 */
export function buildAlertCriteriaUpdate(
  type: EditableAlertTarget['type'],
  currentSourcePath: string | null,
  fields: AlertCriteriaFields,
  removeKeys?: string[]
): { sourcePath: string; context: string | null } {
  const base = type === 'aircraft' ? '/aircraft' : type === 'seeker' ? '/partnerships/seeking' : '/partnerships'
  const [, qs] = (currentSourcePath ?? '').split('?')
  const params = new URLSearchParams(qs ?? '')
  removeKeys?.forEach((key) => params.delete(key))

  const set = (key: string, value: string | undefined) => {
    if (value) params.set(key, value)
    else params.delete(key)
  }

  // Writes the (deduped, uppercased) airport list into the modern `airports=`
  // key — same normalization the browse-page multi-select filters apply, even
  // for a single code — and drops the legacy `airport=` key plus `radius`
  // (only meaningful paired with exactly one airport, mirrors
  // `SeekerFilters`/`PartnershipFilters`' own `setAirports`) whenever the
  // count isn't exactly 1.
  const setAirports = (codes: string[] | undefined) => {
    const clean = [...new Set((codes ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean))]
    params.delete('airport')
    if (clean.length) params.set('airports', clean.join(','))
    else params.delete('airports')
    if (clean.length !== 1) params.delete('radius')
  }

  if (type === 'aircraft') {
    set('make', fields.make?.trim())
    set('model', fields.model?.trim())
    set('state', fields.state?.trim().toUpperCase())
    set('min_price', cleanPrice(fields.minPrice))
    set('max_price', cleanPrice(fields.maxPrice))
    set('deal', fields.dealOnly ? 'good' : undefined)
  } else if (type === 'partnership') {
    set('make', fields.make?.trim())
    set('state', fields.state?.trim().toUpperCase())
    setAirports(fields.airports)
  } else {
    set('make', fields.make?.trim())
    set('model', fields.model?.trim())
    set('state', fields.state?.trim().toUpperCase())
    setAirports(fields.airports)
  }

  const qsOut = params.toString()
  const sourcePath = qsOut ? `${base}?${qsOut}` : base
  const context = describeContext(type, params)
  return { sourcePath, context }
}

export interface WidenCandidate {
  fields: AlertCriteriaFields
  description: string
}

/**
 * Pick the single least-destructive loosening for a dead (0-match) editable
 * alert — drop the model to go make-wide, else clear the state/airport to go
 * nationwide. Never touches `make` itself or price range (see GOAL.md's
 * honesty gate — this is a candidate to be re-verified against a real count
 * by the caller, not a guaranteed fix). Returns `null` when there's no next
 * step left to widen (already make-only / nationwide).
 */
export function computeWidenCandidate(target: EditableAlertTarget): WidenCandidate | null {
  if (target.type === 'aircraft') {
    if (target.model) {
      return {
        fields: { make: target.make, model: '', state: target.state, minPrice: target.minPrice, maxPrice: target.maxPrice, dealOnly: target.dealOnly },
        description: target.make ? `Show all ${target.make} listings` : 'Show all makes and models',
      }
    }
    if (target.state) {
      return {
        fields: { make: target.make, model: target.model, state: '', minPrice: target.minPrice, maxPrice: target.maxPrice, dealOnly: target.dealOnly },
        description: 'Search every state',
      }
    }
    return null
  }
  if (target.type === 'partnership') {
    if (target.airports.length) {
      const stateName = target.state ? STATE_NAMES[target.state] : undefined
      return {
        fields: { make: target.make, state: target.state, airports: [] },
        description: stateName ? `Search all of ${stateName}` : 'Search every location',
      }
    }
    if (target.state) {
      return {
        fields: { make: target.make, state: '', airports: target.airports },
        description: 'Search every state',
      }
    }
    return null
  }
  // seeker
  if (target.model) {
    return {
      fields: { make: target.make, model: '' },
      description: target.make ? `Show all ${target.make} pilots` : 'Show all pilots seeking a share',
    }
  }
  return null
}

/**
 * Human-readable label for a locally-remembered `source_path` — the same
 * phrasing `buildAlertCriteriaUpdate` computes for a saved alert's `context`
 * column, reused here for the homepage's "since your last visit" recap module,
 * which has no DB row to read a stored `context` from (anonymous subscribers
 * are tracked only by the browser's own remembered source_paths). Returns
 * `null` for the bare "all" homepage path and any legacy/curated SEO path
 * shape this module doesn't attempt to phrase (path-segment routes like
 * `/aircraft/cessna/172`) — callers should fall back to a generic label
 * ("New listings") rather than guess at a description.
 */
export function describeLocalAlertContext(sourcePath: string): string | null {
  const target = parseEditableAlertTarget(sourcePath)
  if (!target) return null
  const [, qs] = sourcePath.split('?')
  return describeContext(target.type, new URLSearchParams(qs ?? ''))
}

function describeContext(type: EditableAlertTarget['type'], params: URLSearchParams): string | null {
  if (type === 'aircraft') {
    return describeAircraftFilters(Object.fromEntries(params.entries()))
  }
  if (type === 'partnership') {
    const make = params.get('make')?.trim() || undefined
    const airports = parseAirportCodes(params.get('airports') || params.get('airport') || '')
    const stateCode = params.get('state')?.trim().toUpperCase()
    const stateName = stateCode ? STATE_NAMES[stateCode] : undefined
    const locationClause = airports.length ? `near ${airports.join(', ')}` : stateName ? `in ${stateName}` : undefined
    return [make, locationClause].filter(Boolean).join(' ') || null
  }
  // seeker
  const make = params.get('make')?.trim() || undefined
  const model = params.get('model')?.trim() || undefined
  const airports = parseAirportCodes(params.get('airports') || params.get('airport') || '')
  const stateCode = params.get('state')?.trim().toUpperCase()
  const stateName = stateCode ? STATE_NAMES[stateCode] : undefined
  const locationClause = airports.length ? `near ${airports.join(', ')}` : stateName ? `in ${stateName}` : undefined
  return [make, model, locationClause].filter(Boolean).join(' ') || null
}

/** The form-exposed query-param keys per type — everything else on `source_path` is "hidden." */
const EXPOSED_KEYS: Record<EditableAlertTarget['type'], Set<string>> = {
  aircraft: new Set(['make', 'model', 'state', 'min_price', 'max_price', 'deal']),
  partnership: new Set(['make', 'state', 'airport', 'airports']),
  seeker: new Set(['make', 'model', 'state', 'airport', 'airports']),
}

/** Rebuilds the `AlertCriteriaFields` the edit form would submit for an UNCHANGED target — used to round-trip its own exposed fields when only a hidden param is being removed. */
export function targetToFields(target: EditableAlertTarget): AlertCriteriaFields {
  if (target.type === 'aircraft') {
    return { make: target.make, model: target.model, state: target.state, minPrice: target.minPrice, maxPrice: target.maxPrice, dealOnly: target.dealOnly }
  }
  if (target.type === 'partnership') {
    return { make: target.make, state: target.state, airports: target.airports }
  }
  return { make: target.make, model: target.model, state: target.state, airports: target.airports }
}

export interface HiddenCriterion {
  key: string
  label: string
}

/** A positive integer, or null for anything blank/zero/negative/non-numeric. */
function positiveInt(raw: string): number | null {
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Human-readable label for one hidden query param, reusing `describeAircraftFilters`'
 * naming conventions for the params it already knows how to phrase. Falls back to an
 * honest `"key: value"` for anything unrecognized rather than silently dropping a real
 * criterion (GOAL.md's honesty gate — an alert's edit view must never hide what it
 * actually matches on).
 */
function labelForHiddenParam(key: string, value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  switch (key) {
    case 'min_year': {
      const n = positiveInt(trimmed)
      return n ? `${n} or newer` : null
    }
    case 'max_year': {
      const n = positiveInt(trimmed)
      return n ? `up to ${n}` : null
    }
    case 'min_tt': {
      const n = positiveInt(trimmed)
      return n ? `over ${n.toLocaleString('en-US')} hours` : null
    }
    case 'max_tt': {
      const n = positiveInt(trimmed)
      return n ? `under ${n.toLocaleString('en-US')} hours` : null
    }
    case 'q':
      return `matching "${trimmed}"`
    case 'grade': {
      const grades = trimmed
        .split(',')
        .map((g) => g.trim().toUpperCase())
        .filter((g) => ['A', 'B', 'C'].includes(g))
      return grades.length ? `grade ${grades.join(' or ')}` : null
    }
    case 'avionics': {
      const cats = parseAvionicsFilter(trimmed)
      if (!cats.length) return null
      const labels = AVIONICS_FILTER_OPTIONS.filter((o) => cats.includes(o.key)).map((o) => o.label.toLowerCase())
      return labels.length ? `with ${labels.join(' or ')}` : null
    }
    // Partnership alerts can carry a model filter (see partnershipModelFilter.ts) that
    // this edit form doesn't expose (only aircraft/seeker targets show a Model field).
    case 'model':
      return `model ${trimmed}`
    default:
      return `${key}: ${trimmed}`
  }
}

/**
 * Every query param on `source_path` that isn't one of this alert type's form-exposed
 * fields — the "advanced criteria still applies but you can't see it" gap this item
 * closes. Returns `[]` when there's nothing hidden (common case; no empty UI to render).
 */
export function getHiddenCriteria(type: EditableAlertTarget['type'], sourcePath: string | null): HiddenCriterion[] {
  const [, qs] = (sourcePath ?? '').split('?')
  const params = new URLSearchParams(qs ?? '')
  const exposed = EXPOSED_KEYS[type]
  const seen = new Set<string>()
  const hidden: HiddenCriterion[] = []
  for (const [key, value] of params.entries()) {
    if (exposed.has(key) || seen.has(key)) continue
    seen.add(key)
    const label = labelForHiddenParam(key, value)
    if (label) hidden.push({ key, label })
  }
  return hidden
}
