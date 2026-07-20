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

// ─── Aircraft-for-sale reverse-match ───────────────────────────────────────
// Powers the aircraft post-success "N subscribers with matching alerts will
// hear about this listing" line — the aircraft counterpart of the
// partnership reverse-match above (see BACKLOG.md's "N matching subscribers
// will be notified" item, aircraft follow-up slice).

/** Slug → filter value for `/aircraft/[slug]` alert source paths. Local
 *  duplicate of `SEO_MAKES`' slug+filter pairs (`seo.ts`) — see this file's
 *  header comment for why this can't be a direct import. An unlisted slug
 *  returns `null` (no guess). */
const AIRCRAFT_MAKE_SLUGS: Record<string, string> = {
  cessna: 'Cessna',
  piper: 'Piper',
  cirrus: 'Cirrus',
  beechcraft: 'Beechcraft',
  mooney: 'Mooney',
  diamond: 'Diamond',
  vans: "Van's",
  grumman: 'Grumman',
}

/** USPS code → full state name, and its reverse slug map, local duplicates of
 *  `STATE_NAMES`/`getStateBySlug` (`seo.ts`) for the same zero-import reason. */
const AIRCRAFT_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}
const slugify = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const AIRCRAFT_SLUG_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.keys(AIRCRAFT_STATE_NAMES).map((code) => [slugify(AIRCRAFT_STATE_NAMES[code]), code])
)

export interface AircraftSubscriberTarget {
  make?: string
  /** Exact single-value match — mirrors the digest cron's own `q.eq('model', …)`
   *  semantics for the bare `/aircraft?model=` shape (not a multi-select). */
  model?: string
  /** ilike prefix match, e.g. "172%" — used for `/aircraft/[make]/[model]` path
   *  pages. Simple `${modelSlug}%` fallback (same one the digest cron uses for
   *  uncurated combos); doesn't replicate the curated `notModelPattern`
   *  exclusions a handful of combos have — see this file's header/spec note. */
  modelPattern?: string
  state?: string
  icao?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  minTt?: number
  maxTt?: number
}

export type ParsedAircraftAlert =
  | { kind: 'all' }
  | { kind: 'aircraft'; target: AircraftSubscriberTarget }
  | null

/**
 * Parses an aircraft-relevant alert `source_path` into a match target, or
 * `null` when the path isn't a recognized aircraft/homepage shape
 * (partnership-only, seeker-only, single-listing watch, mission presets, or
 * unrecognized paths all return `null`). Recognizes the shapes `AlertSignup`
 * actually generates for aircraft: bare `/aircraft`,
 * `/aircraft?make=&model=&state=&airport=&min_price=&max_price=&min_year=&
 * max_year=&min_tt=&max_tt=`, `/aircraft/[makeSlug]`,
 * `/aircraft/[makeSlug]/[modelSlug]`, `/aircraft/for-sale/[stateSlug]`, and
 * the homepage `/` ("all" — matches every new listing site-wide, same as the
 * digest cron's own `'all'` target).
 *
 * NOT covered this slice (see spec's "Out of scope"): `q`/keyword, listing
 * `grades`, `avionics`, and `deal=good` on the bare `/aircraft?...` shape.
 */
export function parseAircraftAlertSourcePath(raw: string | null | undefined): ParsedAircraftAlert {
  const [pathOnly, qs] = (raw ?? '').split('?')
  const p = pathOnly.toLowerCase().replace(/\/$/, '') || '/'

  if (p === '/') return { kind: 'all' }

  if (p === '/aircraft') {
    if (!qs) return { kind: 'aircraft', target: {} }
    const params = new URLSearchParams(qs)
    const g = (k: string) => params.get(k)?.trim() || undefined
    return {
      kind: 'aircraft',
      target: {
        make: g('make'),
        model: g('model'),
        state: g('state')?.toUpperCase(),
        icao: g('airport')?.toUpperCase(),
        minPrice: numOrUndef(g('min_price')),
        maxPrice: numOrUndef(g('max_price')),
        minYear: numOrUndef(g('min_year')),
        maxYear: numOrUndef(g('max_year')),
        minTt: numOrUndef(g('min_tt')),
        maxTt: numOrUndef(g('max_tt')),
      },
    }
  }

  const forSaleState = p.match(/^\/aircraft\/for-sale\/(.+)$/)
  if (forSaleState) {
    const code = AIRCRAFT_SLUG_TO_STATE[forSaleState[1]]
    return code ? { kind: 'aircraft', target: { state: code } } : null
  }

  const makeModel = p.match(/^\/aircraft\/([^/]+)\/([^/]+)$/)
  if (makeModel) {
    const filter = AIRCRAFT_MAKE_SLUGS[makeModel[1]]
    if (!filter) return null
    return { kind: 'aircraft', target: { make: filter, modelPattern: `${makeModel[2]}%` } }
  }

  const makeOnly = p.match(/^\/aircraft\/([^/]+)$/)
  if (makeOnly) {
    const filter = AIRCRAFT_MAKE_SLUGS[makeOnly[1]]
    return filter ? { kind: 'aircraft', target: { make: filter } } : null
  }

  return null
}

export interface AircraftListingFields {
  make: string | null
  model: string | null
  state: string | null
  asking_price: number | null
  year: number | null
  ttaf: number | null
}

/**
 * Does this one aircraft-for-sale listing satisfy an alert's target filters
 * right now? Mirrors `applyAircraftFilters`' (`alert-digest/route.ts`) query
 * semantics for the fields this slice covers, evaluated against a single row
 * instead of a query — same null-column-excludes-the-row behavior a real
 * `.gte()`/`.lte()` on a null column has (Postgres NULL comparisons are never
 * true), so a listing missing a bounded field never matches a range filter
 * on it, exactly like the live digest query would.
 *
 * `airportState` is the caller-resolved `icao` → state lookup (one DB
 * round-trip via the `airports` table) — injected rather than looked up here
 * to keep this predicate itself synchronous and unit-testable, same pattern
 * as `matchesPartnershipListing`'s `icaoList` param above.
 */
