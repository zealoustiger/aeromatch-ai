/**
 * "Which confirmed alerts would this brand-new listing satisfy" — the reverse
 * of the digest cron's own per-alert match (which asks "which listings match
 * THIS alert"). Powers the partnership post-success "N subscribers with
 * matching alerts will hear about this listing" line (see BACKLOG.md).
 *
 * Deliberately a zero-runtime-import pure module — same precedent as
 * `alertDemandFamily.ts`'s header comment: importing `seo.ts` (for
 * `getMakeBySlug`), `partnershipModelFilter.ts`, or `avionicsClassify.ts`/
 * `listingQuality.ts` here would make this file unloadable by the plain Node
 * test runner (`node --experimental-strip-types` has NO extensionless
 * relative-import resolution at all, even a `.ts`-suffixed relative import
 * fails tsc's build with "can only end with a '.ts' extension when
 * allowImportingTsExtensions is enabled" — verified both ways), so the
 * curated make-slug table, the model multi-select split, and the grade bands
 * are all kept as small local duplicates instead of imports. Avionics
 * category matching (`avionicsMatch`, from `avionicsClassify.ts`) can't be
 * cheaply duplicated the same way (a real pattern-table classifier, not a
 * one-line helper), so `matchesAircraftListing` below takes the caller's
 * already-computed verdict as an injected param instead — same precedent as
 * `airportState`/`isGoodDeal`. The async DB-touching wrapper that actually
 * counts against real `alerts` rows lives in `alertMatchCounts.ts` (already
 * the untested, I/O-heavy home for this kind of match query) and imports
 * `avionicsClassify.ts` normally.
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

/** Local duplicate of `listingQuality.ts`'s grade cutoffs/bands + `parseGradeFilter`
 *  (see this file's header comment for why it can't be a direct import). NOT
 *  clipped to the site-wide `LISTING_GRADE_FLOOR` env floor the real digest
 *  query applies — that only ever *raises* a band's lower bound, so on a
 *  non-default floor this reverse-match can be marginally more permissive
 *  than the real cron. Undocumented/rare (`LISTING_GRADE_FLOOR` isn't set in
 *  any deployed env today); flagged here rather than silently assumed away. */
type AircraftGrade = 'A' | 'B' | 'C'
const AIRCRAFT_GRADE_CUTOFFS: Record<'A' | 'B', number> = { A: 78, B: 50 }
const AIRCRAFT_GRADE_BANDS: Record<AircraftGrade, { lo: number; hi: number | null }> = {
  A: { lo: AIRCRAFT_GRADE_CUTOFFS.A, hi: null },
  B: { lo: AIRCRAFT_GRADE_CUTOFFS.B, hi: AIRCRAFT_GRADE_CUTOFFS.A },
  C: { lo: 0, hi: AIRCRAFT_GRADE_CUTOFFS.B },
}

function parseAircraftGradeFilter(grade: string | undefined, minGrade: string | undefined): AircraftGrade[] {
  const all: AircraftGrade[] = ['A', 'B', 'C']
  const raw = (grade ?? '')
    .split(',')
    .map((g) => g.trim().toUpperCase())
    .filter((g): g is AircraftGrade => all.includes(g as AircraftGrade))
  if (raw.length) return all.filter((g) => raw.includes(g))
  if (minGrade === 'A') return ['A']
  if (minGrade === 'B') return ['A', 'B']
  return []
}

/** Does this quality_score fall in ANY of the selected grade bands? An empty
 *  or all-three selection means "no grade restriction" (mirrors `gradeQueryPlan`'s
 *  `{ floor }` no-op case). A null score never matches a real restriction —
 *  same never-fabricate-a-match convention as the numeric range filters below. */
