import { createAdminClient } from './supabase-admin'
import { getStateBySlug, getMakeBySlug, getMakeModel, SITE_URL } from './seo'
import { matchesModelFilter } from './seekerModelFilter'
import { parseGradeFilter, gradeQueryPlan, type Grade } from './listingQuality'
import { parseAvionicsFilter, fetchAvionicsMatchIds } from './avionicsClassify'
import { applyPartnershipModelFilter } from './partnershipModelFilter'
import { getAirportsWithinRadius } from './airports'
import { pickRealPhoto, getPlaceholderPhoto } from './aircraftPhotos'
import { formatShareType, formatPriceK } from './utils'
import { parseEditableAlertTarget, computeWidenCandidate, buildAlertCriteriaUpdate } from './alertEditCriteria'
import { priceStats } from './aircraftComps'
import type { AlertDigestSample } from './email'

/**
 * "How many listings match this alert right now" for `/alerts/manage`.
 *
 * Deliberately a separate parser from alert-digest's `parseSourcePath`
 * (`src/app/api/cron/alert-digest/route.ts`) rather than an import from it —
 * same precedent as `alertEditCriteria.ts` (see its header comment): the cron
 * route is a live production send path with no test harness, so it's left
 * untouched this cycle. The shapes handled below mirror the cron's parser
 * shape-for-shape so a count here stays honest with what the digest would
 * actually match. If the two ever need to share more logic, extracting a
 * common module is a follow-up, not this slice.
 */

type AlertTarget =
  | {
      type: 'aircraft'
      make?: string
      model?: string
      modelPattern?: string
      notModelPattern?: string
      /** Smart-search family match (e.g. "sr22" → ilike "sr22%"), same param
       *  `/aircraft`'s `filters.model_like` applies. Distinct from `modelPattern`
       *  (curated SEO route matches), which already gets the `.ilike` treatment. */
      modelLike?: string
      state?: string
      /** ICAO airport code — narrowed to that airport's STATE, same coarse
       *  resolution `fetchAircraftPage`'s `filters.airport` uses (aircraft has no
       *  lat/lng radius helper the way partnerships' `resolveIcaoList` provides). */
      icao?: string
      minPrice?: number
      maxPrice?: number
      minYear?: number
      maxYear?: number
      minTt?: number
      maxTt?: number
      /** Free-text browse search (`q`) — matched the same way `fetchAircraftPage`
       *  does, `.or(title.ilike,description.ilike)`. */
      keyword?: string
      /** Listing-quality multi-select, already resolved from `grade`/`min_grade`
       *  via `parseGradeFilter` — same semantics as the browse page's filter. */
      grades?: Grade[]
      /** Avionics capability categories (glass/adsb/autopilot/waas/gps), parsed
       *  from the same comma-joined `avionics` param the browse page's filter
       *  uses. Matched via the shared `fetchAvionicsMatchIds` id-narrowing scan
       *  (see `avionicsClassify.ts`) since it's a `text[]` column with no cheap
       *  column filter. */
      avionics?: string[]
    }
  | {
      type: 'partnership'
      make?: string
      /** Comma-joined multi-select, same exact-match OR semantics
       *  `/partnerships`'s own `model` filter uses (`partnershipsQuery.ts`) —
       *  `partnerships.model` is a plain column, no classify pass needed. */
      model?: string
      state?: string
      icao?: string
      radius?: number
    }
  | { type: 'seeker'; make?: string; model?: string; state?: string; icao?: string }

