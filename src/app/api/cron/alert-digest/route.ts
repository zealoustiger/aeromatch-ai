import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  sendEmail,
  buildAlertDigestEmail,
  buildCombinedAlertDigestEmail,
  buildPriceDropEmail,
  buildListingUnavailableEmail,
  pickBestPriceDropSample,
  type AlertDigestSample,
  type AlertDigestSection,
} from '@/lib/email'
import { getStateBySlug, getMakeBySlug, getMakeModel, SEO_MAKE_MODELS } from '@/lib/seo'
import { SITE_URL } from '@/lib/seo'
import { matchesModelFilter } from '@/lib/seekerModelFilter'
import { hasRecentPriceDrop } from '@/lib/priceDrops'
import { intervalDaysFor, isDigestDue, normalizeFrequency } from '@/lib/alertFrequency'
import { pickRealPhoto, getPlaceholderPhoto } from '@/lib/aircraftPhotos'
import { formatShareType } from '@/lib/utils'
import { getAirportsWithinRadius } from '@/lib/airports'
import { filterToGoodDeals } from '@/lib/aircraftComps'

const MAX_DIGEST_SAMPLES = 3

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PARTS_PRICE_FLOOR = 50_000
// Broadest possible send interval a subscriber can pick (see alertFrequency.ts) —
// used only as a coarse SQL pre-filter; the actual per-alert due-check (which
// respects each alert's own weekly/daily choice) happens in the loop below.
const MIN_DIGEST_INTERVAL_DAYS = intervalDaysFor('daily')

// ─── Source-path parsing ─────────────────────────────────────────────────────

type AlertTarget =
  | {
      type: 'aircraft'
      make?: string
      model?: string
      modelPattern?: string
      notModelPattern?: string
      state?: string
      minPrice?: number
      maxPrice?: number
      minYear?: number
      maxYear?: number
      maxTt?: number
      /** "Only email me good deals" — narrows matches to a 'good'
       *  `clubHangerDealVerdict` (see `filterToGoodDeals`). Set via `deal=good`
       *  in the alert's source_path query string; no schema/DB storage. */
      dealOnly?: boolean
      /** Set when this alert watches ONE specific listing for a price drop
       *  (`source_path` = `/aircraft/listing/<id>?watch=price`) rather than a
       *  family search — see the "Watch this listing" capture point on the
       *  listing detail page. When set, every other field above is ignored;
       *  the main loop routes it through `resolveListingWatch` instead of the
       *  generic `countNew`/`countRecentAircraftPriceDrops` path. */
      listingId?: string
    }
  | { type: 'partnership'; make?: string; state?: string; icao?: string; radius?: number }
  | { type: 'seeker'; make?: string; model?: string; state?: string; icao?: string }