function matchesGradeBands(qualityScore: number | null | undefined, grades: AircraftGrade[]): boolean {
  if (grades.length === 0 || grades.length === 3) return true
  if (qualityScore == null) return false
  return grades.some((g) => {
    const { lo, hi } = AIRCRAFT_GRADE_BANDS[g]
    return qualityScore >= lo && (hi == null || qualityScore < hi)
  })
}

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
  /** Free-text browse search (`q`) — matched the same way the digest cron's
   *  `.or(title.ilike,description.ilike)` does. Only ever set from the bare
   *  `/aircraft?...` shape, same as the cron. */
  keyword?: string
  /** Listing-quality multi-select, already resolved from `grade`/`min_grade`
   *  via the local `parseAircraftGradeFilter` above. Only ever set from the
   *  bare `/aircraft?...` shape, same as the cron. */
  grades?: AircraftGrade[]
  /** "Only email me good deals" (`deal=good`) — can ride on ANY aircraft
   *  source_path shape, not just the bare one (mirrors the cron's own
   *  post-`resolveTarget` patch). Evaluating it needs a real DB comp query
   *  (`filterToGoodDeals`), so `matchesAircraftListing` below takes the
   *  verdict as an injected param rather than computing it itself — same
   *  synchronous-predicate precedent as `icao`/`airportState`. */
  dealOnly?: boolean
  /** Avionics capability categories (glass/adsb/autopilot/waas/gps) — parsed
   *  from the same comma-joined `avionics` param the browse page's filter
   *  uses. Only ever set from the bare `/aircraft?...` shape, same as the cron. */
  avionics?: string[]
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
 * `deal=good` is honored on EVERY recognized aircraft shape (not just the
 * bare one) — mirrors the digest cron's own post-`resolveTarget` patch, since
 * `AlertSignup` on a make/model SEO page can also carry a checked "only good
 * deals" box. `q`/`grade`/`min_grade`/`avionics` are only parsed off the bare
 * `/aircraft?...` shape, same as the cron.
 */
