/**
 * Post-confirmation cross-sell: given the `source_path` of an alert a visitor just
 * confirmed, suggest the counterpart listing type for the same make (aircraft ↔
 * partnerships). Only handles the modern query-string source-path shape
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

function parseNounAndMake(sourcePath: string): { noun: 'aircraft' | 'partnership' | 'seeker'; make?: string } | null {
  const [pathOnly, qs] = sourcePath.split('?')
  const p = pathOnly.replace(/\/$/, '')
  if (!qs) return null
  const make = new URLSearchParams(qs).get('make')?.trim() || undefined
  if (p === '/aircraft') return { noun: 'aircraft', make }
  if (p === '/partnerships') return { noun: 'partnership', make }
  if (p === '/partnerships/seeking') return { noun: 'seeker', make }
  return null
}

export function getCrossSellSuggestion(sourcePath: string | null): AlertCrossSellSuggestion | null {
  const parsed = parseNounAndMake(sourcePath ?? '')
  if (!parsed?.make) return null
  const { noun, make } = parsed

  if (noun === 'aircraft') {
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