const numOrUndef = (v: string | undefined): number | undefined => {
  if (!v) return undefined
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Parse an alert `source_path` (e.g. "/aircraft/cessna/172") into a typed
 * filter struct that can drive a count query. Returns null for paths we can't
 * meaningfully match (mission presets, unknown families).
 */
function parseSourcePath(raw: string | null): AlertTarget | null {
  const [pathOnly, qs] = (raw ?? '').split('?')
  const p = pathOnly.toLowerCase().replace(/\/$/, '') || '/'
  const target = resolveTarget(p, qs)

  // `deal=good` can ride on ANY aircraft source_path shape, not just the bare
  // `/aircraft?...` one — e.g. AlertSignup on the make/model page passes the
  // page's own SEO path (`/aircraft/cessna/172`) as sourcePath, so a checked
  // "only good deals" box produces `/aircraft/cessna/172?deal=good`. The bare-
  // path branch below already reads `deal` off its own qs; every OTHER
  // aircraft branch (path-segment SEO routes) never looks at qs at all, so
  // apply it once here, after resolution, so it's honored no matter which
  // branch produced the target.
  if (target?.type === 'aircraft' && qs && !target.dealOnly) {
    const params = new URLSearchParams(qs)
    if (params.get('deal') === 'good') target.dealOnly = true
  }
  return target
}

function resolveTarget(p: string, qs: string | undefined): AlertTarget | null {
  // Bare /aircraft, /partnerships, or /partnerships/seeking WITH a query string →
  // the filter shape the browse pages' inline AlertSignup and the /alerts landing
  // chips actually produce (e.g. "/aircraft?make=Cessna&model=172"). Must be
  // checked BEFORE the path-segment SEO matchers below, which never carry a
  // query — a plain `split('?')[0]` here would otherwise silently drop every
  // filter and downgrade the alert to "any new aircraft/partnership/seeker".
  if (qs && (p === '/aircraft' || p === '/partnerships' || p === '/partnerships/seeking')) {
    const params = new URLSearchParams(qs)
    const g = (k: string) => params.get(k)?.trim() || undefined
    if (p === '/aircraft') {
      return {
        type: 'aircraft',
        make: g('make'),
        model: g('model'),
        state: g('state')?.toUpperCase(),
        minPrice: numOrUndef(g('min_price')),
        maxPrice: numOrUndef(g('max_price')),
        minYear: numOrUndef(g('min_year')),
        maxYear: numOrUndef(g('max_year')),
        maxTt: numOrUndef(g('max_tt')),
        dealOnly: g('deal') === 'good',
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
      state: g('state')?.toUpperCase(),
      icao: g('airport')?.toUpperCase(),
      radius: numOrUndef(g('radius')),
    }
  }

  // ── Aircraft paths ────────────────────────────────────────────────────────

  // /aircraft/for-sale/california → state filter
  const forSaleState = p.match(/^\/aircraft\/for-sale\/(.+)$/)
  if (forSaleState) {
    const entry = getStateBySlug(forSaleState[1])
    return entry ? { type: 'aircraft', state: entry.code } : null
  }

  // /aircraft/mission/... → complex preset, skip
  if (p.startsWith('/aircraft/mission/')) return null

  // /aircraft/listing/[id]?watch=price → watching ONE specific listing's own
  // price, not a family search. Must be checked before the make/model regex
  // below, which would otherwise misparse "listing" as a make slug.
  const listingWatch = p.match(/^\/aircraft\/listing\/([^/]+)$/)
  if (listingWatch) {
    const params = new URLSearchParams(qs ?? '')
    if (params.get('watch') !== 'price') return null
    return { type: 'aircraft', listingId: listingWatch[1] }
  }

  // /aircraft/[make]/[model]/[stateCode] → make+model+state
  const makeModelState = p.match(/^\/aircraft\/([^/]+)\/([^/]+)\/([a-z]{2})$/)
  if (makeModelState) {
    const [, makeSlug, modelSlug, stateCode] = makeModelState
    const target = resolveAircraftMakeModel(makeSlug, modelSlug)
    if (!target) return null
    return { ...target, state: stateCode.toUpperCase() }
  }

  // /aircraft/[make]/[model] → make+model
  const makeModel = p.match(/^\/aircraft\/([^/]+)\/([^/]+)$/)
  if (makeModel) {
    return resolveAircraftMakeModel(makeModel[1], makeModel[2])
  }

  // /aircraft/[make] → make only
  const makeOnly = p.match(/^\/aircraft\/([^/]+)$/)
  if (makeOnly) {
    const makeEntry = getMakeBySlug(makeOnly[1])
    if (!makeEntry) return null
    return { type: 'aircraft', make: makeEntry.filter }
  }

  // /aircraft → all aircraft (no filters)
  if (p === '/aircraft') return { type: 'aircraft' }

  // ── Partnership paths ─────────────────────────────────────────────────────

  // /partnerships/near/[icao] → by home airport
  const nearIcao = p.match(/^\/partnerships\/near\/([a-z0-9]{3,4})$/)
  if (nearIcao) return { type: 'partnership', icao: nearIcao[1].toUpperCase() }

  // /partnerships/make/[makeSlug] → by make
  const pMake = p.match(/^\/partnerships\/make\/([^/]+)$/)
  if (pMake) {
    const makeEntry = getMakeBySlug(pMake[1])
    if (!makeEntry) return null
    return { type: 'partnership', make: makeEntry.filter }
  }

  // /partnerships/state/[stateCode] → USPS code (e.g. "ca")
  const pState = p.match(/^\/partnerships\/state\/([a-z]{2})$/)
  if (pState) return { type: 'partnership', state: pState[1].toUpperCase() }

  // /partnerships/seeking → pilots seeking a partnership
  if (p === '/partnerships/seeking') return { type: 'seeker' }

  // /partnerships → all partnerships
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

  // Prefer the curated SEO_MAKE_MODELS entry for the precise model pattern.
  const seoEntry = getMakeModel(makeSlug, modelSlug)
  if (seoEntry) {
    return {
      type: 'aircraft',
      make: seoEntry.make,
      modelPattern: seoEntry.modelPattern,
      notModelPattern: seoEntry.notModelPattern,
    }
  }

  // Fall back: use the model slug itself as a prefix pattern.
  return {
    type: 'aircraft',
    make: makeEntry.filter,
    modelPattern: `${modelSlug}%`,
  }
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

/** Applies the aircraft AlertTarget's filter fields to an already-`any`-typed
 *  query builder — shared by the deal-only branches below (which need a real,
 *  non-head select and so can't reuse the typed `q` chains the non-deal-only
 *  paths use). Not used by the non-deal-only paths, which keep their existing
 *  typed chains unchanged. */
function applyAircraftFilters(q: any, target: Extract<AlertTarget, { type: 'aircraft' }>): any {
  if (target.make) q = q.ilike('make', `%${target.make}%`)
  if (target.model) q = q.eq('model', target.model)
  if (target.modelPattern) q = q.ilike('model', target.modelPattern)
  if (target.notModelPattern) q = q.not('model', 'ilike', target.notModelPattern)
  if (target.state) q = q.eq('state', target.state)
  if (target.minPrice !== undefined) q = q.gte('asking_price', target.minPrice)
  if (target.maxPrice !== undefined) q = q.lte('asking_price', target.maxPrice)
  if (target.minYear !== undefined) q = q.gte('year', target.minYear)
  if (target.maxYear !== undefined) q = q.lte('year', target.maxYear)
  if (target.maxTt !== undefined) q = q.lte('ttaf', target.maxTt)
  return q
}

// ─── Count new listings ───────────────────────────────────────────────────────

async function countNewAircraft(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  since: string
): Promise<number> {
  // A deal-only alert needs the actual rows (make/year/ttaf/smoh) to run
  // through filterToGoodDeals — a head-only count can't narrow by verdict, so
  // it gets its own real (non-head) select instead of `count: 'exact', head: true`.
  if (target.dealOnly) {
    let dq: any = supabase
      .from('aircraft_for_sale')
      .select('id, make, model, asking_price, year, ttaf, smoh')
      .eq('status', 'active')
      .gte('asking_price', PARTS_PRICE_FLOOR)
      .gte('first_seen_at', since)
    dq = applyAircraftFilters(dq, target)
    const { data, error } = await dq
    if (error) {
      console.error('[alert-digest] aircraft deal-only count error:', error.message)
      return 0
    }
    const goodDeals = await filterToGoodDeals(supabase, (data ?? []) as any[])
    return goodDeals.length
  }

  let q = supabase
    .from('aircraft_for_sale')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .gte('first_seen_at', since)

  if (target.make) q = q.ilike('make', `%${target.make}%`)
  if (target.model) q = q.eq('model', target.model)
  if (target.modelPattern) q = q.ilike('model', target.modelPattern)
  if (target.notModelPattern) q = q.not('model', 'ilike', target.notModelPattern)
  if (target.state) q = q.eq('state', target.state)
  if (target.minPrice !== undefined) q = q.gte('asking_price', target.minPrice)
  if (target.maxPrice !== undefined) q = q.lte('asking_price', target.maxPrice)
  if (target.minYear !== undefined) q = q.gte('year', target.minYear)
  if (target.maxYear !== undefined) q = q.lte('year', target.maxYear)
  if (target.maxTt !== undefined) q = q.lte('ttaf', target.maxTt)

  const { count, error } = await q
  if (error) {
    console.error('[alert-digest] aircraft count error:', error.message)
    return 0
  }
  return count ?? 0
}

/**
 * Count active aircraft matching `target`'s criteria whose most recent price
 * change was a genuine decrease recorded since `since` (GOAL.md: "new-listing
 * AND price-drop alerts"). Mirrors `countNewAircraft`'s filter fields exactly,
 * so a price-drop match respects the same alert criteria as a new-listing
 * match. `previous_price`/`asking_price` comparison can't be pushed into a
 * PostgREST head-count filter (no column-to-column operator), so — like
 * `countNewSeekers` below — this fetches the narrowed candidate set and
 * filters in JS via the shared `hasRecentPriceDrop` helper.
 */
async function countRecentAircraftPriceDrops(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  since: string
): Promise<number> {
  // `q` is typed `any` here (not the usual PostgrestFilterBuilder inference) —
  // selecting concrete columns (vs. the head:true count-only selects elsewhere
  // in this file) combined with this many chained conditional reassignments
  // hits a real "type instantiation excessively deep" TS limit on the
  // supabase-js builder generics.
  let q: any = supabase
    .from('aircraft_for_sale')
    .select(
      target.dealOnly
        ? 'id, make, model, asking_price, previous_price, price_changed_at, year, ttaf, smoh'
        : 'asking_price, previous_price, price_changed_at'
    )
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .gte('price_changed_at', since)
    .not('previous_price', 'is', null)

  q = applyAircraftFilters(q, target)

  type Row = {
    id?: string
    make?: string | null
    model?: string | null
    asking_price: number | null
    previous_price: number | null
    price_changed_at: string | null
    year?: number | null
    ttaf?: number | null
    smoh?: number | null
  }
  const { data, error } = (await q) as { data: Row[] | null; error: { message: string } | null }
  if (error) {
    console.error('[alert-digest] price-drop count error:', error.message)
    return 0
  }
  const dropped = (data ?? []).filter((r) => hasRecentPriceDrop(r, since))
  if (target.dealOnly) {
    const goodDeals = await filterToGoodDeals(supabase, dropped as any[])
    return goodDeals.length
  }
  return dropped.length
}

/**
 * Count active partnerships matching `target`'s criteria whose most recent
 * buy-in change was a genuine decrease recorded since `since` — the
 * partnership analog of `countRecentAircraftPriceDrops`, reusing the same
 * `hasRecentPriceDrop` helper by remapping the buy-in column names onto its
 * generic `previous_price`/`asking_price`/`price_changed_at` shape.
 * `previous_buy_in_price`/`buy_in_price_changed_at` are a pending-migration
 * column pair (see `supabase/schema.sql`'s `partnership_add_price_history`) —
 * on a missing-column error this returns 0 rather than failing the digest run,
 * same graceful-degrade precedent as `countNewSeekers`'s `additional_airports`.
 */
async function countRecentPartnershipPriceDrops(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'partnership' }>,
  since: string
): Promise<number> {
  let q = supabase
    .from('partnerships')
    .select('buy_in_price, previous_buy_in_price, buy_in_price_changed_at')
    .eq('status', 'active')
    .gte('buy_in_price_changed_at', since)
    .not('previous_buy_in_price', 'is', null)

  if (target.make) q = q.ilike('make', `%${target.make}%`)
  if (target.state) q = q.eq('state', target.state)
  const icaoList = await resolveIcaoList(target)
  if (icaoList) q = q.in('home_airport', icaoList)

  type Row = {
    buy_in_price: number | null
    previous_buy_in_price: number | null
    buy_in_price_changed_at: string | null
  }
  const { data, error } = (await q) as { data: Row[] | null; error: { message: string } | null }
  if (error) {
    if (error.message?.includes('previous_buy_in_price') || error.message?.includes('buy_in_price_changed_at')) {
      return 0
    }
    console.error('[alert-digest] partnership price-drop count error:', error.message)
    return 0
  }
  return (data ?? []).filter((r) =>
    hasRecentPriceDrop(
      {
        previous_price: r.previous_buy_in_price,
        asking_price: r.buy_in_price,
        price_changed_at: r.buy_in_price_changed_at,
      },
      since
    )
  ).length
}

async function countNewPartnerships(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'partnership' }>,
  since: string
): Promise<number> {
  let q = supabase
    .from('partnerships')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', since)

  if (target.make) q = q.ilike('make', `%${target.make}%`)
  if (target.state) q = q.eq('state', target.state)
  const icaoList = await resolveIcaoList(target)
  if (icaoList) q = q.in('home_airport', icaoList)

  const { count, error } = await q
  if (error) {
    console.error('[alert-digest] partnership count error:', error.message)
    return 0
  }
  return count ?? 0
}

async function countNewSeekers(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'seeker' }>,
  since: string
): Promise<number> {
  // `model` has no DB column of its own (free-text `preferred_models`), so when it's
  // present we fetch the field and match in JS via the same `matchesModelFilter` the
  // browse page's `getSeekers()` uses, instead of a head-only count query.
  let q = supabase
    .from('partnership_seekers')
    .select('id, preferred_models')
    .eq('status', 'active')
    .gte('created_at', since)

  // preferred_makes is a text[] — overlap, not equality, matching the same
  // make-filter semantics getSeekers() uses for the browse page.
  if (target.make) q = q.overlaps('preferred_makes', [target.make])
  if (target.state) q = q.eq('state', target.state)
  // Single ICAO, no radius — mirrors countNewPartnerships' icao handling below.
  // Matches home_airport OR additional_airports, same OR semantics as
  // seekersQuery.ts's getSeekers(). additional_airports may not be migrated live
  // yet; retry without it (home_airport-only) on that specific column error,
  // same graceful-degrade precedent used there.
  if (target.icao) q = q.or(`home_airport.eq.${target.icao},additional_airports.ov.{${target.icao}}`)

  let { data, error } = await q
  if (target.icao && error?.message?.includes('additional_airports')) {
    let retry = supabase
      .from('partnership_seekers')
      .select('id, preferred_models')
      .eq('status', 'active')
      .gte('created_at', since)
      .eq('home_airport', target.icao)
    if (target.make) retry = retry.overlaps('preferred_makes', [target.make])
    if (target.state) retry = retry.eq('state', target.state)
    ;({ data, error } = await retry)
  }

  if (error) {
    console.error('[alert-digest] seeker count error:', error.message)
    return 0
  }
  const rows = data ?? []
  if (!target.model) return rows.length

  const wanted = target.model.split(',').map((m) => m.trim()).filter(Boolean)
  return rows.filter((r) => matchesModelFilter(r.preferred_models as string | null, wanted)).length
}