const numOrUndef = (v: string | undefined): number | undefined => {
  if (!v) return undefined
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

function parseSourcePath(raw: string | null): AlertTarget | null {
  const [pathOnly, qs] = (raw ?? '').split('?')
  const p = pathOnly.toLowerCase().replace(/\/$/, '') || '/'

  if (qs && (p === '/aircraft' || p === '/partnerships' || p === '/partnerships/seeking')) {
    const params = new URLSearchParams(qs)
    const g = (k: string) => params.get(k)?.trim() || undefined
    if (p === '/aircraft') {
      return {
        type: 'aircraft',
        make: g('make'),
        model: g('model'),
        modelLike: g('model_like'),
        state: g('state')?.toUpperCase(),
        icao: g('airport')?.toUpperCase(),
        minPrice: numOrUndef(g('min_price')),
        maxPrice: numOrUndef(g('max_price')),
        minYear: numOrUndef(g('min_year')),
        maxYear: numOrUndef(g('max_year')),
        minTt: numOrUndef(g('min_tt')),
        maxTt: numOrUndef(g('max_tt')),
        keyword: g('q'),
        grades: parseGradeFilter(g('grade'), g('min_grade')),
        avionics: (() => {
          const cats = parseAvionicsFilter(g('avionics'))
          return cats.length > 0 ? cats : undefined
        })(),
      }
    }
    if (p === '/partnerships/seeking') {
      return {
        type: 'seeker',
        make: g('make'),
        model: g('model'),
        state: g('state')?.toUpperCase(),
        icao: g('airport')?.toUpperCase(),
      }
    }
    return {
      type: 'partnership',
      make: g('make'),
      model: g('model'),
      state: g('state')?.toUpperCase(),
      icao: g('airport')?.toUpperCase(),
      radius: numOrUndef(g('radius')),
    }
  }

  // ── Aircraft paths ────────────────────────────────────────────────────────

  const forSaleState = p.match(/^\/aircraft\/for-sale\/(.+)$/)
  if (forSaleState) {
    const entry = getStateBySlug(forSaleState[1])
    return entry ? { type: 'aircraft', state: entry.code } : null
  }

  // /aircraft/mission/... → complex preset, skip
  if (p.startsWith('/aircraft/mission/')) return null

  const makeModelState = p.match(/^\/aircraft\/([^/]+)\/([^/]+)\/([a-z]{2})$/)
  if (makeModelState) {
    const [, makeSlug, modelSlug, stateCode] = makeModelState
    const target = resolveAircraftMakeModel(makeSlug, modelSlug)
    if (!target) return null
    return { ...target, state: stateCode.toUpperCase() }
  }

  const makeModel = p.match(/^\/aircraft\/([^/]+)\/([^/]+)$/)
  if (makeModel) {
    return resolveAircraftMakeModel(makeModel[1], makeModel[2])
  }

  const makeOnly = p.match(/^\/aircraft\/([^/]+)$/)
  if (makeOnly) {
    const makeEntry = getMakeBySlug(makeOnly[1])
    if (!makeEntry) return null
    return { type: 'aircraft', make: makeEntry.filter }
  }

  if (p === '/aircraft') return { type: 'aircraft' }

  // ── Partnership paths ─────────────────────────────────────────────────────

  const nearIcao = p.match(/^\/partnerships\/near\/([a-z0-9]{3,4})$/)
  if (nearIcao) return { type: 'partnership', icao: nearIcao[1].toUpperCase() }

  const pMake = p.match(/^\/partnerships\/make\/([^/]+)$/)
  if (pMake) {
    const makeEntry = getMakeBySlug(pMake[1])
    if (!makeEntry) return null
    return { type: 'partnership', make: makeEntry.filter }
  }

  const pState = p.match(/^\/partnerships\/state\/([a-z]{2})$/)
  if (pState) return { type: 'partnership', state: pState[1].toUpperCase() }

  if (p === '/partnerships/seeking') return { type: 'seeker' }

  if (p === '/partnerships') return { type: 'partnership' }

  return null
}

/** Resolve a make+model slug pair to an aircraft AlertTarget, or null if unknown. */
function resolveAircraftMakeModel(
  makeSlug: string,
  modelSlug: string
): Extract<AlertTarget, { type: 'aircraft' }> | null {
  const makeEntry = getMakeBySlug(makeSlug)
  if (!makeEntry) return null

  const seoEntry = getMakeModel(makeSlug, modelSlug)
  if (seoEntry) {
    return {
      type: 'aircraft',
      make: seoEntry.make,
      modelPattern: seoEntry.modelPattern,
      notModelPattern: seoEntry.notModelPattern,
    }
  }

  return {
    type: 'aircraft',
    make: makeEntry.filter,
    modelPattern: `${modelSlug}%`,
  }
}

// Same floor the digest cron applies (sub-$50k listings are parts/project
// aircraft, not real inventory a buyer alert should count as a "match").
const PARTS_PRICE_FLOOR = 50_000

/** Resolve an aircraft alert's `icao` airport filter to that airport's STATE —
 *  same coarse resolution `fetchAircraftPage`'s `filters.airport` uses (no
 *  lat/lng radius helper exists for aircraft the way `getAirportsWithinRadius`
 *  provides for partnerships). Returns null when the code isn't in our
 *  `airports` table (no-op, matching the browse page's own graceful fallback). */
async function resolveAircraftAirportState(
  supabase: ReturnType<typeof createAdminClient>,
  icao: string
): Promise<string | null> {
  const { data } = await supabase.from('airports').select('state').eq('icao', icao).maybeSingle()
  return data?.state ?? null
}

async function countActiveAircraft(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  excludeId?: string,
  since?: string
): Promise<number> {
  let q = supabase
    .from('aircraft_for_sale')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)

  if (since) q = q.gte('first_seen_at', since)
  if (target.make) q = q.ilike('make', `%${target.make}%`)
  if (target.model) q = q.eq('model', target.model)
  if (target.modelPattern) q = q.ilike('model', target.modelPattern)
  if (target.notModelPattern) q = q.not('model', 'ilike', target.notModelPattern)
  if (target.modelLike) q = q.ilike('model', `${target.modelLike.replace(/[%,]/g, '')}%`)
  if (target.state) q = q.eq('state', target.state)
  if (target.icao) {
    const airportState = await resolveAircraftAirportState(supabase, target.icao)
    if (airportState) q = q.eq('state', airportState)
  }
  if (target.minPrice !== undefined) q = q.gte('asking_price', target.minPrice)
  if (target.maxPrice !== undefined) q = q.lte('asking_price', target.maxPrice)
  if (target.minYear !== undefined) q = q.gte('year', target.minYear)
  if (target.maxYear !== undefined) q = q.lte('year', target.maxYear)
  if (target.minTt !== undefined) q = q.gte('ttaf', target.minTt)
  if (target.maxTt !== undefined) q = q.lte('ttaf', target.maxTt)
  if (target.keyword) {
    const term = target.keyword.replace(/[%,()]/g, ' ').trim()
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  }
  const gradePlan = gradeQueryPlan(target.grades ?? [])
  if ('or' in gradePlan) q = q.or(gradePlan.or)
  else if ('impossible' in gradePlan) q = q.gt('quality_score', 100)
  else if (gradePlan.floor > 0) q = q.gte('quality_score', gradePlan.floor)
  if (excludeId) q = q.neq('id', excludeId)
  if (target.avionics && target.avionics.length > 0) {
    const ids = await fetchAvionicsMatchIds(supabase, target.avionics, PARTS_PRICE_FLOOR)
    if (ids.length === 0) return 0
    q = q.in('id', ids)
  }

  const { count, error } = await q
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Resolve a partnership target's airport filter to the ICAO list a query
 * should match: the radius-expanded set (reusing the same haversine helper
 * `/partnerships?airport=…&radius=…` search results use) when `radius` is
 * set, or just the single ICAO otherwise. `undefined` means no airport filter.
 */
async function resolveIcaoList(
  target: Extract<AlertTarget, { type: 'partnership' }>
): Promise<string[] | undefined> {
  if (!target.icao) return undefined
  if (target.radius && target.radius > 0) return getAirportsWithinRadius(target.icao, target.radius)
  return [target.icao]
}

async function countActivePartnerships(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'partnership' }>,
  excludeId?: string,
  since?: string
): Promise<number> {
  let q = supabase.from('partnerships').select('id', { count: 'exact', head: true }).eq('status', 'active')

  if (since) q = q.gte('created_at', since)
  if (target.make) q = q.ilike('make', `%${target.make}%`)
  q = applyPartnershipModelFilter(q, target.model)
  if (target.state) q = q.eq('state', target.state)
  const icaoList = await resolveIcaoList(target)
  if (icaoList) q = q.in('home_airport', icaoList)
  if (excludeId) q = q.neq('id', excludeId)

  const { count, error } = await q
  if (error) throw new Error(error.message)
  return count ?? 0
}

