import { resolveMakeModelFamily, SEO_MAKE_MODELS } from './seo'

/**
 * Post-confirmation cross-sell: given the `source_path` of an alert a visitor just
 * confirmed, suggest one more alert worth having. Two suggestion types, tried in
 * order: (1) a curated **sibling model** (e.g. a Cessna 172 alert → suggest the
 * 182) when the confirmed alert names a model that maps to one; (2) the
 * **counterpart listing type** for the same make (aircraft ↔ partnerships)
 * otherwise. Only handles the modern query-string source-path shape
 * (`/aircraft?make=...`, `/partnerships?make=...`) that the browse-page inline
 * `AlertSignup` and `/alerts` chips produce — legacy path-segment alerts, no-make
 * alerts, and seeker alerts return null (no suggestion) rather than a weak one.
 */

export interface AlertCrossSellSuggestion {
  context: string
  sourcePath: string
  noun: 'aircraft' | 'partnership'
  label: string
}

function parseNounAndMake(
  sourcePath: string
): { noun: 'aircraft' | 'partnership' | 'seeker'; make?: string; model?: string } | null {
  const [pathOnly, qs] = sourcePath.split('?')
  const p = pathOnly.replace(/\/$/, '')
  if (!qs) return null
  const params = new URLSearchParams(qs)
  const make = params.get('make')?.trim() || undefined
  const model = params.get('model')?.trim() || undefined
  if (p === '/aircraft') return { noun: 'aircraft', make, model }
  if (p === '/partnerships') return { noun: 'partnership', make }
  if (p === '/partnerships/seeking') return { noun: 'seeker', make }
  return null
}

// Curated "buyers of this often also watch…" pairs, keyed by the confirmed
// alert's resolved `makeSlug/modelSlug` family (see `resolveMakeModelFamily`).
// Deliberately small and hand-picked — a wrong/surprising suggestion is worse
// than none (honesty gate), so only genuinely well-known step-up pairs within
// the same make are listed, not a generic "next model alphabetically" map.
const SIBLING_MODELS: Record<string, string> = {
  'cessna/172': 'cessna/182',
  'cessna/182': 'cessna/210',
  'cirrus/sr20': 'cirrus/sr22',
  'piper/cherokee': 'piper/arrow',
}

function getSiblingModelSuggestion(make: string, model: string): AlertCrossSellSuggestion | null {
  const family = resolveMakeModelFamily(make, model)
  if (!family) return null
  const siblingKey = SIBLING_MODELS[`${family.makeSlug}/${family.modelSlug}`]
  if (!siblingKey) return null
  const sibling = SEO_MAKE_MODELS.find((e) => `${e.makeSlug}/${e.modelSlug}` === siblingKey)
  if (!sibling) return null
  return {
    context: `${sibling.make} ${sibling.model}`,
    // The curated make+model page's own URL — already resolved by the digest
    // cron's `parseSourcePath` via the same `SEO_MAKE_MODELS` pattern, so the
    // resulting alert matches real listings from day one.
    sourcePath: `/aircraft/${sibling.makeSlug}/${sibling.modelSlug}`,
    noun: 'aircraft',
    label: `Also want alerts for the ${sibling.make} ${sibling.model}?`,
  }
}

export function getCrossSellSuggestion(sourcePath: string | null): AlertCrossSellSuggestion | null {
  const parsed = parseNounAndMake(sourcePath ?? '')
  if (!parsed?.make) return null
  const { noun, make, model } = parsed

  if (noun === 'aircraft') {
    const sibling = model ? getSiblingModelSuggestion(make, model) : null
    if (sibling) return sibling
    return {
      context: `${make} co-ownership partnerships`,
      sourcePath: `/partnerships?make=${encodeURIComponent(make)}`,
      noun: 'partnership',
      label: `Also want alerts for ${make} co-ownership partnerships?`,
    }
  }
  if (noun === 'partnership') {
    return {
      context: make,
      sourcePath: `/aircraft?make=${encodeURIComponent(make)}`,
      noun: 'aircraft',
      label: `Also want alerts for ${make} aircraft for sale?`,
    }
  }
  return null
}