async function countNew(
  supabase: ReturnType<typeof createAdminClient>,
  target: AlertTarget,
  since: string
): Promise<number> {
  if (target.type === 'aircraft') return countNewAircraft(supabase, target, since)
  if (target.type === 'seeker') return countNewSeekers(supabase, target, since)
  return countNewPartnerships(supabase, target, since)
}

// ─── Digest email sample listings (aircraft only) ─────────────────────────────

type AircraftSampleRow = {
  id: string
  make: string | null
  model: string | null
  year: number | null
  asking_price: number | null
  previous_price?: number | null
  images: string[] | null
  location: string | null
  ttaf: number | null
  smoh?: number | null
}

function toDigestSample(row: AircraftSampleRow, previousPrice?: number | null): AlertDigestSample {
  const realPhoto = pickRealPhoto(row.images)
  return {
    title: [row.year, row.make, row.model].filter(Boolean).join(' ') || 'Aircraft',
    photoUrl: realPhoto ?? getPlaceholderPhoto(row.make ?? ''),
    isPlaceholder: !realPhoto,
    year: row.year,
    ttaf: row.ttaf,
    location: row.location,
    price: row.asking_price,
    previousPrice,
    url: `${SITE_URL}/aircraft/listing/${row.id}`,
  }
}

/** Up to `limit` real, newly-listed aircraft matching `target` since `since`,
 *  for the digest email's preview cards. Mirrors `countNewAircraft`'s filters. */