async function countActiveSeekers(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'seeker' }>,
  since?: string
): Promise<number> {
  let q = supabase.from('partnership_seekers').select('id, preferred_models').eq('status', 'active')

  if (since) q = q.gte('created_at', since)
  if (target.make) q = q.overlaps('preferred_makes', [target.make])
  if (target.state) q = q.eq('state', target.state)
  // Single ICAO, no radius — matches home_airport OR additional_airports, same OR
  // semantics as the digest cron's countNewSeekers / seekersQuery.ts's getSeekers().
  // additional_airports may not be migrated live yet; retry home_airport-only on
  // that specific column error, same graceful-degrade precedent used elsewhere.
  if (target.icao) q = q.or(`home_airport.eq.${target.icao},additional_airports.ov.{${target.icao}}`)

  let { data, error } = await q
  if (target.icao && error?.message?.includes('additional_airports')) {
    let retry = supabase
      .from('partnership_seekers')
      .select('id, preferred_models')
      .eq('status', 'active')
      .eq('home_airport', target.icao)
    if (since) retry = retry.gte('created_at', since)
    if (target.make) retry = retry.overlaps('preferred_makes', [target.make])
    if (target.state) retry = retry.eq('state', target.state)
    ;({ data, error } = await retry)
  }

  if (error) throw new Error(error.message)
  const rows = data ?? []
  if (!target.model) return rows.length

  const wanted = target.model.split(',').map((m) => m.trim()).filter(Boolean)
  return rows.filter((r) => matchesModelFilter(r.preferred_models as string | null, wanted)).length
}

