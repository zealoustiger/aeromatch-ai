import { STATE_NAMES, describeAircraftFilters } from '@/lib/seo'

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
  | { type: 'partnership'; make: string; state: string; airport: string }
  | { type: 'seeker'; make: string; model: string }

export interface AlertCriteriaFields {
  make?: string
  model?: string
  state?: string
  minPrice?: string
  maxPrice?: string
  airport?: string
  dealOnly?: boolean
}

const EDITABLE_PATHS = new Set(['/aircraft', '/partnerships', '/partnerships/seeking'])

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
    return { type: 'seeker', make: g('make'), model: g('model') }
  }
  return { type: 'partnership', make: g('make'), state: g('state').toUpperCase(), airport: g('airport').toUpperCase() }
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
  fields: AlertCriteriaFields
): { sourcePath: string; context: string | null } {
  const base = type === 'aircraft' ? '/aircraft' : type === 'seeker' ? '/partnerships/seeking' : '/partnerships'
  const [, qs] = (currentSourcePath ?? '').split('?')
  const params = new URLSearchParams(qs ?? '')

  const set = (key: string, value: string | undefined) => {
    if (value) params.set(key, value)
    else params.delete(key)
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
    set('airport', fields.airport?.trim().toUpperCase())
  } else {
    set('make', fields.make?.trim())
    set('model', fields.model?.trim())
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
    if (target.airport) {
      const stateName = target.state ? STATE_NAMES[target.state] : undefined
      return {
        fields: { make: target.make, state: target.state, airport: '' },
        description: stateName ? `Search all of ${stateName}` : 'Search every location',
      }
    }
    if (target.state) {
      return {
        fields: { make: target.make, state: '', airport: target.airport },
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

function describeContext(type: EditableAlertTarget['type'], params: URLSearchParams): string | null {
  if (type === 'aircraft') {
    return describeAircraftFilters(Object.fromEntries(params.entries()))
  }
  if (type === 'partnership') {
    const make = params.get('make')?.trim() || undefined
    const airport = params.get('airport')?.trim().toUpperCase() || undefined
    const stateCode = params.get('state')?.trim().toUpperCase()
    const stateName = stateCode ? STATE_NAMES[stateCode] : undefined
    const locationClause = airport ? `near ${airport}` : stateName ? `in ${stateName}` : undefined
    return [make, locationClause].filter(Boolean).join(' ') || null
  }
  // seeker
  const make = params.get('make')?.trim() || undefined
  const model = params.get('model')?.trim() || undefined
  return [make, model].filter(Boolean).join(' ') || null
}