async function fetchNewAircraftSamples(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  since: string,
  limit = MAX_DIGEST_SAMPLES
): Promise<AlertDigestSample[]> {
  // A deal-only alert can't apply the DB-side `.limit(limit)` before knowing
  // which candidates are actually good deals — fetch a wider pool (still
  // bounded), narrow through filterToGoodDeals, then slice to `limit`, same
  // fetch-then-JS-filter-then-slice precedent fetchNewSeekerSamples uses for
  // its own DB-column-less filter.
  let q: any = supabase
    .from('aircraft_for_sale')
    .select(target.dealOnly ? 'id, make, model, year, asking_price, images, location, ttaf, smoh' : 'id, make, model, year, asking_price, images, location, ttaf')
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .gte('first_seen_at', since)
    .order('first_seen_at', { ascending: false })
    .limit(target.dealOnly ? 200 : limit)

  q = applyAircraftFilters(q, target)

  const { data, error } = await q
  if (error) {
    console.error('[alert-digest] new-aircraft sample error:', error.message)
    return []
  }
  const rows = (data ?? []) as AircraftSampleRow[]
  const narrowed = target.dealOnly ? await filterToGoodDeals(supabase, rows as any[]) : rows
  return (narrowed as AircraftSampleRow[]).slice(0, limit).map((row) => toDigestSample(row))
}

/** Up to `limit` real aircraft matching `target` whose most recent price
 *  change was a genuine decrease since `since` — same candidate set
 *  `countRecentAircraftPriceDrops` counts, widened to the columns the digest
 *  email's preview cards need (photo/year/TTAF/location + before/after price). */