export interface AlertMatchCount {
  count: number
  /** What's being counted, so the caller can word the line correctly. */
  noun: 'listing' | 'pilot'
}

/**
 * Count active matches for one alert's `source_path` right now. Returns `null`
 * (never a fake `0`) when the path isn't a recognized shape, or on any query
 * error — callers should render no count line in that case.
 *
 * `excludeId` drops one listing id from an aircraft/partnership count — for a
 * family-wide count derived from a single watched listing (see
 * `alertCrossSell.ts`'s watch cross-sell), the watched listing would otherwise
 * always match its own family and inflate the count by one.
 *
 * `since` (ISO timestamp) narrows to matches CREATED on/after that time — used
 * for "N new since your last visit"-style honest deltas rather than "N active
 * right now" totals.
 */
export async function getAlertMatchCount(
  sourcePath: string | null,
  opts?: { excludeId?: string; since?: string }
): Promise<AlertMatchCount | null> {
  const target = parseSourcePath(sourcePath)
  if (!target) return null
  try {
    const admin = createAdminClient()
    if (target.type === 'aircraft') {
      return { count: await countActiveAircraft(admin, target, opts?.excludeId, opts?.since), noun: 'listing' }
    }
    if (target.type === 'seeker') {
      return { count: await countActiveSeekers(admin, target, opts?.since), noun: 'pilot' }
    }
    return {
      count: await countActivePartnerships(admin, target, opts?.excludeId, opts?.since),
      noun: 'listing',
    }
  } catch (err) {
    console.error('[alertMatchCounts] count error:', err instanceof Error ? err.message : err)
    return null
  }
}

