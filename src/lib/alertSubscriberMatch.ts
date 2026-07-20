/**
 * "Which confirmed alerts would this brand-new listing satisfy" — the reverse
 * of the digest cron's own per-alert match (which asks "which listings match
 * THIS alert"). Powers the partnership post-success "N subscribers with
 * matching alerts will hear about this listing" line (see BACKLOG.md).
 *
 * Deliberately a zero-runtime-import pure module — same precedent as
 * `alertDemandFamily.ts`'s header comment: importing `seo.ts` (for
 * `getMakeBySlug`) or `partnershipModelFilter.ts` here would make this file
 * unloadable by the plain Node test runner (`node --experimental-strip-types`
 * has no extensionless relative-import resolution, unlike webpack/tsc), so
 * the curated make-slug table and the model multi-select split are kept as
 * small local duplicates instead of imports. The async DB-touching wrapper
 * that actually counts against real `alerts` rows lives in
 * `alertMatchCounts.ts` (already the untested, I/O-heavy home for this kind
 * of match query) and imports this module normally.
 */

/** Slug → filter value for `/partnerships/make/[slug]` alert source paths.
 *  Local duplicate of `SEO_MAKES`' slug+filter pairs (`seo.ts`) — see header
 *  comment for why this can't be a direct import. Every curated partnership
 *  make hub page is listed here; an unlisted slug returns `null` (no guess). */
const PARTNERSHIP_MAKE_SLUGS: Record<string, string> = {
  cessna: 'Cessna',
  piper: 'Piper',
  cirrus: 'Cirrus',
  beechcraft: 'Beechcraft',
  mooney: 'Mooney',
  diamond: 'Diamond',
  vans: "Van's",
  grumman: 'Grumman',
}

export interface PartnershipSubscriberTarget {
  make?: string
  model?: string
  state?: string
  icao?: string
  radius?: number
}

export type ParsedPartnershipAlert =
  | { kind: 'all' }
  | { kind: 'partnership'; target: PartnershipSubscriberTarget }
  | null

const numOrUndef = (v: string | undefined): number | undefined => {
  if (!v) return undefined
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Parses a partnership-relevant alert `source_path` into a match target, or
 * `null` when the path isn't a recognized partnership/homepage shape
 * (aircraft-only, seeker-only, or unrecognized paths all return `null`).
 * Recognizes the same shapes `AlertSignup` actually generates for
 * partnerships: bare `/partnerships`, `/partnerships?make=&model=&state=&airport=&radius=`,
 * `/partnerships/near/[icao]`, `/partnerships/make/[slug]`,
 * `/partnerships/state/[xx]`, and the homepage `/` ("all" — matches every new
 * listing site-wide, same as the digest cron's own `'all'` target).
 */
export function parsePartnershipAlertSourcePath(raw: string | null | undefined): ParsedPartnershipAlert {
  const [pathOnly, qs] = (raw ?? '').split('?')
  const p = pathOnly.toLowerCase().replace(/\/$/, '') || '/'

  if (p === '/') return { kind: 'all' }

  if (p === '/partnerships') {
    if (!qs) return { kind: 'partnership', target: {} }
    const params = new URLSearchParams(qs)
    const g = (k: string) => params.get(k)?.trim() || undefined
    return {
      kind: 'partnership',
      target: {
        make: g('make'),
        model: g('model'),
        state: g('state')?.toUpperCase(),
        icao: g('airport')?.toUpperCase(),
        radius: numOrUndef(g('radius')),
      },
    }
  }

  const nearIcao = p.match(/^\/partnerships\/near\/([a-z0-9]{3,4})$/)
  if (nearIcao) return { kind: 'partnership', target: { icao: nearIcao[1].toUpperCase() } }

  const pMake = p.match(/^\/partnerships\/make\/([^/]+)$/)
  if (pMake) {
    const filter = PARTNERSHIP_MAKE_SLUGS[pMake[1]]
    return filter ? { kind: 'partnership', target: { make: filter } } : null
  }

  // State slugs are always the plain lowercase 2-letter code (e.g. "ca") — no
  // curated name table needed, unlike make slugs.
  const pState = p.match(/^\/partnerships\/state\/([a-z]{2})$/)
  if (pState) return { kind: 'partnership', target: { state: pState[1].toUpperCase() } }

  return null
}

export interface PartnershipListingFields {
  make: string | null
  model: string | null
  state: string | null
  home_airport: string | null
}

/**
 * Does this one partnership satisfy an alert's target filters right now?
 * Mirrors the digest cron / `alertMatchCounts.ts`'s query semantics for the
 * same fields (make: case-insensitive substring; model: exact-match
 * comma-joined multi-select, same shape `applyPartnershipModelFilter` applies
 * to a query; state: exact; airport: within the resolved ICAO list) but
 * evaluated against a single row instead of a query.
 *
 * `icaoList` is the caller-resolved radius expansion (or `[target.icao]` when
 * there's no radius) — resolving it requires a DB round-trip
 * (`getAirportsWithinRadius`), so it's injected rather than looked up here to
 * keep this predicate itself synchronous and unit-testable.
 */
export function matchesPartnershipListing(
  target: PartnershipSubscriberTarget,
  listing: PartnershipListingFields,
  icaoList?: string[]
): boolean {
  if (target.make && !(listing.make ?? '').toLowerCase().includes(target.make.toLowerCase())) return false

  const wantedModels = target.model
    ? target.model
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
    : []
  if (wantedModels.length > 0 && !(listing.model && wantedModels.includes(listing.model))) return false

  if (target.state && listing.state !== target.state) return false

  if (target.icao) {
    if (!listing.home_airport) return false
    const list = icaoList ?? [target.icao]
    if (!list.includes(listing.home_airport)) return false
  }

  return true
}