async function fetchAircraftPriceDropSamples(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  since: string,
  limit = MAX_DIGEST_SAMPLES
): Promise<AlertDigestSample[]> {
  let q: any = supabase
    .from('aircraft_for_sale')
    .select('id, make, model, year, asking_price, previous_price, images, location, ttaf, smoh, price_changed_at')
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .gte('price_changed_at', since)
    .not('previous_price', 'is', null)
    .order('price_changed_at', { ascending: false })

  q = applyAircraftFilters(q, target)

  type Row = Omit<AircraftSampleRow, 'previous_price'> & {
    previous_price: number | null
    price_changed_at: string | null
  }
  const { data, error } = (await q) as { data: Row[] | null; error: { message: string } | null }
  if (error) {
    console.error('[alert-digest] price-drop sample error:', error.message)
    return []
  }
  const dropped = (data ?? []).filter((r) => hasRecentPriceDrop(r, since))
  const narrowed = target.dealOnly ? await filterToGoodDeals(supabase, dropped as any[]) : dropped
  return (narrowed as Row[]).slice(0, limit).map((row) => toDigestSample(row, row.previous_price))
}

type ListingWatchResult =
  | { kind: 'unavailable'; title: string; browseUrl: string }
  | { kind: 'active'; dropped: boolean; sample?: AlertDigestSample }

/**
 * Resolve a `listingId`-scoped "watch this listing" target: either the row
 * genuinely dropped in price since `since` (routes to the same single-listing
 * `buildPriceDropEmail` template as a family-scoped price-drop alert), or the
 * row is gone / no longer `status: 'active'` — the honesty-gate "say so once"
 * case, so a watch alert never just silently stops firing with no
 * explanation. A query error is treated as "nothing to report this pass"
 * rather than "unavailable" — never fabricate a removal on a transient error.
 */
async function resolveListingWatch(
  supabase: ReturnType<typeof createAdminClient>,
  listingId: string,
  since: string
): Promise<ListingWatchResult> {
  const { data, error } = await supabase
    .from('aircraft_for_sale')
    .select('id, make, model, year, asking_price, previous_price, price_changed_at, images, location, ttaf, status')
    .eq('id', listingId)
    .maybeSingle()

  if (error) {
    console.error('[alert-digest] listing-watch lookup error:', error.message)
    return { kind: 'active', dropped: false }
  }

  if (!data || data.status !== 'active') {
    const title = data ? [data.year, data.make, data.model].filter(Boolean).join(' ') || 'This aircraft' : 'This aircraft'
    const browseUrl =
      data?.make && data?.model
        ? `${SITE_URL}/aircraft?${new URLSearchParams({ make: data.make, model: data.model }).toString()}`
        : `${SITE_URL}/aircraft`
    return { kind: 'unavailable', title, browseUrl }
  }

  if (!hasRecentPriceDrop(data, since)) return { kind: 'active', dropped: false }
  return { kind: 'active', dropped: true, sample: toDigestSample(data as AircraftSampleRow, data.previous_price) }
}

type PartnershipSampleRow = {
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

function toPartnershipDigestSample(row: PartnershipSampleRow, previousPrice?: number | null): AlertDigestSample {
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
    previousPrice,
    url: `${SITE_URL}/partnerships/${row.id}`,
  }
}

/** Up to `limit` real, newly-listed partnerships matching `target` since
 *  `since`, for the digest email's preview cards. Mirrors
 *  `countNewPartnerships`'s filters. */
async function fetchNewPartnershipSamples(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'partnership' }>,
  since: string,
  limit = MAX_DIGEST_SAMPLES
): Promise<AlertDigestSample[]> {
  let q = supabase
    .from('partnerships')
    .select('id, make, model, year, buy_in_price, share_type, images, home_airport, city, state')
    .eq('status', 'active')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (target.make) q = q.ilike('make', `%${target.make}%`)
  if (target.state) q = q.eq('state', target.state)
  const icaoList = await resolveIcaoList(target)
  if (icaoList) q = q.in('home_airport', icaoList)

  const { data, error } = await q
  if (error) {
    console.error('[alert-digest] new-partnership sample error:', error.message)
    return []
  }
  return (data ?? []).map((row) => toPartnershipDigestSample(row as PartnershipSampleRow))
}

/** Up to `limit` real partnerships matching `target` whose most recent
 *  buy-in change was a genuine decrease since `since` — same candidate set
 *  `countRecentPartnershipPriceDrops` counts, widened to the columns the
 *  digest email's preview cards need (photo/year/share type/location +
 *  before/after buy-in). Mirrors `fetchAircraftPriceDropSamples`. */
async function fetchPartnershipPriceDropSamples(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'partnership' }>,
  since: string,
  limit = MAX_DIGEST_SAMPLES
): Promise<AlertDigestSample[]> {
  let q: any = supabase
    .from('partnerships')
    .select('id, make, model, year, buy_in_price, previous_buy_in_price, share_type, images, home_airport, city, state, buy_in_price_changed_at')
    .eq('status', 'active')
    .gte('buy_in_price_changed_at', since)
    .not('previous_buy_in_price', 'is', null)
    .order('buy_in_price_changed_at', { ascending: false })

  if (target.make) q = q.ilike('make', `%${target.make}%`)
  if (target.state) q = q.eq('state', target.state)
  const icaoList = await resolveIcaoList(target)
  if (icaoList) q = q.in('home_airport', icaoList)

  type Row = PartnershipSampleRow & {
    previous_buy_in_price: number | null
    buy_in_price_changed_at: string | null
  }
  const { data, error } = (await q) as { data: Row[] | null; error: { message: string } | null }
  if (error) {
    if (error.message?.includes('previous_buy_in_price') || error.message?.includes('buy_in_price_changed_at')) {
      return []
    }
    console.error('[alert-digest] partnership price-drop sample error:', error.message)
    return []
  }
  return (data ?? [])
    .filter((r) =>
      hasRecentPriceDrop(
        { previous_price: r.previous_buy_in_price, asking_price: r.buy_in_price, price_changed_at: r.buy_in_price_changed_at },
        since
      )
    )
    .slice(0, limit)
    .map((row) => toPartnershipDigestSample(row, row.previous_buy_in_price))
}