/** Caps how many locally-subscribed source_paths one nav-pill check fans out to
 *  — bounds query cost regardless of how many capture points a long-time
 *  subscriber has hit (storage itself caps at 50, see alertLocalSubscriptions.ts). */
const MAX_NEW_SINCE_PATHS = 8

/**
 * Sum of NEW matches (created on/after `since`) across up to `MAX_NEW_SINCE_PATHS`
 * of this browser's locally-subscribed source_paths — powers the nav pill's
 * honest "My alerts · N new" badge. Fails soft per-path (an unrecognized shape or
 * query error just contributes 0, doesn't sink the whole sum); returns `null`
 * only when there's nothing to check at all, so the caller renders no badge
 * rather than a fake 0.
 */
export async function getNewMatchCountSince(sourcePaths: string[], since: string): Promise<number | null> {
  const paths = sourcePaths.filter(Boolean).slice(0, MAX_NEW_SINCE_PATHS)
  if (paths.length === 0 || !since) return null
  const results = await Promise.all(paths.map((p) => getAlertMatchCount(p, { since })))
  return results.reduce((sum, r) => sum + (r?.count ?? 0), 0)
}

export interface EmptyStateWidenSuggestion {
  /** The widened search's context/source_path — same shape `AlertSignup` already
   *  takes, so a click just swaps the box's active values, no second component. */
  context?: string
  sourcePath: string
  /** e.g. "Show all Cessna listings" / "Search every state" — from `computeWidenCandidate`. */
  description: string
  count: number
  noun: 'listing' | 'pilot'
}

/**
 * For a search that's showing a zero-match empty state RIGHT NOW, compute the
 * single least-destructive widened alternative (drop model → make-wide, else
 * drop location → nationwide — same one-step rule `/alerts/manage`'s post-
 * subscribe widen nudge uses) and re-verify it against a real live count
 * before ever offering it. Returns `null` — never a guess — when the source
 * path isn't an editable modern query-string shape, there's no further step to
 * widen, or the widened search is *also* genuinely empty.
 */
export async function getEmptyStateWidenSuggestion(
  sourcePath: string | null
): Promise<EmptyStateWidenSuggestion | null> {
  const target = parseEditableAlertTarget(sourcePath)
  if (!target) return null
  const candidate = computeWidenCandidate(target)
  if (!candidate) return null
  const { sourcePath: widenedPath, context } = buildAlertCriteriaUpdate(target.type, sourcePath, candidate.fields)
  const match = await getAlertMatchCount(widenedPath)
  if (!match || match.count <= 0) return null
  return {
    context: context ?? undefined,
    sourcePath: widenedPath,
    description: candidate.description,
    count: match.count,
    noun: match.noun,
  }
}

export interface AlertDigestPreview {
  count: number
  noun: 'listing' | 'pilot'
  samples: AlertDigestSample[]
}

type AircraftPreviewRow = {
  id: string
  make: string | null
  model: string | null
  year: number | null
  asking_price: number | null
  images: string[] | null
  location: string | null
  ttaf: number | null
}

