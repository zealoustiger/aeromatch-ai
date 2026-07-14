/**
 * Buckets a source_path into a human-readable page family. Coarser than a true
 * per-widget placement (the `alerts` table has no `source` column — see
 * src/components/AlertSignup.tsx's `source` prop, which is PostHog-only today),
 * but real, DB-backed, and honest about what it is. Kept as a standalone pure
 * module (no DB import) so it stays unit-testable, same precedent as
 * alertFrequency.ts / alertEditCriteria.ts.
 */
export function classifySourcePath(sourcePath: string | null | undefined): string {
  if (!sourcePath) return 'Unknown / no context'
  const path = sourcePath.split('?')[0].replace(/\/+$/, '') || '/'
  const segments = path.split('/').filter(Boolean)

  if (path === '/') return 'Homepage'
  if (segments[0] === 'saved') return 'Saved listings page'
  if (segments[0] === 'guides') return 'Guide pages'
  if (segments[0] === 'tools') return 'Tools pages'
  if (segments[0] === 'airports') return 'Airport pages'
  if (segments[0] === 'compare') return 'Compare tray'

  if (segments[0] === 'aircraft') {
    const rest = segments.slice(1)
    if (rest[0] === 'listing') return 'Aircraft listing pages'
    if (rest[0] === 'mission') return 'Mission pages'
    if (rest[0] === 'compare') return 'Aircraft compare pages'
    if (rest[0] === 'for-sale') return 'State for-sale pages'
    if (rest[0] === 'deals') return 'Deals page'
    if (rest.length === 0) return 'Aircraft browse/filter'
    if (rest.length === 1) return 'Make pages'
    if (rest.length === 2) return 'Make+model pages'
    return 'Make+model+state pages'
  }

  if (segments[0] === 'partnerships') {
    const rest = segments.slice(1)
    if (rest[0] === 'seeking') {
      return rest.length > 1 ? 'Seeking detail pages' : 'Seeking browse'
    }
    if (rest[0] === 'make') return 'Partnership make pages'
    if (rest[0] === 'state') return 'Partnership state pages'
    if (rest[0] === 'near') return 'Partnership near-airport pages'
    if (rest[0] === 'browse') return 'Partnership browse (legacy)'
    if (rest.length === 0) return 'Partnership browse/filter'
    return 'Partnership listing pages'
  }

  return 'Other'
}