type SeekerSampleRow = {
  id: string
  title: string | null
  preferred_makes: string[] | null
  preferred_models: string | null
  home_airport: string | null
  city: string | null
  state: string | null
}

function toSeekerDigestSample(row: SeekerSampleRow): AlertDigestSample {
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
}

const SEEKER_SAMPLE_COLS = 'id, title, preferred_makes, preferred_models, home_airport, city, state, created_at'

/** Up to `limit` real, newly-posted seekers matching `target` since `since`,
 *  for the digest email's preview cards. Mirrors `countNewSeekers`'s filters
 *  (make overlap, state equality, the same `additional_airports`-aware icao OR
 *  with graceful-degrade retry, and the free-text `preferred_models` match via
 *  `matchesModelFilter` done in JS since it has no DB column of its own) but
 *  selects the columns a preview card needs instead of a head-only count. No
 *  DB-side limit before the JS model filter, same as `countNewSeekers` — cold
 *  start volumes make this cheap; sliced to `limit` after filtering. */
async function fetchNewSeekerSamples(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'seeker' }>,
  since: string,
  limit = MAX_DIGEST_SAMPLES
): Promise<AlertDigestSample[]> {
  let q = supabase
    .from('partnership_seekers')
    .select(SEEKER_SAMPLE_COLS)
    .eq('status', 'active')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (target.make) q = q.overlaps('preferred_makes', [target.make])
  if (target.state) q = q.eq('state', target.state)
  if (target.icao) q = q.or(`home_airport.eq.${target.icao},additional_airports.ov.{${target.icao}}`)

  let { data, error } = await q
  if (target.icao && error?.message?.includes('additional_airports')) {
    let retry = supabase
      .from('partnership_seekers')
      .select(SEEKER_SAMPLE_COLS)
      .eq('status', 'active')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .eq('home_airport', target.icao)
    if (target.make) retry = retry.overlaps('preferred_makes', [target.make])
    if (target.state) retry = retry.eq('state', target.state)
    ;({ data, error } = await retry)
  }

  if (error) {
    console.error('[alert-digest] new-seeker sample error:', error.message)
    return []
  }

  let rows = (data ?? []) as SeekerSampleRow[]
  if (target.model) {
    const wanted = target.model.split(',').map((m) => m.trim()).filter(Boolean)
    rows = rows.filter((r) => matchesModelFilter(r.preferred_models, wanted))
  }
  return rows.slice(0, limit).map(toSeekerDigestSample)
}