async function previewAircraft(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  limit: number
): Promise<AlertDigestPreview> {
  let q = supabase
    .from('aircraft_for_sale')
    .select('id, make, model, year, asking_price, images, location, ttaf', { count: 'exact' })
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)

  if (target.make) q = q.ilike('make', `%${target.make}%`)
  if (target.model) q = q.eq('model', target.model)
  if (target.modelPattern) q = q.ilike('model', target.modelPattern)
  if (target.notModelPattern) q = q.not('model', 'ilike', target.notModelPattern)
  if (target.modelLike) q = q.ilike('model', `${target.modelLike.replace(/[%,]/g, '')}%`)
  if (target.state) q = q.eq('state', target.state)
  if (target.icao) {
    const airportState = await resolveAircraftAirportState(supabase, target.icao)
    if (airportState) q = q.eq('state', airportState)
  }
  if (target.minPrice !== undefined) q = q.gte('asking_price', target.minPrice)
  if (target.maxPrice !== undefined) q = q.lte('asking_price', target.maxPrice)
  if (target.minYear !== undefined) q = q.gte('year', target.minYear)
  if (target.maxYear !== undefined) q = q.lte('year', target.maxYear)
  if (target.minTt !== undefined) q = q.gte('ttaf', target.minTt)
  if (target.maxTt !== undefined) q = q.lte('ttaf', target.maxTt)
  if (target.keyword) {
    const term = target.keyword.replace(/[%,()]/g, ' ').trim()
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  }
  const gradePlan = gradeQueryPlan(target.grades ?? [])
  if ('or' in gradePlan) q = q.or(gradePlan.or)
  else if ('impossible' in gradePlan) q = q.gt('quality_score', 100)
  else if (gradePlan.floor > 0) q = q.gte('quality_score', gradePlan.floor)
  if (target.avionics && target.avionics.length > 0) {
    const ids = await fetchAvionicsMatchIds(supabase, target.avionics, PARTS_PRICE_FLOOR)
    if (ids.length === 0) return { count: 0, noun: 'listing', samples: [] }
    q = q.in('id', ids)
  }

  const { data, count, error } = await q.order('first_seen_at', { ascending: false }).limit(limit)
  if (error) throw new Error(error.message)
  const samples = ((data ?? []) as AircraftPreviewRow[]).map((row) => {
    const realPhoto = pickRealPhoto(row.images)
    return {
      title: [row.year, row.make, row.model].filter(Boolean).join(' ') || 'Aircraft',
      photoUrl: realPhoto ?? getPlaceholderPhoto(row.make ?? ''),
      isPlaceholder: !realPhoto,
      year: row.year,
      ttaf: row.ttaf,
      location: row.location,
      price: row.asking_price,
      url: `${SITE_URL}/aircraft/listing/${row.id}`,
    }
  })
  return { count: count ?? 0, noun: 'listing', samples }
}

type PartnershipPreviewRow = {
  id: string
  make: string | null
  model: string | null
  year: number | null
  buy_in_price: number | null
  share_type: string | null
  images: string[] | null
  home_airport: string | null
  city: string | null
  state: string | null
}

async function previewPartnerships(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'partnership' }>,
  limit: number
): Promise<AlertDigestPreview> {
  let q = supabase
    .from('partnerships')
    .select('id, make, model, year, buy_in_price, share_type, images, home_airport, city, state', {
      count: 'exact',
    })
    .eq('status', 'active')

  if (target.make) q = q.ilike('make', `%${target.make}%`)
  q = applyPartnershipModelFilter(q, target.model)
  if (target.state) q = q.eq('state', target.state)
  const icaoList = await resolveIcaoList(target)
  if (icaoList) q = q.in('home_airport', icaoList)

  const { data, count, error } = await q.order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(error.message)
  const samples = ((data ?? []) as PartnershipPreviewRow[]).map((row) => {
    const realPhoto = pickRealPhoto(row.images)
    return {
      title: [row.year, row.make, row.model].filter(Boolean).join(' ') || 'Partnership',
      photoUrl: realPhoto ?? getPlaceholderPhoto(row.make ?? ''),
      isPlaceholder: !realPhoto,
      year: row.year,
      ttaf: null,
      shareType: row.share_type ? formatShareType(row.share_type) : null,
      location: row.city && row.state ? `${row.city}, ${row.state}` : row.home_airport,
      price: row.buy_in_price,
      url: `${SITE_URL}/partnerships/${row.id}`,
    }
  })
  return { count: count ?? 0, noun: 'listing', samples }
}