export function parseAircraftAlertSourcePath(raw: string | null | undefined): ParsedAircraftAlert {
  const [pathOnly, qs] = (raw ?? '').split('?')
  const p = pathOnly.toLowerCase().replace(/\/$/, '') || '/'

  const withDealOverride = (parsed: ParsedAircraftAlert): ParsedAircraftAlert => {
    if (!parsed || parsed.kind !== 'aircraft' || !qs || parsed.target.dealOnly) return parsed
    const params = new URLSearchParams(qs)
    if (params.get('deal') === 'good') parsed.target.dealOnly = true
    return parsed
  }

  if (p === '/') return { kind: 'all' }

  if (p === '/aircraft') {
    if (!qs) return { kind: 'aircraft', target: {} }
    const params = new URLSearchParams(qs)
    const g = (k: string) => params.get(k)?.trim() || undefined
    // Inline duplicate of `avionicsClassify.ts`'s one-line `parseAvionicsFilter`
    // — see header comment for why that file can't be imported here.
    const avionics = (g('avionics') ?? '').split(',').map((c) => c.trim()).filter(Boolean)
    return withDealOverride({
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
        keyword: g('q'),
        grades: parseAircraftGradeFilter(g('grade'), g('min_grade')),
        dealOnly: g('deal') === 'good',
        avionics: avionics.length > 0 ? avionics : undefined,
      },
    })
  }

  const forSaleState = p.match(/^\/aircraft\/for-sale\/(.+)$/)
  if (forSaleState) {
    const code = AIRCRAFT_SLUG_TO_STATE[forSaleState[1]]
    return code ? withDealOverride({ kind: 'aircraft', target: { state: code } }) : null
  }

  const makeModel = p.match(/^\/aircraft\/([^/]+)\/([^/]+)$/)
  if (makeModel) {
    const filter = AIRCRAFT_MAKE_SLUGS[makeModel[1]]
    if (!filter) return null
    return withDealOverride({ kind: 'aircraft', target: { make: filter, modelPattern: `${makeModel[2]}%` } })
  }

  const makeOnly = p.match(/^\/aircraft\/([^/]+)$/)
  if (makeOnly) {
    const filter = AIRCRAFT_MAKE_SLUGS[makeOnly[1]]
    return filter ? withDealOverride({ kind: 'aircraft', target: { make: filter } }) : null
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
  /** Optional — only needed when the caller wants `keyword`/`grades`/`avionics`/
   *  `dealOnly` honored rather than ignored. Absent/undefined is treated as
   *  null. `id`/`smoh` are only used by the async `filterToGoodDeals` comp
   *  query a `dealOnly` target needs (`alertMatchCounts.ts`), never by the
   *  synchronous predicate below. */
  title?: string | null
  description?: string | null
  quality_score?: number | null
  avionics?: string[] | null
  id?: string
  smoh?: number | null
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
 *
 * `isGoodDeal` is the caller-resolved `deal=good` verdict (a real
 * `filterToGoodDeals` comp query — same DB-round-trip reason `airportState`
 * is injected rather than computed here). Only consulted when
 * `target.dealOnly` is set; `undefined`/`false` both fail a dealOnly target
 * closed — never count a subscriber the digest wouldn't actually email
 * (GOAL.md's honesty gate), so an alert isn't credited before the verdict is
 * actually known.
 *
 * `avionicsOk` is the caller-resolved `avionicsMatch(listing.avionics,
 * target.avionics)` verdict (this file can't import the real classifier —
 * see header comment) — only consulted when `target.avionics` is set;
 * `undefined`/`false` both fail an avionics-filtered target closed, same
 * never-count-before-known convention as `isGoodDeal`.
 */
export function matchesAircraftListing(
  target: AircraftSubscriberTarget,
  listing: AircraftListingFields,
  airportState?: string | null,
  isGoodDeal?: boolean,
  avionicsOk?: boolean
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

  if (target.keyword) {
    const needle = target.keyword.trim().toLowerCase()
    if (needle) {
      const haystack = `${listing.title ?? ''} ${listing.description ?? ''}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }
  }

  if (target.grades && !matchesGradeBands(listing.quality_score, target.grades)) return false

  if (target.avionics && target.avionics.length > 0 && !avionicsOk) return false

  if (target.dealOnly && !isGoodDeal) return false

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
  /** Multi-airport list (comma-joined ICAO codes on the source query string),
   *  OR'd against `home_airport`/`additional_airports` — mirrors the digest
   *  cron's own `icaos` field (`route.ts`). A lone code + `radius` expands via
   *  the caller-resolved `icaoList` param `matchesSeekerListing` takes below
   *  (radius across several centers is ambiguous, so it's ignored once
   *  there's more than one code — same restriction the browse page's own
   *  `seekersQuery.ts` enforces). */
  icaos?: string[]
  radius?: number
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
 * `/partnerships/seeking?make=&model=&state=&airports=` (or the legacy
 * single `airport=`).
 */
export function parseSeekerAlertSourcePath(raw: string | null | undefined): ParsedSeekerAlert {
  const [pathOnly, qs] = (raw ?? '').split('?')
  const p = pathOnly.toLowerCase().replace(/\/$/, '') || '/'

  if (p !== '/partnerships/seeking') return null
  if (!qs) return { kind: 'seeker', target: {} }

  const params = new URLSearchParams(qs)
  const g = (k: string) => params.get(k)?.trim() || undefined
  const airportsRaw = g('airports') ?? g('airport')
  const icaos = airportsRaw
    ? [...new Set(airportsRaw.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean))]
    : undefined
  const radiusRaw = g('radius')
  const radius = radiusRaw ? parseInt(radiusRaw, 10) : undefined
  return {
    kind: 'seeker',
    target: {
      make: g('make'),
      model: g('model'),
      state: g('state')?.toUpperCase(),
      icaos,
      radius: radius !== undefined && Number.isFinite(radius) ? radius : undefined,
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
 * token match (same semantics as `matchesModelFilter`), state = exact,
 * icaos = `home_airport` OR `additional_airports` membership in the resolved
 * ICAO list.
 *
 * `icaoList` is the caller-resolved radius expansion (or `target.icaos` when
 * there's no radius / more than one code) — resolving it requires a DB
 * round-trip (`getAirportsWithinRadius`), so it's injected rather than looked
 * up here, same `icaoList` precedent as `matchesPartnershipListing` above.
 */
export function matchesSeekerListing(
  target: SeekerSubscriberTarget,
  listing: SeekerListingFields,
  icaoList?: string[]
): boolean {
  if (target.make) {
    const wanted = target.make.toLowerCase()
    if (!(listing.preferred_makes ?? []).some((m) => m.toLowerCase() === wanted)) return false
  }

  if (target.model && !matchesSeekerModelFilter(listing.preferred_models, target.model)) return false

  if (target.state && listing.state !== target.state) return false

  if (target.icaos && target.icaos.length > 0) {
    const list = icaoList ?? target.icaos
    const matchesHome = listing.home_airport ? list.includes(listing.home_airport) : false
    const matchesAdditional = (listing.additional_airports ?? []).some((a) => list.includes(a))
    if (!matchesHome && !matchesAdditional) return false
  }

  return true
}