// ─── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Protect the route in production. Vercel passes the CRON_SECRET via the
  // Authorization header when cron.config is set. In development / staging
  // without the secret, log a warning but allow the call so the route can be
  // tested manually.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  } else {
    console.warn('[alert-digest] CRON_SECRET not set — route is unprotected (ok in dev)')
  }

  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()
  const minWindowStart = new Date(Date.now() - MIN_DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Auto-resume snoozed alerts whose "Snooze 30 days" date has passed (GOAL.md:
  // a real resume, not "we'll check back soon") before the due-alert fetch
  // below, so a just-resumed row can be picked up in this same pass. No-ops
  // gracefully (logs + continues) if `paused_until` isn't migrated live yet —
  // every snoozed alert simply stays paused until a human applies it, same as
  // every other pending `alerts.*` column.
  const { error: resumeError } = await supabase
    .from('alerts')
    .update({ status: 'confirmed', paused_until: null })
    .eq('status', 'paused')
    .not('paused_until', 'is', null)
    .lte('paused_until', nowIso)
  if (resumeError && !resumeError.message?.includes('paused_until')) {
    console.error('[alert-digest] snooze auto-resume error:', resumeError.message)
  }

  type DigestAlertRow = {
    id: string
    email: string
    context: string | null
    source_path: string | null
    created_at: string
    last_digest_at: string | null
    unsubscribe_token: string | null
    price_drop_opt_in?: boolean
    frequency?: string
  }

  // Coarse pre-filter: any alert that could possibly be due, at ANY chosen
  // frequency, must have gone undigested for at least the shortest interval
  // (daily). The precise per-alert due-check (respecting each alert's own
  // weekly/daily choice) happens in the loop below via isDigestDue.
  const baseCols = 'id, email, context, source_path, created_at, last_digest_at, unsubscribe_token'
  let cols = `${baseCols}, price_drop_opt_in, frequency`
  let { data: alerts, error: fetchError } = (await supabase
    .from('alerts')
    .select(cols)
    .eq('status', 'confirmed')
    .or(`last_digest_at.is.null,last_digest_at.lt.${minWindowStart}`)) as unknown as {
    data: DigestAlertRow[] | null
    error: { message: string } | null
  }

  // Neither, either, or both of price_drop_opt_in/frequency may not be
  // migrated live yet — retry without whichever column(s) the error names
  // (PostgREST reports one unknown column per error, so this can take up to
  // two passes) rather than breaking the whole send run; every alert is then
  // treated as opted-in / weekly below, both columns' own defaults (current
  // behavior).
  for (let i = 0; i < 2 && fetchError && (fetchError.message?.includes('price_drop_opt_in') || fetchError.message?.includes('frequency')); i++) {
    cols = cols
      .split(', ')
      .filter((c) => !fetchError!.message.includes(c))
      .join(', ')
    ;({ data: alerts, error: fetchError } = (await supabase
      .from('alerts')
      .select(cols)
      .eq('status', 'confirmed')
      .or(`last_digest_at.is.null,last_digest_at.lt.${minWindowStart}`)) as unknown as {
      data: DigestAlertRow[] | null
      error: { message: string } | null
    })
  }

  if (fetchError) {
    console.error('[alert-digest] fetch error:', fetchError.message)
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  let skipped = 0
  let unparseable = 0
  let notDue = 0

  // Prepared, due, matching alerts — computed up front (unchanged per-alert
  // logic) and grouped by email below, so a subscriber with multiple due
  // alerts in this pass gets ONE combined email instead of one per alert
  // (GOAL.md: "never spam"; see alert-digest-combine).
  type Prepared = {
    alert: DigestAlertRow
    frequency: ReturnType<typeof normalizeFrequency>
    target: AlertTarget
    newCount: number
    dropCount: number
    samples: AlertDigestSample[]
  }
  const prepared: Prepared[] = []
  // Listing-watch alerts whose target has left `status: 'active'` — handled
  // entirely outside the grouped new/drop-count flow above (see the honesty
  // gate note where these are sent, after the main grouped-send loop below).
  const unavailableWatches: { alert: DigestAlertRow; title: string; browseUrl: string }[] = []

  for (const alert of alerts ?? []) {
    const frequency = normalizeFrequency(alert.frequency)
    if (!isDigestDue(alert.last_digest_at, frequency, nowIso)) {
      notDue++
      continue
    }

    const target = parseSourcePath(alert.source_path)
    if (!target) {
      unparseable++
      continue
    }

    // "Since when?" — use last_digest_at if present; else the signup date.
    const since = alert.last_digest_at ?? alert.created_at ?? minWindowStart

    if (target.type === 'aircraft' && target.listingId) {
      const watch = await resolveListingWatch(supabase, target.listingId, since)
      if (watch.kind === 'unavailable') {
        unavailableWatches.push({ alert, title: watch.title, browseUrl: watch.browseUrl })
        continue
      }
      if (!watch.dropped) {
        skipped++
        continue
      }
      // A genuine drop on the watched row — same shape (newCount 0, dropCount
      // 1, one sample) the grouped single-alert send loop below already knows
      // how to route to buildPriceDropEmail; no further special-casing needed.
      prepared.push({ alert, frequency, target, newCount: 0, dropCount: 1, samples: [watch.sample!] })
      continue
    }

    const newCount = await countNew(supabase, target, since)
    // Price-drop matching applies to aircraft-for-sale and partnership alerts
    // (a partnership's "price" is its buy-in share, tracked on the separate
    // previous_buy_in_price/buy_in_price_changed_at column pair) — seekers have
    // no price at all. `price_drop_opt_in` defaults to true (both at the DB
    // level and here, when the column isn't in the row because the migration
    // hasn't landed yet); there's no partnership-specific opt-out UI today, so
    // partnership alerts get drop detection on by default, same as aircraft.
    const priceDropOptIn = alert.price_drop_opt_in ?? true
    const dropCount = !priceDropOptIn
      ? 0
      : target.type === 'aircraft'
        ? await countRecentAircraftPriceDrops(supabase, target, since)
        : target.type === 'partnership'
          ? await countRecentPartnershipPriceDrops(supabase, target, since)
          : 0

    if (newCount === 0 && dropCount === 0) {
      skipped++
      continue
    }

    // Real preview cards — aircraft, partnership, and seeker alerts. Aircraft
    // and partnership prefer new-listing samples, falling back to price-drop
    // samples when there are no new ones; seekers have no price at all, so
    // they only ever get new-listing samples (dropCount is always 0 for
    // seekers — see below).
    const samples =
      target.type === 'aircraft'
        ? newCount > 0
          ? await fetchNewAircraftSamples(supabase, target, since)
          : await fetchAircraftPriceDropSamples(supabase, target, since)
        : target.type === 'partnership'
          ? newCount > 0
            ? await fetchNewPartnershipSamples(supabase, target, since)
            : await fetchPartnershipPriceDropSamples(supabase, target, since)
          : newCount > 0
            ? await fetchNewSeekerSamples(supabase, target, since)
            : []

    prepared.push({ alert, frequency, target, newCount, dropCount, samples })
  }

  // Group by email (lowercased — the same normalization every other alert
  // surface uses for this column) so two alerts signed up with different
  // casing of the same address still combine into one send.
  const byEmail = new Map<string, Prepared[]>()
  for (const p of prepared) {
    const key = p.alert.email.toLowerCase()
    const group = byEmail.get(key)
    if (group) group.push(p)
    else byEmail.set(key, [p])
  }

  let sent = 0
  let emailsSent = 0

  for (const group of byEmail.values()) {
    if (group.length === 1) {
      // Exactly one due, matching alert for this email — same single-alert
      // build/send path as before this cycle, byte-for-byte.
      const { alert, frequency, target, newCount, dropCount, samples } = group[0]

      const unsubToken = alert.unsubscribe_token ?? ''
      const listingsUrl = `${SITE_URL}${alert.source_path ?? '/aircraft'}`
      // Token-scoped so an email-only subscriber (no account) can actually manage
      // alerts from this link instead of hitting the sign-in wall — see
      // /alerts/manage's token-scoped path. Falls back to the bare URL for the
      // rare row with no token yet (pre-migration).
      const manageUrl = unsubToken ? `${SITE_URL}/alerts/manage?token=${unsubToken}` : `${SITE_URL}/alerts/manage`
      const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`
      // Only offer "fewer emails" for a daily-cadence alert — a weekly one has
      // no lighter cadence left to switch to.
      const frequencyUrl =
        frequency === 'daily' && unsubToken ? `${SITE_URL}/api/alerts/frequency?token=${unsubToken}` : undefined

      // When this send is purely about a price drop (no new listings to also
      // report) on an aircraft OR partnership alert, feature the single best
      // real drop via the rich single-listing template instead of the
      // aggregate digest's bare "+1 price/buy-in drop" count line. Falls back
      // to the aggregate digest if, for any reason, no sample qualifies (e.g.
      // the count and sample queries disagree at the edge) — never silently
      // drops the notification.
      const bestDrop =
        (target.type === 'aircraft' || target.type === 'partnership') && newCount === 0 && dropCount > 0
          ? pickBestPriceDropSample(samples)
          : null

      const { subject, html, text } = bestDrop
        ? buildPriceDropEmail({
            title: bestDrop.title,
            photoUrl: bestDrop.photoUrl,
            previousPrice: bestDrop.previousPrice as number,
            askingPrice: bestDrop.price as number,
            listingUrl: bestDrop.url,
            manageUrl,
            unsubscribeUrl,
            frequencyUrl,
            // Honesty: this is a daily/weekly cron send, never real-time —
            // never claim "just dropped".
            periodLabel: frequency === 'daily' ? 'yesterday' : 'this week',
            dropNoun: target.type === 'partnership' ? 'buy-in drop' : undefined,
            shareType: target.type === 'partnership' ? bestDrop.shareType : undefined,
          })
        : buildAlertDigestEmail({
            context: alert.context ?? null,
            samples,
            newCount,
            dropCount,
            dropNoun: target.type === 'partnership' ? 'buy-in drop' : undefined,
            listingsUrl,
            manageUrl,
            unsubscribeUrl,
            frequencyUrl,
          })

      const result = await sendEmail({ to: alert.email, subject, html, text, unsubscribeUrl })

      if (result.sent || result.reason === 'no-key') {
        // Update last_digest_at so we don't re-send for the same window.
        await supabase
          .from('alerts')
          .update({ last_digest_at: new Date().toISOString() })
          .eq('id', alert.id)
        sent++
        emailsSent++
      }
      continue
    }

    // 2+ due, matching alerts for this email in the same pass — one combined
    // email, one section per alert, rather than one email per alert.
    const sections: AlertDigestSection[] = group.map(({ alert, target, newCount, dropCount, samples }) => ({
      context: alert.context ?? null,
      newCount,
      dropCount,
      dropNoun: target.type === 'partnership' ? 'buy-in drop' : undefined,
      listingsUrl: `${SITE_URL}${alert.source_path ?? '/aircraft'}`,
      samples,
    }))

    // Any alert's token resolves the same email on /alerts/manage (it looks
    // up the owning email, then lists every alert for it), so the first
    // alert's token is enough for the shared Manage link. The Unsubscribe
    // link instead carries every alert's token (comma-separated) so one
    // click opts out of every alert this email covered — not just the first
    // — matching applyUnsubscribe's multi-token support.
    const firstToken = group[0].alert.unsubscribe_token ?? ''
    const manageUrl = firstToken ? `${SITE_URL}/alerts/manage?token=${firstToken}` : `${SITE_URL}/alerts/manage`
    const allTokens = group.map((p) => p.alert.unsubscribe_token).filter(Boolean).join(',')
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${allTokens}`

    const { subject, html, text } = buildCombinedAlertDigestEmail({ sections, manageUrl, unsubscribeUrl })
    const email = group[0].alert.email

    const result = await sendEmail({ to: email, subject, html, text, unsubscribeUrl })

    if (result.sent || result.reason === 'no-key') {
      const nowStamp = new Date().toISOString()
      await supabase
        .from('alerts')
        .update({ last_digest_at: nowStamp })
        .in(
          'id',
          group.map((p) => p.alert.id)
        )
      sent += group.length
      emailsSent++
    }
  }

  // Listing-watch alerts whose target left `status: 'active'` this pass —
  // GOAL.md's honesty gate ("say so once rather than staying silent
  // forever"). Always its own dedicated email, even on the rare pass where
  // this same subscriber also has another alert due (bundling it into the
  // combined-digest template is a follow-up, not this slice) — and the alert
  // is paused right after sending so it's genuinely a one-time notice, not a
  // recurring one every future cron pass.
  for (const { alert, title, browseUrl } of unavailableWatches) {
    const unsubToken = alert.unsubscribe_token ?? ''
    const manageUrl = unsubToken ? `${SITE_URL}/alerts/manage?token=${unsubToken}` : `${SITE_URL}/alerts/manage`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`
    const { subject, html, text } = buildListingUnavailableEmail({ title, browseUrl, manageUrl, unsubscribeUrl })

    const result = await sendEmail({ to: alert.email, subject, html, text, unsubscribeUrl })

    if (result.sent || result.reason === 'no-key') {
      await supabase
        .from('alerts')
        .update({ status: 'paused', last_digest_at: new Date().toISOString() })
        .eq('id', alert.id)
      sent++
      emailsSent++
    }
  }

  const total = (alerts ?? []).length
  console.log(
    `[alert-digest] processed=${total} sent=${sent} emailsSent=${emailsSent} skipped=${skipped} unparseable=${unparseable} notDue=${notDue}`
  )
  return Response.json({ processed: total, sent, emailsSent, skipped, unparseable, notDue })
}