export function matchesAircraftListing(
  target: AircraftSubscriberTarget,
  listing: AircraftListingFields,
  airportState?: string | null
): boolean {
  if (target.make && !(listing.make ?? '').toLowerCase().includes(target.make.toLowerCase())) return false

  if (target.model && listing.model !== target.model) return false

  if (target.modelPattern) {
    const prefix = target.modelPattern.replace(/%$/, '').toLowerCase()
    if (!(listing.model ?? '').toLowerCase().startsWith(prefix)) return false
  }

  if (target.state && listing.state !== target.state) return false
  if (target.icao && listing.state !== (airportState ?? undefined)) return false

  if (target.minPrice !== undefined && !(listing.asking_price !== null && listing.asking_price >= target.minPrice)) return false
  if (target.maxPrice !== undefined && !(listing.asking_price !== null && listing.asking_price <= target.maxPrice)) return false
  if (target.minYear !== undefined && !(listing.year !== null && listing.year >= target.minYear)) return false
  if (target.maxYear !== undefined && !(listing.year !== null && listing.year <= target.maxYear)) return false
  if (target.minTt !== undefined && !(listing.ttaf !== null && listing.ttaf >= target.minTt)) return false
  if (target.maxTt !== undefined && !(listing.ttaf !== null && listing.ttaf <= target.maxTt)) return false

  return true
}

// ─── Seeker reverse-match ───────────────────────────────────────────────────
// Powers the seeker post-success "N subscribers with matching alerts will hear
// about your search" line — the third leg of the trilogy alongside the
// partnership/aircraft reverse-matchers above (see BACKLOG.md's "complete the
// trilogy" item).

export interface SeekerSubscriberTarget {
  make?: string
  model?: string
  state?: string
  icao?: string
}

/**
 * Unlike `ParsedPartnershipAlert`/`ParsedAircraftAlert`, this type has NO
 * `'all'` variant. The real alert-digest cron's `countNew` treats a bare `/`
 * ("all") alert as aircraft ∪ partnerships ONLY — it never calls
 * `countNewSeekers` for an `'all'` target (`route.ts`) — so a homepage/footer
 * alert must never be counted as a match for a brand-new seeker listing.
 * `parseSeekerAlertSourcePath('/')` returns `null` on purpose to keep that
 * true here too.
 */
export type ParsedSeekerAlert = { kind: 'seeker'; target: SeekerSubscriberTarget } | null

/**
 * Parses a seeker-relevant alert `source_path` into a match target, or `null`
 * when the path isn't a recognized `/partnerships/seeking` shape (aircraft/
 * partnership paths, the homepage "all" shape, or unrecognized paths all
 * return `null`). Recognizes the shapes `AlertSignup` actually generates for
 * seekers: bare `/partnerships/seeking` and
 * `/partnerships/seeking?make=&model=&state=&airport=`.
 */
export function parseSeekerAlertSourcePath(raw: string | null | undefined): ParsedSeekerAlert {
  const [pathOnly, qs] = (raw ?? '').split('?')
  const p = pathOnly.toLowerCase().replace(/\/$/, '') || '/'

  if (p !== '/partnerships/seeking') return null
  if (!qs) return { kind: 'seeker', target: {} }

  const params = new URLSearchParams(qs)
  const g = (k: string) => params.get(k)?.trim() || undefined
  return {
    kind: 'seeker',
    target: {
      make: g('make'),
      model: g('model'),
      state: g('state')?.toUpperCase(),
      icao: g('airport')?.toUpperCase(),
    },
  }
}

export interface SeekerListingFields {
  preferred_makes: string[] | null
  preferred_models: string | null
  state: string | null
  home_airport: string | null
  additional_airports?: string[] | null
}

/** Local duplicate of `matchesModelFilter` (`seekerModelFilter.ts`) — see this
 *  file's header comment for why this can't be a direct import. Same
 *  case-insensitive, exact-token (not substring) semantics: does the
 *  listing's free-text `preferred_models` share ANY token with the (possibly
 *  comma-joined multi-select) wanted model string? */
function matchesSeekerModelFilter(preferredModels: string | null, wantedModel: string): boolean {
  const wanted = new Set(
    wantedModel
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  )
  if (!wanted.size) return true
  const tokens = (preferredModels ?? '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
  return tokens.some((m) => wanted.has(m))
}

/**
 * Does this one seeker listing satisfy an alert's target filters right now?
 * Mirrors the digest cron's `countNewSeekers` (`route.ts`) query semantics:
 * make = case-insensitive array membership (`.overlaps`), model = free-text
 * token match (same semantics as `matchesModelFilter`), state = exact, icao =
 * `home_airport` OR `additional_airports` array membership (no radius — the
 * cron's own seeker target has none either).
 */
export function matchesSeekerListing(target: SeekerSubscriberTarget, listing: SeekerListingFields): boolean {
  if (target.make) {
    const wanted = target.make.toLowerCase()
    if (!(listing.preferred_makes ?? []).some((m) => m.toLowerCase() === wanted)) return false
  }

  if (target.model && !matchesSeekerModelFilter(listing.preferred_models, target.model)) return false

  if (target.state && listing.state !== target.state) return false

  if (target.icao) {
    const matchesHome = listing.home_airport === target.icao
    const matchesAdditional = (listing.additional_airports ?? []).includes(target.icao)
    if (!matchesHome && !matchesAdditional) return false
  }

  return true
}