type SeekerPreviewRow = {
  id: string
  title: string | null
  preferred_makes: string[] | null
  preferred_models: string | null
  home_airport: string | null
  city: string | null
  state: string | null
}

const SEEKER_PREVIEW_COLS = 'id, title, preferred_makes, preferred_models, home_airport, city, state, created_at'

async function previewSeekers(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'seeker' }>,
  limit: number
): Promise<AlertDigestPreview> {
  let q = supabase
    .from('partnership_seekers')
    .select(SEEKER_PREVIEW_COLS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (target.make) q = q.overlaps('preferred_makes', [target.make])
  if (target.state) q = q.eq('state', target.state)
  if (target.icao) q = q.or(`home_airport.eq.${target.icao},additional_airports.ov.{${target.icao}}`)

  let { data, error } = await q
  if (target.icao && error?.message?.includes('additional_airports')) {
    let retry = supabase
      .from('partnership_seekers')
      .select(SEEKER_PREVIEW_COLS)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .eq('home_airport', target.icao)
    if (target.make) retry = retry.overlaps('preferred_makes', [target.make])
    if (target.state) retry = retry.eq('state', target.state)
    ;({ data, error } = await retry)
  }
  if (error) throw new Error(error.message)

  let rows = (data ?? []) as SeekerPreviewRow[]
  if (target.model) {
    const wanted = target.model.split(',').map((m) => m.trim()).filter(Boolean)
    rows = rows.filter((r) => matchesModelFilter(r.preferred_models, wanted))
  }
  const samples = rows.slice(0, limit).map((row) => {
    const lookingFor =
      [row.preferred_makes?.length ? row.preferred_makes.join(', ') : null, row.preferred_models || null]
        .filter(Boolean)
        .join(' · ') || null
    return {
      title: row.title || 'Pilot seeking a partnership',
      photoUrl: null,
      isPlaceholder: false,
      year: null,
      ttaf: null,
      lookingFor,
      location: row.city && row.state ? `${row.city}, ${row.state}` : row.home_airport,
      price: null,
      url: `${SITE_URL}/partnerships/seeking/${row.id}`,
    }
  })
  return { count: rows.length, noun: 'pilot', samples }
}

/**
 * Up to `limit` real, currently-active matches for one alert's `source_path`,
 * shaped as `AlertDigestSample`s for `buildAlertDigestEmail` — plus the same
 * live count `getAlertMatchCount` returns. Used by the owner-scoped "Send me
 * a sample digest" action: unlike the real digest cron (which only counts
 * genuinely *new* matches since the subscriber's last send), this shows
 * what's matching right now as an honest stand-in, since a one-off sample has
 * no "since last digest" window to compare against. Returns `null` on an
 * unrecognized path or query error — same honesty floor as `getAlertMatchCount`.
 */
export async function getAlertDigestPreview(sourcePath: string | null, limit = 3): Promise<AlertDigestPreview | null> {
  const target = parseSourcePath(sourcePath)
  if (!target) return null
  try {
    const admin = createAdminClient()
    if (target.type === 'aircraft') return await previewAircraft(admin, target, limit)
    if (target.type === 'seeker') return await previewSeekers(admin, target, limit)
    return await previewPartnerships(admin, target, limit)
  } catch (err) {
    console.error('[alertMatchCounts] preview error:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Honest one-line market-context sentence for an aircraft alert's family —
 * "14 Cessna 172s listed right now, median asking $89k" — for the alert-digest
 * cron (see GOAL.md: "makes the email a subscriber opens visibly smarter than
 * Controller's"). Reuses `priceStats` (`aircraftComps.ts`), the SAME pure
 * aggregator + `MIN_SNAPSHOT_LISTINGS` honesty floor the make/model page's
 * "Market snapshot" block already established — below that floor this returns
 * `null` (never a guess) rather than publish a noisy median off a handful of
 * listings. `modelPattern` is an `ilike` pattern (may be a bare model string
 * with no `%` — behaves as a case-insensitive exact match then); callers
 * should only pass this for a single, clean model, not a multi-select.
 */
export async function getMarketPulseLine(
  supabase: ReturnType<typeof createAdminClient>,
  make: string,
  modelLabel: string,
  modelPattern: string,
  notModelPattern?: string
): Promise<string | null> {
  let q = supabase
    .from('aircraft_for_sale')
    .select('asking_price')
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .ilike('make', `%${make}%`)
    .ilike('model', modelPattern)
    .limit(5000)
  if (notModelPattern) q = q.not('model', 'ilike', notModelPattern)
  const { data, error } = await q
  if (error || !data) return null
  const prices = data.map((r) => r.asking_price as number | null).filter((p): p is number => p != null)
  const stats = priceStats(prices)
  if (!stats) return null
  const family = `${make} ${modelLabel}`
  const noun = stats.count === 1 ? family : `${family}s`
  return `${stats.count} ${noun} listed right now, median asking ${formatPriceK(stats.median)}.`
}

/**
 * Honest one-line market-context sentence for a PARTNERSHIP alert's make —
 * "6 Cessna partnerships listed right now, median buy-in $28k" — the
 * partnership counterpart of `getMarketPulseLine` above. Deliberately
 * make-level only (not make+model), independent of whether the alert itself
 * is model-scoped — a model-level median tends to run below the honesty
 * floor at current partnership volume, so this stays at the coarser
 * granularity that reliably clears it. Reuses the
 * same `priceStats`/`MIN_SNAPSHOT_LISTINGS` honesty floor against
 * `partnerships.buy_in_price` — below the floor this returns `null` rather
 * than publish a noisy median off a handful of listings.
 */
export async function getPartnershipMarketPulseLine(
  supabase: ReturnType<typeof createAdminClient>,
  make: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('partnerships')
    .select('buy_in_price')
    .eq('status', 'active')
    .ilike('make', `%${make}%`)
    .gt('buy_in_price', 0)
    .limit(5000)
  if (error || !data) return null
  const prices = data.map((r) => r.buy_in_price as number | null).filter((p): p is number => p != null)
  const stats = priceStats(prices)
  if (!stats) return null
  const noun = stats.count === 1 ? `${make} partnership` : `${make} partnerships`
  return `${stats.count} ${noun} listed right now, median buy-in ${formatPriceK(stats.median)}.`
}

/**
 * Honest one-line market-context sentence for a make-only AIRCRAFT alert —
 * "142 Cessnas listed right now, median asking $89k" — the make-level
 * counterpart of `getMarketPulseLine` above, for aircraft alert targets that
 * carry a `make` but no `marketPulseModel` (make-only browse alerts like
 * `/aircraft/cessna` or `/aircraft?make=Cessna`, and multi-model selections)
 * — those got NO market-pulse line at all before this. Same
 * `priceStats`/`MIN_SNAPSHOT_LISTINGS` honesty floor and `PARTS_PRICE_FLOOR`
 * filter `getMarketPulseLine` uses against `aircraft_for_sale.asking_price` —
 * below the floor this returns `null` rather than publish a noisy median off
 * a handful of listings.
 */
export async function getAircraftMakePulseLine(
  supabase: ReturnType<typeof createAdminClient>,
  make: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('aircraft_for_sale')
    .select('asking_price')
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .ilike('make', `%${make}%`)
    .limit(5000)
  if (error || !data) return null
  const prices = data.map((r) => r.asking_price as number | null).filter((p): p is number => p != null)
  const stats = priceStats(prices)
  if (!stats) return null
  const noun = stats.count === 1 ? make : `${make}s`
  return `${stats.count} ${noun} listed right now, median asking ${formatPriceK(stats.median)}.`
}
