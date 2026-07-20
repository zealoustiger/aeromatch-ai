import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  sendEmail,
  buildAlertDigestEmail,
  buildCombinedAlertDigestEmail,
  buildAlertConfirmEmail,
  buildPriceDropEmail,
  buildListingUnavailableEmail,
  buildListingBackOnMarketEmail,
  buildWidenSuggestionEmail,
  buildRepermissionEmail,
  buildAdminAlertFunnelEmail,
  pickBestPriceDropSample,
  compLabel,
  type AlertDigestSample,
  type AlertDigestSection,
} from '@/lib/email'
import { getAlertFunnelWeeklySnapshot } from '@/lib/alertFunnelWeekly'
import {
  getAlertDigestPreview,
  getMarketPulseLine,
  getAircraftMakePulseLine,
  getPartnershipMarketPulseLine,
  getAlertMatchCount,
} from '@/lib/alertMatchCounts'
import { parseEditableAlertTarget, computeWidenCandidate, buildAlertCriteriaUpdate } from '@/lib/alertEditCriteria'
import { reminderWindow } from '@/lib/alertConfirmReminder'
import { getStateBySlug, getMakeBySlug, getMakeModel, SEO_MAKE_MODELS } from '@/lib/seo'
import { SITE_URL } from '@/lib/seo'
import { matchesModelFilter } from '@/lib/seekerModelFilter'
import { hasRecentPriceDrop, isMeaningfulPriceDrop } from '@/lib/priceDrops'
import { intervalDaysFor, isDigestDue, normalizeFrequency, shouldOfferDailyUpgrade } from '@/lib/alertFrequency'
import { pickRealPhoto, getPlaceholderPhoto } from '@/lib/aircraftPhotos'
import { formatShareType } from '@/lib/utils'
import { getAirportsWithinRadius } from '@/lib/airports'
import { filterToGoodDeals, compVsMarket, buildFamilyPriceMap } from '@/lib/aircraftComps'
import { rankSamplesByDealQuality } from '@/lib/dealRanking'
import { parseGradeFilter, gradeQueryPlan, type Grade } from '@/lib/listingQuality'
import { parseAvionicsFilter, fetchAvionicsMatchIds } from '@/lib/avionicsClassify'
import { applyPartnershipModelFilter } from '@/lib/partnershipModelFilter'
import { getCrossSellSuggestion } from '@/lib/alertCrossSell'
import { dedupeDigestSectionSamples } from '@/lib/alertDigestDedupe'
import { withShareParam } from '@/lib/shareAlertLink'
import { getDormantSubscribers } from '@/lib/dormantSubscribers'
import { SendPacer } from '@/lib/alertSendPacing'

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
      /** Smart-search family match (e.g. "sr22" → ilike "sr22%"), same param
       *  `/aircraft`'s `filters.model_like` applies. Distinct from `modelPattern`
       *  (curated SEO route matches), which already gets the `.ilike` treatment. */
      modelLike?: string
      state?: string
      /** ICAO airport code — narrowed to that airport's STATE, same coarse
       *  resolution `fetchAircraftPage`'s `filters.airport` uses (aircraft has no
       *  lat/lng radius helper the way partnerships' `resolveIcaoList` provides
       *  below). Resolved once via `resolveAircraftAirportState` right after
       *  `parseSourcePath`, into `airportState` below. */
      icao?: string
      airportState?: string
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
      /** Display model name for the digest's market-pulse line (e.g. "SR22") —
       *  set only when this target resolves to ONE clean model (a curated
       *  `SEO_MAKE_MODELS` entry, or a single non-comma `model` query param),
       *  so `getMarketPulseLine` can build a real "N {Make} {Model}s"
       *  sentence. Left unset for make-only alerts, the uncurated
       *  modelSlug-as-prefix fallback, and multi-model selections — those
       *  get no market-pulse line at all (honesty gate: never guess a label). */
      marketPulseModel?: string
      /** Avionics capability categories (glass/adsb/autopilot/waas/gps) — parsed
       *  from the same comma-joined `avionics` param the browse page's filter
       *  uses, matched via the shared `fetchAvionicsMatchIds` id-narrowing scan
       *  (see `avionicsClassify.ts`; `text[]` column, no cheap column filter). */
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
      /** Set when this alert watches ONE specific partnership for a buy-in
       *  drop (`source_path` = `/partnerships/<id>?watch=price`) — the
       *  partnership counterpart of the aircraft `listingId` field above. When
       *  set, every other field is ignored; routed through
       *  `resolvePartnershipWatch` instead of the generic
       *  `countNew`/`countRecentPartnershipPriceDrops` path. */
      listingId?: string
    }
  | { type: 'seeker'; make?: string; model?: string; state?: string; icao?: string }
  /** Bare `/` — the site-wide capture points (footer, homepage, /about,
   *  /saved fallback, not-found) that carry no family/location filter at
   *  all. "Any new listing" = aircraft ∪ partnerships (no seekers — these
   *  surfaces are all buyer-facing, not "find me a partner" framed). */
  | { type: 'all' }

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
      const model = g('model')
      return {
        type: 'aircraft',
        make: g('make'),
        model,
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
        dealOnly: g('deal') === 'good',
        // Single, non-comma model only — a multi-select can't collapse to one
        // clean "N {Make} {Model}s" sentence (see `marketPulseModel`'s doc).
        marketPulseModel: model && !model.includes(',') ? model : undefined,
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

  // /partnerships/[id]?watch=price → watching ONE specific partnership's own
  // buy-in price, not a family search. Checked after the near/make/state/
  // seeking exact-path matchers above (so a real id can never collide with
  // those reserved segments) and before the bare "/partnerships" fallback.
  const partnershipWatch = p.match(/^\/partnerships\/([^/]+)$/)
  if (partnershipWatch) {
    const params = new URLSearchParams(qs ?? '')
    if (params.get('watch') !== 'price') return null
    return { type: 'partnership', listingId: partnershipWatch[1] }
  }

  // /partnerships → all partnerships
  if (p === '/partnerships') return { type: 'partnership' }

  // / → the site-wide, no-filter capture points. Previously fell through to
  // null here — captured, confirmed, and silently never matched/emailed.
  if (p === '/') return { type: 'all' }

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
      marketPulseModel: seoEntry.model,
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

/** Resolve an aircraft alert's `icao` airport filter to that airport's STATE,
 *  same coarse resolution `fetchAircraftPage`'s `filters.airport` uses (no
 *  lat/lng radius helper exists for aircraft the way `resolveIcaoList` above
 *  provides for partnerships). Called once right after `parseSourcePath`
 *  produces the target, so every aircraft filter site below sees the resolved
 *  `airportState` already set. No-ops when the code isn't in our `airports`
 *  table, matching the browse page's own graceful fallback. */
async function resolveAircraftAirportState(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>
): Promise<void> {
  if (!target.icao) return
  const { data } = await supabase.from('airports').select('state').eq('icao', target.icao).maybeSingle()
  if (data?.state) target.airportState = data.state
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
  if (target.modelLike) q = q.ilike('model', `${target.modelLike.replace(/[%,]/g, '')}%`)
  if (target.state) q = q.eq('state', target.state)
  if (target.airportState) q = q.eq('state', target.airportState)
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
    if (target.avionics && target.avionics.length > 0) {
      const ids = await fetchAvionicsMatchIds(supabase, target.avionics, PARTS_PRICE_FLOOR)
      if (ids.length === 0) return 0
      dq = dq.in('id', ids)
    }
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
  if (target.modelLike) q = q.ilike('model', `${target.modelLike.replace(/[%,]/g, '')}%`)
  if (target.state) q = q.eq('state', target.state)
  if (target.airportState) q = q.eq('state', target.airportState)
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
    if (ids.length === 0) return 0
    q = q.in('id', ids)
  }

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
  if (target.avionics && target.avionics.length > 0) {
    const ids = await fetchAvionicsMatchIds(supabase, target.avionics, PARTS_PRICE_FLOOR)
    if (ids.length === 0) return 0
    q = q.in('id', ids)
  }

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
  const dropped = (data ?? []).filter((r) => hasRecentPriceDrop(r, since) && isMeaningfulPriceDrop(r))
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
  q = applyPartnershipModelFilter(q, target.model)
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
  return (data ?? []).filter((r) => {
    const drop = {
      previous_price: r.previous_buy_in_price,
      asking_price: r.buy_in_price,
      price_changed_at: r.buy_in_price_changed_at,
    }
    return hasRecentPriceDrop(drop, since) && isMeaningfulPriceDrop(drop)
  }).length
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
  q = applyPartnershipModelFilter(q, target.model)
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
  if (target.type === 'all') {
    return (
      (await countNewAircraft(supabase, { type: 'aircraft' }, since)) +
      (await countNewPartnerships(supabase, { type: 'partnership' }, since))
    )
  }
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

function toDigestSample(
  row: AircraftSampleRow,
  previousPrice?: number | null,
  familyPriceMap?: Map<string, number[]> | null
): AlertDigestSample {
  const realPhoto = pickRealPhoto(row.images)
  // Honest market-context line — same `compVsMarket` honesty floors (>= 4
  // other priced comps in the family) as the on-site "vs market" pill; below
  // the floor `comp` is null and the sample renders with no line at all,
  // never a guessed comparison.
  const comp = familyPriceMap
    ? compVsMarket({ make: row.make, model: row.model, asking_price: row.asking_price }, familyPriceMap)
    : null
  return {
    title: [row.year, row.make, row.model].filter(Boolean).join(' ') || 'Aircraft',
    photoUrl: realPhoto ?? getPlaceholderPhoto(row.make ?? ''),
    isPlaceholder: !realPhoto,
    year: row.year,
    ttaf: row.ttaf,
    location: row.location,
    price: row.asking_price,
    previousPrice,
    compLabel: comp ? compLabel(comp) : undefined,
    compBelowAvg: comp?.kind === 'below',
    url: `${SITE_URL}/aircraft/listing/${row.id}`,
    id: row.id,
    type: 'aircraft',
  }
}

/**
 * Attaches a one-tap "Watch this listing" link (see `AlertDigestSample.watchUrl`,
 * `/api/alerts/digest-cross-sell`'s `digest_sample_watch` source) to each
 * aircraft-for-sale sample this subscriber doesn't already watch — the digest
 * sample card is the highest-intent moment in the whole funnel (GOAL.md:
 * "prove it converts"), yet its only prior actions were "open the listing" and
 * "Not relevant?". Skips any sample the subscriber already has a confirmed
 * `/aircraft/listing/{id}` alert for (re-offering a watch they already have is
 * noise, not value) and any non-aircraft sample or one with no `id`
 * (partnership/seeker samples never get this link). Cheap no-op (no query) for
 * any group with no aircraft samples, which is most partnership/seeker sends.
 */
async function attachWatchLinks(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  unsubToken: string | null,
  samples: AlertDigestSample[]
): Promise<AlertDigestSample[]> {
  if (!unsubToken) return samples
  const aircraftIds = samples.filter((s) => s.type === 'aircraft' && s.id).map((s) => s.id as string)
  if (aircraftIds.length === 0) return samples
  const paths = aircraftIds.map((id) => `/aircraft/listing/${id}`)
  const { data } = await supabase.from('alerts').select('source_path').eq('email', email).eq('status', 'confirmed').in('source_path', paths)
  const alreadyWatched = new Set((data ?? []).map((r) => r.source_path))
  return samples.map((s) => {
    if (s.type !== 'aircraft' || !s.id) return s
    const path = `/aircraft/listing/${s.id}`
    if (alreadyWatched.has(path)) return s
    return {
      ...s,
      watchUrl: `${SITE_URL}/api/alerts/digest-cross-sell?token=${unsubToken}&path=${encodeURIComponent(path)}&source=digest_sample_watch&context=${encodeURIComponent(s.title)}`,
    }
  })
}

// Build a make+model FAMILY -> sorted asking-prices map across ALL active,
// priced aircraft listings, for the digest email's honest "vs market" sample
// line (`toDigestSample`) — the same read `AircraftSaleList.tsx`'s
// `fetchFamilyPriceMap` does for the on-site card pill, computed here from
// the admin client instead of a server-component Supabase client. A single
// `.limit()` request silently caps at ~1000 rows regardless of the value
// passed, so this pages through in batches to cover the full population (a
// dense make would otherwise be undersampled, skewing the median). Computed
// AT MOST ONCE per cron run via the memoized getter below — non-fatal; any
// failure just means samples render with no comp line (see `toDigestSample`).
async function fetchAircraftFamilyPriceMap(
  supabase: ReturnType<typeof createAdminClient>
): Promise<Map<string, number[]>> {
  const rows: { make: string | null; model: string | null; asking_price: number | null }[] = []
  let offset = 0
  const batchSize = 1000
  try {
    for (;;) {
      const { data, error } = await supabase
        .from('aircraft_for_sale')
        .select('make, model, asking_price')
        .eq('status', 'active')
        .gte('asking_price', PARTS_PRICE_FLOOR)
        .range(offset, offset + batchSize - 1)
      if (error || !data) break
      rows.push(...data)
      if (data.length < batchSize) break
      offset += batchSize
    }
  } catch (err) {
    console.error('[alert-digest] family price map fetch error:', err)
    return new Map()
  }
  return buildFamilyPriceMap(rows)
}

/** Lazy, request-scoped memoization so a cron run whose due alerts never
 *  touch `fetchNewAircraftSamples` (e.g. all partnership/seeker alerts, or
 *  an aircraft alert with zero new matches) never pays for this fetch. */
function familyPriceMapGetter(supabase: ReturnType<typeof createAdminClient>): () => Promise<Map<string, number[]>> {
  let cached: Promise<Map<string, number[]>> | null = null
  return () => {
    if (!cached) cached = fetchAircraftFamilyPriceMap(supabase)
    return cached
  }
}

/** Up to `limit` real, newly-listed aircraft matching `target` since `since`,
 *  for the digest email's preview cards. Mirrors `countNewAircraft`'s filters.
 *  `getFamilyPriceMap`, when passed, attaches an honest "vs market" comp line
 *  to each sample (see `toDigestSample`) — omitted entirely (no fetch, no
 *  line) by callers that don't want the comp context, e.g. price-drop
 *  samples, which already show a before/after price. */
async function fetchNewAircraftSamples(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  since: string,
  limit = MAX_DIGEST_SAMPLES,
  getFamilyPriceMap?: () => Promise<Map<string, number[]>>
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
  if (target.avionics && target.avionics.length > 0) {
    const ids = await fetchAvionicsMatchIds(supabase, target.avionics, PARTS_PRICE_FLOOR)
    if (ids.length === 0) return []
    q = q.in('id', ids)
  }

  const { data, error } = await q
  if (error) {
    console.error('[alert-digest] new-aircraft sample error:', error.message)
    return []
  }
  const rows = (data ?? []) as AircraftSampleRow[]
  const narrowed = target.dealOnly ? await filterToGoodDeals(supabase, rows as any[]) : rows
  const familyPriceMap = getFamilyPriceMap ? await getFamilyPriceMap() : null
  // Lead with the biggest honest below-market deal rather than always
  // whatever listed most recently — pure re-sort of the already-fetched
  // candidates, no widening of the query (see rankSamplesByDealQuality).
  const ranked = familyPriceMap
    ? rankSamplesByDealQuality(narrowed as AircraftSampleRow[], (row) => compVsMarket(row, familyPriceMap))
    : (narrowed as AircraftSampleRow[])
  return ranked.slice(0, limit).map((row) => toDigestSample(row, undefined, familyPriceMap))
}

/** Up to `limit` real aircraft matching `target` whose most recent price
 *  change was a genuine decrease since `since` — same candidate set
 *  `countRecentAircraftPriceDrops` counts, widened to the columns the digest
 *  email's preview cards need (photo/year/TTAF/location + before/after price). */
async function fetchAircraftPriceDropSamples(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  since: string,
  limit = MAX_DIGEST_SAMPLES,
  // Unused — accepted only so this shares a call signature with
  // `fetchNewAircraftSamples` for the `aircraftFetch` union call sites below.
  // A price-drop sample already shows a before/after price, so it doesn't
  // get the "vs market" comp line (see the spec's out-of-scope note).
  _getFamilyPriceMap?: () => Promise<Map<string, number[]>>
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
  if (target.avionics && target.avionics.length > 0) {
    const ids = await fetchAvionicsMatchIds(supabase, target.avionics, PARTS_PRICE_FLOOR)
    if (ids.length === 0) return []
    q = q.in('id', ids)
  }

  type Row = Omit<AircraftSampleRow, 'previous_price'> & {
    previous_price: number | null
    price_changed_at: string | null
  }
  const { data, error } = (await q) as { data: Row[] | null; error: { message: string } | null }
  if (error) {
    console.error('[alert-digest] price-drop sample error:', error.message)
    return []
  }
  const dropped = (data ?? []).filter((r) => hasRecentPriceDrop(r, since) && isMeaningfulPriceDrop(r))
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
 *
 * `targetPrice` (optional) narrows a genuine drop further: the subscriber only
 * gets emailed once the CURRENT price is at or below their threshold, not on
 * every drop no matter how small. A drop that stays above the target is
 * treated as `dropped: false` this pass — it fires the moment a later drop
 * clears the threshold, never retroactively without an actual price change.
 */
async function resolveListingWatch(
  supabase: ReturnType<typeof createAdminClient>,
  listingId: string,
  since: string,
  targetPrice?: number | null
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
  if (targetPrice != null && (data.asking_price == null || data.asking_price > targetPrice)) {
    return { kind: 'active', dropped: false }
  }
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
    id: row.id,
    type: 'partnership',
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
  q = applyPartnershipModelFilter(q, target.model)
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
  q = applyPartnershipModelFilter(q, target.model)
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
    .filter((r) => {
      const drop = { previous_price: r.previous_buy_in_price, asking_price: r.buy_in_price, price_changed_at: r.buy_in_price_changed_at }
      return hasRecentPriceDrop(drop, since) && isMeaningfulPriceDrop(drop)
    })
    .slice(0, limit)
    .map((row) => toPartnershipDigestSample(row, row.previous_buy_in_price))
}

/**
 * Resolve a `listingId`-scoped "watch this partnership" target — the
 * partnership counterpart of `resolveListingWatch` above. Same honesty gate:
 * a row that's gone or no longer `status: 'active'` reports `unavailable`
 * (one honest notice, then pause) instead of going silently quiet forever; a
 * query error is treated as "nothing to report this pass," never a
 * fabricated removal.
 *
 * `previous_buy_in_price`/`buy_in_price_changed_at` are the same
 * pending-migration column pair `countRecentPartnershipPriceDrops` already
 * degrades gracefully on — this retries without them on that specific
 * column error (same precedent as `countNewSeekers`'s `additional_airports`
 * retry) so availability still resolves correctly even before the migration
 * lands; it just can't report a drop until then.
 *
 * `targetPrice` (optional) mirrors `resolveListingWatch`'s threshold: a
 * genuine buy-in drop only fires once the CURRENT buy-in is at or below it.
 */
async function resolvePartnershipWatch(
  supabase: ReturnType<typeof createAdminClient>,
  partnershipId: string,
  since: string,
  targetPrice?: number | null
): Promise<ListingWatchResult> {
  const fullCols =
    'id, make, model, year, buy_in_price, previous_buy_in_price, buy_in_price_changed_at, share_type, images, home_airport, city, state, status'
  const baseCols = 'id, make, model, year, buy_in_price, share_type, images, home_airport, city, state, status'

  type Row = PartnershipSampleRow & {
    status: string | null
    previous_buy_in_price?: number | null
    buy_in_price_changed_at?: string | null
  }

  let { data, error } = (await supabase
    .from('partnerships')
    .select(fullCols)
    .eq('id', partnershipId)
    .maybeSingle()) as { data: Row | null; error: { message: string } | null }

  if (error && (error.message?.includes('previous_buy_in_price') || error.message?.includes('buy_in_price_changed_at'))) {
    ;({ data, error } = (await supabase
      .from('partnerships')
      .select(baseCols)
      .eq('id', partnershipId)
      .maybeSingle()) as { data: Row | null; error: { message: string } | null })
  }

  if (error) {
    console.error('[alert-digest] partnership-watch lookup error:', error.message)
    return { kind: 'active', dropped: false }
  }

  if (!data || data.status !== 'active') {
    const title = data ? [data.year, data.make, data.model].filter(Boolean).join(' ') || 'This partnership' : 'This partnership'
    const browseUrl = data?.make ? `${SITE_URL}/partnerships?${new URLSearchParams({ make: data.make }).toString()}` : `${SITE_URL}/partnerships`
    return { kind: 'unavailable', title, browseUrl }
  }

  if (data.previous_buy_in_price == null || data.buy_in_price_changed_at == null) return { kind: 'active', dropped: false }
  const dropInput = {
    previous_price: data.previous_buy_in_price,
    asking_price: data.buy_in_price,
    price_changed_at: data.buy_in_price_changed_at,
  }
  if (!hasRecentPriceDrop(dropInput, since)) return { kind: 'active', dropped: false }
  if (targetPrice != null && (data.buy_in_price == null || data.buy_in_price > targetPrice)) {
    return { kind: 'active', dropped: false }
  }
  return { kind: 'active', dropped: true, sample: toPartnershipDigestSample(data, data.previous_buy_in_price) }
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
    id: row.id,
    type: 'seeker',
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

// ─── Stranded-pending confirm reminder ─────────────────────────────────────────

type PendingReminderRow = {
  id: string
  email: string
  context: string | null
  source_path: string | null
  confirm_token: string | null
  unsubscribe_token: string | null
}

/**
 * A subscriber who signs up but never clicks the double-opt-in confirm link
 * gets nothing, ever — the digest loop above only reads the live statuses
 * ('confirmed'/'active'), never 'pending'. Sends exactly ONE "still want
 * these alerts?" reminder to a status='pending'
 * row aged 24–72h since signup, reusing the existing buildAlertConfirmEmail
 * template + the row's own confirm/unsubscribe tokens (same send shape as the
 * manual "Resend confirmation" action in actions.ts, just cron-triggered).
 * Honesty/never-spam gate: if `confirm_reminder_sent_at` isn't migrated live
 * yet, this skips sending entirely — there'd be no way to mark a row
 * already-reminded, and risking a duplicate later beats not reminding at all.
 */
async function sendStrandedPendingReminders(
  supabase: ReturnType<typeof createAdminClient>,
  nowIso: string,
  pacer: SendPacer
): Promise<{ sent: number; failed: number }> {
  const { start, end } = reminderWindow(nowIso)

  const { data, error } = (await supabase
    .from('alerts')
    .select('id, email, context, source_path, confirm_token, unsubscribe_token')
    .eq('status', 'pending')
    .is('confirm_reminder_sent_at', null)
    .gte('created_at', start)
    .lte('created_at', end)) as { data: PendingReminderRow[] | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('confirm_reminder_sent_at')) {
      console.warn('[alert-digest] confirm_reminder_sent_at not migrated live yet — skipping pending reminders')
    } else {
      console.error('[alert-digest] pending-reminder fetch error:', error.message)
    }
    return { sent: 0, failed: 0 }
  }

  let remindersSent = 0
  let failed = 0
  for (const row of data ?? []) {
    if (!row.confirm_token || !row.unsubscribe_token) continue

    const confirmUrl = `${SITE_URL}/api/alerts/confirm?token=${row.confirm_token}`
    const manageUrl = `${SITE_URL}/alerts/manage?token=${row.unsubscribe_token}`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${row.unsubscribe_token}`
    const preview = await getAlertDigestPreview(row.source_path ?? null)
    const { subject, html, text } = buildAlertConfirmEmail({
      context: row.context ?? null,
      confirmUrl,
      manageUrl,
      unsubscribeUrl,
      preview: preview ? { count: preview.count, samples: preview.samples } : null,
    })

    const gate = await pacer.send(() =>
      sendEmail({ to: row.email, subject, html, text, unsubscribeUrl, emailType: 'alert-confirm' })
    )
    if (!gate.attempted) continue
    if (gate.value.sent || gate.value.reason === 'no-key') {
      await supabase
        .from('alerts')
        .update({ confirm_reminder_sent_at: new Date().toISOString() })
        .eq('id', row.id)
      remindersSent++
    } else {
      failed++
    }
  }
  return { sent: remindersSent, failed }
}

// ─── Digest-sent bookkeeping ────────────────────────────────────────────────

/**
 * Stamps `last_digest_at` AND increments each row's own `digest_sends_count`
 * (the real-send counter `getDormantSubscribers` gates on) in one update per
 * row — can't bulk-increment a per-row counter via a single `.in('id', ...)`
 * update, since each row starts from a different current count. If
 * `digest_sends_count` isn't migrated live yet, retries without it so the
 * pre-existing `last_digest_at` stamp is never blocked by the new column
 * (same graceful-fallback precedent as every other `alerts.*` column).
 */
async function markDigestSent(
  supabase: ReturnType<typeof createAdminClient>,
  rows: { id: string; digest_sends_count?: number }[],
  nowIso: string
): Promise<void> {
  for (const row of rows) {
    const payload: Record<string, unknown> = {
      last_digest_at: nowIso,
      digest_sends_count: (row.digest_sends_count ?? 0) + 1,
    }
    let { error } = await supabase.from('alerts').update(payload).eq('id', row.id)
    if (error?.message?.includes('digest_sends_count')) {
      delete payload.digest_sends_count
      ;({ error } = await supabase.from('alerts').update(payload).eq('id', row.id))
    }
    if (error) {
      console.error('[alert-digest] markDigestSent update error:', error.message)
    }
  }
}

// ─── One-time "widen your alert?" email for never-matched alerts ──────────────

const WIDEN_SUGGESTION_MIN_AGE_MS = 21 * 24 * 60 * 60 * 1000

type WidenCandidateRow = {
  id: string
  email: string
  context: string | null
  source_path: string | null
  confirmed_at: string | null
  created_at: string
  unsubscribe_token: string | null
}

/**
 * A confirmed alert that has NEVER matched anything (last_digest_at stays
 * null forever — the digest loop above only stamps it on a real send) is
 * silent churn: the subscriber gets nothing, ever, with no feedback loop.
 * Sends exactly ONE "hasn't matched yet, widen it?" suggestion, reusing the
 * same `computeWidenCandidate` one-step loosening `/alerts/manage`'s nudge
 * uses — re-verified against BOTH a real live 0-match count on the current
 * search AND a real live >0-match count on the widened search before ever
 * sending (never a guess). Guarded by the additive
 * `alerts.widen_suggested_at` column so it can never repeat; if that column
 * isn't migrated live yet, this skips sending entirely (same fail-soft
 * precedent as `sendStrandedPendingReminders`).
 */
async function sendWidenSuggestionEmails(
  supabase: ReturnType<typeof createAdminClient>,
  nowIso: string,
  pacer: SendPacer
): Promise<{ sent: number; failed: number }> {
  const cutoff = new Date(new Date(nowIso).getTime() - WIDEN_SUGGESTION_MIN_AGE_MS).toISOString()

  const { data, error } = (await supabase
    .from('alerts')
    .select('id, email, context, source_path, confirmed_at, created_at, unsubscribe_token')
    .in('status', ['confirmed', 'active'])
    .is('last_digest_at', null)
    .is('widen_suggested_at', null)
    .lte('confirmed_at', cutoff)) as { data: WidenCandidateRow[] | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('widen_suggested_at')) {
      console.warn('[alert-digest] widen_suggested_at not migrated live yet — skipping widen suggestions')
    } else {
      console.error('[alert-digest] widen-suggestion fetch error:', error.message)
    }
    return { sent: 0, failed: 0 }
  }

  let widenSuggestionsSent = 0
  let failed = 0
  for (const row of data ?? []) {
    if (!row.unsubscribe_token) continue

    const target = parseEditableAlertTarget(row.source_path)
    if (!target) continue
    const candidate = computeWidenCandidate(target)
    if (!candidate) continue

    const currentMatch = await getAlertMatchCount(row.source_path)
    if (!currentMatch || currentMatch.count > 0) continue // no longer dead — don't suggest

    const { sourcePath: widenedPath } = buildAlertCriteriaUpdate(target.type, row.source_path, candidate.fields)
    const widenedMatch = await getAlertMatchCount(widenedPath)
    if (!widenedMatch || widenedMatch.count <= 0) continue // no real fix available — stay silent, never guess

    const manageUrl = `${SITE_URL}/alerts/manage?token=${row.unsubscribe_token}`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${row.unsubscribe_token}`
    const { subject, html, text } = buildWidenSuggestionEmail({
      context: row.context,
      widenDescription: candidate.description,
      widenCount: widenedMatch.count,
      widenNoun: widenedMatch.noun,
      manageUrl,
      unsubscribeUrl,
    })

    const gate = await pacer.send(() =>
      sendEmail({ to: row.email, subject, html, text, unsubscribeUrl, emailType: 'widen-suggestion' })
    )
    if (!gate.attempted) continue
    if (gate.value.sent || gate.value.reason === 'no-key') {
      await supabase
        .from('alerts')
        .update({ widen_suggested_at: new Date().toISOString() })
        .eq('id', row.id)
      widenSuggestionsSent++
    } else {
      failed++
    }
  }
  return { sent: widenSuggestionsSent, failed }
}

// Digest email cross-sell (GOAL.md's "digest → manage → grow loop" — the same
// one-click suggestion `/alerts/manage` already offers, reaching subscribers
// who never click back into the site). Tries each due alert's source_path (in
// send order) until one yields a suggestion the subscriber isn't already
// subscribed to — re-checked against their *live* confirmed alerts (not just
// the alerts due in this pass), same honesty gate as `/alerts/manage`'s
// cross-sell. At most one suggestion per email either way, matching the
// digest's own "never spam" rule.
async function getDigestCrossSell(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  candidateSourcePaths: (string | null)[]
) {
  const { data } = await supabase.from('alerts').select('source_path').eq('email', email).eq('status', 'confirmed')
  const existingPaths = new Set((data ?? []).map((r) => r.source_path).filter(Boolean))
  for (const path of candidateSourcePaths) {
    const suggestion = await getCrossSellSuggestion(path)
    if (suggestion && !existingPaths.has(suggestion.sourcePath)) return suggestion
  }
  return null
}

// ─── One-time "still want these?" re-permission email for dormant addresses ──

/**
 * Sends `buildRepermissionEmail` to each address `getDormantSubscribers`
 * flags (long-confirmed, well-sent, never opened/clicked), stamping
 * `repermission_sent_at` on success so it can never repeat. Mirrors
 * `sendWidenSuggestionEmails`'s shape/fail-soft posture; the eligibility
 * query itself already returns `[]` whenever the gating columns or the
 * engagement table aren't migrated/live yet.
 */
async function sendDormantSubscriberRepermissionEmails(
  supabase: ReturnType<typeof createAdminClient>,
  nowIso: string,
  pacer: SendPacer
): Promise<{ sent: number; failed: number }> {
  const candidates = await getDormantSubscribers(nowIso)
  let sentCount = 0
  let failed = 0
  for (const row of candidates) {
    if (!row.unsubscribe_token) continue
    const manageUrl = `${SITE_URL}/alerts/manage?token=${row.unsubscribe_token}`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${row.unsubscribe_token}`
    const { subject, html, text } = buildRepermissionEmail({ context: row.context, manageUrl, unsubscribeUrl })

    const gate = await pacer.send(() =>
      sendEmail({ to: row.email, subject, html, text, unsubscribeUrl, emailType: 'repermission' })
    )
    if (!gate.attempted) continue
    if (gate.value.sent || gate.value.reason === 'no-key') {
      let { error } = await supabase.from('alerts').update({ repermission_sent_at: nowIso }).eq('id', row.id)
      if (error) console.error('[alert-digest] repermission_sent_at stamp error:', error.message)
      sentCount++
    } else {
      failed++
    }
  }
  return { sent: sentCount, failed }
}

// ─── "Back on the market" resume for auto-paused listing-watch alerts ────────

type BackOnMarketCandidateRow = {
  id: string
  email: string
  source_path: string | null
  unsubscribe_token: string | null
}

/**
 * Paused watch alerts the cron itself auto-paused because their target went
 * unavailable — `unavailable_notified_at IS NOT NULL` is exactly what tells
 * those apart from a user-initiated pause (pauseAlert/snoozeAlert never set
 * this column). Fails soft to `[]` if the column isn't migrated live yet,
 * same graceful-fallback convention as every other `alerts.*` column.
 */
async function getBackOnMarketCandidates(supabase: ReturnType<typeof createAdminClient>): Promise<BackOnMarketCandidateRow[]> {
  const { data, error } = (await supabase
    .from('alerts')
    .select('id, email, source_path, unsubscribe_token')
    .eq('status', 'paused')
    .not('unavailable_notified_at', 'is', null)) as {
    data: BackOnMarketCandidateRow[] | null
    error: { message: string } | null
  }
  if (error) {
    if (!error.message?.includes('unavailable_notified_at')) {
      console.error('[alert-digest] back-on-market fetch error:', error.message)
    }
    return []
  }
  return data ?? []
}

/** Is this specific aircraft/partnership row `status: 'active'` again? Never
 *  guesses on a query error or a missing row — both simply mean "not
 *  confirmed active," so the caller correctly leaves the watch paused. */
async function resolveBackOnMarket(
  supabase: ReturnType<typeof createAdminClient>,
  noun: 'aircraft' | 'partnership',
  listingId: string
): Promise<{ title: string; url: string } | null> {
  const table = noun === 'aircraft' ? 'aircraft_for_sale' : 'partnerships'
  const { data, error } = await supabase.from(table).select('id, make, model, year, status').eq('id', listingId).maybeSingle()
  if (error || !data || data.status !== 'active') return null
  const fallbackTitle = noun === 'aircraft' ? 'This aircraft' : 'This partnership'
  const title = [data.year, data.make, data.model].filter(Boolean).join(' ') || fallbackTitle
  const url = noun === 'aircraft' ? `${SITE_URL}/aircraft/listing/${listingId}` : `${SITE_URL}/partnerships/${listingId}`
  return { title, url }
}

/**
 * Sends `buildListingBackOnMarketEmail` to every auto-paused watch alert
 * whose target listing is confirmed active again, then resumes the alert
 * (`status: 'confirmed'`, clears `unavailable_notified_at`, stamps
 * `last_digest_at` so the next due-check starts fresh from now). A
 * user-initiated pause is never touched — `getBackOnMarketCandidates` only
 * ever returns rows the cron itself auto-paused.
 */
async function sendBackOnMarketNotices(
  supabase: ReturnType<typeof createAdminClient>,
  nowIso: string,
  pacer: SendPacer
): Promise<{ sent: number; failed: number }> {
  const candidates = await getBackOnMarketCandidates(supabase)
  let sentCount = 0
  let failed = 0
  for (const row of candidates) {
    const target = parseSourcePath(row.source_path)
    if (!target || (target.type !== 'aircraft' && target.type !== 'partnership') || !target.listingId) continue
    const noun = target.type
    const resolved = await resolveBackOnMarket(supabase, noun, target.listingId)
    if (!resolved) continue

    const unsubToken = row.unsubscribe_token ?? ''
    const manageUrl = unsubToken ? `${SITE_URL}/alerts/manage?token=${unsubToken}` : `${SITE_URL}/alerts/manage`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`
    const { subject, html, text } = buildListingBackOnMarketEmail({
      title: resolved.title,
      listingUrl: resolved.url,
      manageUrl,
      unsubscribeUrl,
      noun,
    })

    const gate = await pacer.send(() =>
      sendEmail({ to: row.email, subject, html, text, unsubscribeUrl, emailType: 'listing-back-on-market' })
    )
    if (!gate.attempted) continue
    if (gate.value.sent || gate.value.reason === 'no-key') {
      const { error } = await supabase
        .from('alerts')
        .update({ status: 'confirmed', unavailable_notified_at: null, last_digest_at: nowIso })
        .eq('id', row.id)
      if (error) console.error('[alert-digest] back-on-market resume error:', error.message)
      sentCount++
    } else {
      failed++
    }
  }
  return { sent: sentCount, failed }
}

// ─── Cron handler ─────────────────────────────────────────────────────────────

/**
 * Monday-only admin alert-funnel week-over-week summary (GOAL.md: "judge
 * alerts week-over-week", the "prove it converts" pillar landing in the
 * inbox). Piggybacks this existing daily cron run instead of a new
 * `vercel.json` cron entry (Hobby-tier is daily-cron-only, already flagged
 * in the backlog). Computed and sent only after every alert above has
 * already been processed, and wrapped in try/catch so a summary-email
 * failure can never turn an otherwise-healthy digest run into a 500.
 */
async function sendMondayAdminFunnelSummary(nowIso: string, pacer: SendPacer): Promise<{ sent: number; failed: number }> {
  if (new Date(nowIso).getUTCDay() !== 1) return { sent: 0, failed: 0 }
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  if (adminEmails.length === 0) return { sent: 0, failed: 0 }

  try {
    const snapshot = await getAlertFunnelWeeklySnapshot()
    const { subject, html, text } = buildAdminAlertFunnelEmail(snapshot, `${SITE_URL}/admin/alerts`)
    let sentCount = 0
    let failed = 0
    for (const to of adminEmails) {
      const gate = await pacer.send(() => sendEmail({ to, subject, html, text, emailType: 'admin-alert-funnel-weekly' }))
      if (!gate.attempted) continue
      if (gate.value.sent || gate.value.reason === 'no-key') sentCount++
      else failed++
    }
    return { sent: sentCount, failed }
  } catch (err) {
    console.error('[alert-digest] Monday admin funnel summary error:', err)
    return { sent: 0, failed: 0 }
  }
}

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
  // Memoized so this run fetches the family price map (for the digest
  // sample's honest "vs market" comp line) at most once total, and only if
  // some due alert actually needs it — most cron runs have zero due aircraft
  // new-listing alerts most days.
  const getFamilyPriceMap = familyPriceMapGetter(supabase)
  const runStartMs = Date.now()
  // ONE pacer shared by every send loop below — its elapsed-time clock (and
  // therefore its stop point) spans the whole run, not just one loop, so it
  // actually protects the route's `maxDuration = 60` ceiling.
  const pacer = new SendPacer(runStartMs)
  const nowIso = new Date().toISOString()
  const minWindowStart = new Date(Date.now() - MIN_DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Auto-resume snoozed alerts whose "Snooze 30 days" date has passed (GOAL.md:
  // a real resume, not "we'll check back soon") before the due-alert fetch
  // below, so a just-resumed row can be picked up in this same pass. No-ops
  // gracefully (logs + continues) if `paused_until`/`paused_at` isn't migrated
  // live yet — every snoozed alert simply stays paused until a human applies
  // it, same as every other pending `alerts.*` column.
  const { error: resumeError } = await supabase
    .from('alerts')
    .update({ status: 'confirmed', paused_until: null, paused_at: null })
    .eq('status', 'paused')
    .not('paused_until', 'is', null)
    .lte('paused_until', nowIso)
  if (resumeError && !resumeError.message?.includes('paused_until') && !resumeError.message?.includes('paused_at')) {
    console.error('[alert-digest] snooze auto-resume error:', resumeError.message)
  }

  const remindersResult = await sendStrandedPendingReminders(supabase, nowIso, pacer)
  const widenResult = await sendWidenSuggestionEmails(supabase, nowIso, pacer)
  const remindersSent = remindersResult.sent
  const widenSuggestionsSent = widenResult.sent
  let sendFailures = remindersResult.failed + widenResult.failed

  type DigestAlertRow = {
    id: string
    email: string
    context: string | null
    source_path: string | null
    created_at: string
    last_digest_at: string | null
    unsubscribe_token: string | null
    price_drop_opt_in?: boolean
    new_listing_opt_out?: boolean
    frequency?: string
    target_price?: number | null
    digest_day?: number | null
    digest_sends_count?: number
  }

  // Coarse pre-filter: any alert that could possibly be due, at ANY chosen
  // frequency, must have gone undigested for at least the shortest interval
  // (daily). The precise per-alert due-check (respecting each alert's own
  // weekly/daily choice) happens in the loop below via isDigestDue.
  //
  // `status` selects BOTH live-subscriber vocabularies the `alerts` table
  // carries — `confirmed` (the double-opt-in path) and the older/direct
  // `active` rows that predate it — same precedent as `alertScoreboard.ts`'s
  // `LIVE_STATUSES`. Filtering to `confirmed` alone silently drops real
  // subscribers on legacy rows from every digest, forever.
  const LIVE_ALERT_STATUSES = ['confirmed', 'active']
  const baseCols = 'id, email, context, source_path, created_at, last_digest_at, unsubscribe_token'
  const DIGEST_OPTIONAL_COLS = [
    'price_drop_opt_in',
    'new_listing_opt_out',
    'frequency',
    'target_price',
    'digest_day',
    'digest_sends_count',
  ]
  let cols = `${baseCols}, ${DIGEST_OPTIONAL_COLS.join(', ')}`
  let { data: alerts, error: fetchError } = (await supabase
    .from('alerts')
    .select(cols)
    .in('status', LIVE_ALERT_STATUSES)
    .or(`last_digest_at.is.null,last_digest_at.lt.${minWindowStart}`)) as unknown as {
    data: DigestAlertRow[] | null
    error: { message: string } | null
  }

  // Any subset of price_drop_opt_in/new_listing_opt_out/frequency/target_price/
  // digest_day may not be migrated live yet — retry without whichever column(s)
  // the error names (PostgREST reports one unknown column per error, so this
  // can take up to five passes) rather than breaking the whole send run; every
  // alert is then treated as opted-in / not-opted-out / weekly / no-target /
  // no-day-preference below, each
  // column's own default (current behavior).
  for (
    let i = 0;
    i < DIGEST_OPTIONAL_COLS.length && fetchError && DIGEST_OPTIONAL_COLS.some((c) => fetchError!.message?.includes(c));
    i++
  ) {
    cols = cols
      .split(', ')
      .filter((c) => !fetchError!.message.includes(c))
      .join(', ')
    ;({ data: alerts, error: fetchError } = (await supabase
      .from('alerts')
      .select(cols)
      .in('status', LIVE_ALERT_STATUSES)
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
    /** Honest "N {Make} {Model}s listed right now, median asking $X" line —
     *  aircraft alerts with a clean make+model target only; `null` otherwise
     *  or when the family is too sparse to trust a median (see
     *  `getMarketPulseLine`). Never set for the listing-watch push()es below
     *  (rich single-listing templates, not the aggregate digest). */
    marketPulse: string | null
  }
  const prepared: Prepared[] = []
  // Listing-watch alerts whose target has left `status: 'active'` — handled
  // entirely outside the grouped new/drop-count flow above (see the honesty
  // gate note where these are sent, after the main grouped-send loop below).
  const unavailableWatches: { alert: DigestAlertRow; title: string; browseUrl: string; noun: 'aircraft' | 'partnership' }[] = []

  for (const alert of alerts ?? []) {
    const frequency = normalizeFrequency(alert.frequency)
    if (!isDigestDue(alert.last_digest_at, frequency, nowIso, alert.digest_day)) {
      notDue++
      continue
    }

    const target = parseSourcePath(alert.source_path)
    if (!target) {
      unparseable++
      continue
    }
    if (target.type === 'aircraft' && target.icao) {
      await resolveAircraftAirportState(supabase, target)
    }

    // "Since when?" — use last_digest_at if present; else the signup date.
    const since = alert.last_digest_at ?? alert.created_at ?? minWindowStart

    if (target.type === 'aircraft' && target.listingId) {
      const watch = await resolveListingWatch(supabase, target.listingId, since, alert.target_price)
      if (watch.kind === 'unavailable') {
        unavailableWatches.push({ alert, title: watch.title, browseUrl: watch.browseUrl, noun: 'aircraft' })
        continue
      }
      if (!watch.dropped) {
        skipped++
        continue
      }
      // A genuine drop on the watched row — same shape (newCount 0, dropCount
      // 1, one sample) the grouped single-alert send loop below already knows
      // how to route to buildPriceDropEmail; no further special-casing needed.
      prepared.push({ alert, frequency, target, newCount: 0, dropCount: 1, samples: [watch.sample!], marketPulse: null })
      continue
    }

    if (target.type === 'partnership' && target.listingId) {
      const watch = await resolvePartnershipWatch(supabase, target.listingId, since, alert.target_price)
      if (watch.kind === 'unavailable') {
        unavailableWatches.push({ alert, title: watch.title, browseUrl: watch.browseUrl, noun: 'partnership' })
        continue
      }
      if (!watch.dropped) {
        skipped++
        continue
      }
      prepared.push({ alert, frequency, target, newCount: 0, dropCount: 1, samples: [watch.sample!], marketPulse: null })
      continue
    }

    // Drops-only mode ("Drops only" on /alerts/manage's mode toggle) is
    // aircraft-only, same scope as price_drop_opt_in below — mutes new-listing
    // matching entirely rather than just adding drops on top of it. Skips the
    // countNew query too, not just the send, when opted out.
    const newListingOptOut = target.type === 'aircraft' && (alert.new_listing_opt_out ?? false)
    const newCount = newListingOptOut ? 0 : await countNew(supabase, target, since)
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
          : target.type === 'all'
            ? (await countRecentAircraftPriceDrops(supabase, { type: 'aircraft' }, since)) +
              (await countRecentPartnershipPriceDrops(supabase, { type: 'partnership' }, since))
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
          ? await fetchNewAircraftSamples(supabase, target, since, MAX_DIGEST_SAMPLES, getFamilyPriceMap)
          : await fetchAircraftPriceDropSamples(supabase, target, since)
        : target.type === 'partnership'
          ? newCount > 0
            ? await fetchNewPartnershipSamples(supabase, target, since)
            : await fetchPartnershipPriceDropSamples(supabase, target, since)
          : target.type === 'all'
            ? await (async () => {
                // Fill from aircraft first, top up with partnerships only if
                // needed — avoids a wasted query once aircraft alone fills
                // the digest's sample cap.
                const aircraftFetch = newCount > 0 ? fetchNewAircraftSamples : fetchAircraftPriceDropSamples
                const partnershipFetch = newCount > 0 ? fetchNewPartnershipSamples : fetchPartnershipPriceDropSamples
                const aircraftSamples = await aircraftFetch(supabase, { type: 'aircraft' }, since, MAX_DIGEST_SAMPLES, getFamilyPriceMap)
                if (aircraftSamples.length >= MAX_DIGEST_SAMPLES) return aircraftSamples
                const partnershipSamples = await partnershipFetch(
                  supabase,
                  { type: 'partnership' },
                  since,
                  MAX_DIGEST_SAMPLES - aircraftSamples.length
                )
                return [...aircraftSamples, ...partnershipSamples]
              })()
            : newCount > 0
              ? await fetchNewSeekerSamples(supabase, target, since)
              : []

    // Market-pulse line — aircraft alerts with a clean, curated make+model
    // target get the make+model line; aircraft alerts with a make but no
    // clean single model (make-only browse alerts, multi-model selections —
    // see `marketPulseModel`'s doc) fall back to the make-level line instead
    // of getting none at all; partnership alerts with a make get their own
    // make-level line (see `getPartnershipMarketPulseLine`'s doc for why
    // partnerships are make-level only). Computed only for alerts that will
    // actually send (past the newCount===0 && dropCount===0 skip above), so a
    // skipped alert never pays for the extra query.
    const marketPulse =
      target.type === 'aircraft' && target.make && target.marketPulseModel
        ? await getMarketPulseLine(
            supabase,
            target.make,
            target.marketPulseModel,
            target.modelPattern ?? target.model ?? target.marketPulseModel,
            target.notModelPattern
          )
        : target.type === 'aircraft' && target.make
          ? await getAircraftMakePulseLine(supabase, target.make)
          : target.type === 'partnership' && target.make
            ? await getPartnershipMarketPulseLine(supabase, target.make)
            : null

    const samplesWithWatch = await attachWatchLinks(supabase, alert.email, alert.unsubscribe_token ?? null, samples)

    prepared.push({ alert, frequency, target, newCount, dropCount, samples: samplesWithWatch, marketPulse })
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
      const { alert, frequency, target, newCount, dropCount, samples, marketPulse } = group[0]

      const unsubToken = alert.unsubscribe_token ?? ''
      const listingsUrl = `${SITE_URL}${alert.source_path ?? '/aircraft'}`
      // Plain (non-tokenized) link so a forwarded email can't leak manage/
      // unsubscribe control — see withShareParam's doc. Omitted when there's
      // no source_path to share.
      const shareUrl = alert.source_path ? `${SITE_URL}${withShareParam(alert.source_path)}` : undefined
      // Token-scoped so an email-only subscriber (no account) can actually manage
      // alerts from this link instead of hitting the sign-in wall — see
      // /alerts/manage's token-scoped path. Falls back to the bare URL for the
      // rare row with no token yet (pre-migration).
      const manageUrl = unsubToken ? `${SITE_URL}/alerts/manage?token=${unsubToken}` : `${SITE_URL}/alerts/manage`
      const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`
      // Same token, points at the "view in browser" live-matches page — see
      // buildAlertDigestEmail's `viewUrl` doc. Omitted for a not-yet-migrated
      // row with no token yet, same graceful-degrade as manageUrl.
      const viewUrl = unsubToken ? `${SITE_URL}/alerts/digest/view?token=${unsubToken}` : undefined
      // Offer "fewer emails" for a daily-cadence alert (→ weekly, the default
      // `dir`) or a weekly-cadence alert (→ monthly) — a monthly one already
      // has no lighter cadence left to switch to.
      const frequencyUrl =
        unsubToken && frequency !== 'monthly'
          ? `${SITE_URL}/api/alerts/frequency?token=${unsubToken}${frequency === 'weekly' ? '&dir=monthly' : ''}`
          : undefined
      const frequencyTarget: 'weekly' | 'monthly' = frequency === 'weekly' ? 'monthly' : 'weekly'
      // Token-scoped "snooze 30 days" link — ladder parity with frequencyUrl,
      // a real pause with an end date instead of only a lighter cadence. See
      // /api/alerts/snooze; same no-token graceful-degrade as frequencyUrl.
      const snoozeUrl = unsubToken ? `${SITE_URL}/api/alerts/snooze?token=${unsubToken}` : undefined
      // One-click "switch to daily" upgrade nudge — only for a genuinely busy
      // weekly digest (see `shouldOfferDailyUpgrade`); never an upsell on a
      // quiet search. Scoped to the aggregate digest template only, same as
      // `frequencyUrl` above.
      const upgradeUrl =
        unsubToken && shouldOfferDailyUpgrade(frequency, newCount + dropCount)
          ? `${SITE_URL}/api/alerts/frequency?token=${unsubToken}&dir=daily`
          : undefined
      // One-click "was this digest useful?" footer links — see the
      // digest-feedback route. Only the aggregate digest template offers
      // these (matches the crossSell precedent just below). Also the shared
      // base for each sample's own "Not relevant?" link (see
      // notRelevantLink in email.ts) — same token, no vote param yet.
      const digestFeedbackBaseUrl = unsubToken ? `${SITE_URL}/api/alerts/digest-feedback?token=${unsubToken}` : undefined
      const digestFeedbackUpUrl = digestFeedbackBaseUrl ? `${digestFeedbackBaseUrl}&vote=up` : undefined
      const digestFeedbackDownUrl = digestFeedbackBaseUrl ? `${digestFeedbackBaseUrl}&vote=down` : undefined

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

      // Only the aggregate digest template offers the cross-sell (see
      // buildAlertDigestEmail's `crossSell` opt) — the rich single-listing
      // price-drop template stays focused on the one drop it's already
      // featuring.
      const crossSell = !bestDrop && unsubToken ? await getDigestCrossSell(supabase, alert.email, [alert.source_path]) : null
      const crossSellOpt = crossSell
        ? {
            label: crossSell.label,
            acceptUrl: `${SITE_URL}/api/alerts/digest-cross-sell?token=${unsubToken}&context=${encodeURIComponent(crossSell.context)}&path=${encodeURIComponent(crossSell.sourcePath)}`,
          }
        : undefined

      const digestEmail = bestDrop
        ? buildPriceDropEmail({
            title: bestDrop.title,
            photoUrl: bestDrop.photoUrl,
            previousPrice: bestDrop.previousPrice as number,
            askingPrice: bestDrop.price as number,
            listingUrl: bestDrop.url,
            manageUrl,
            unsubscribeUrl,
            frequencyUrl,
            frequencyTarget,
            // Honesty: this is a daily/weekly cron send, never real-time —
            // never claim "just dropped".
            periodLabel: frequency === 'daily' ? 'yesterday' : frequency === 'monthly' ? 'this month' : 'this week',
            dropNoun: target.type === 'partnership' ? 'buy-in drop' : undefined,
            shareType: target.type === 'partnership' ? bestDrop.shareType : undefined,
            marketPulse: marketPulse ?? undefined,
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
            frequencyTarget,
            snoozeUrl,
            upgradeUrl,
            crossSell: crossSellOpt,
            marketPulse: marketPulse ?? undefined,
            digestFeedbackUpUrl,
            digestFeedbackDownUrl,
            digestFeedbackBaseUrl,
            shareUrl,
            viewUrl,
            // Honesty: name the real cadence instead of always "this week" —
            // same expression already used for the sibling bestDrop send above.
            periodLabel: frequency === 'daily' ? 'yesterday' : frequency === 'monthly' ? 'this month' : 'this week',
          })
      const { subject, html, text } = digestEmail

      if ('trimmedSamples' in digestEmail && digestEmail.trimmedSamples) {
        console.warn(
          `[alert-digest] digest HTML exceeded the Gmail-clip byte budget for alert ${alert.id} (${alert.email}) — trimmed ${digestEmail.trimmedSamples} sample card(s)`
        )
      }

      const gate = await pacer.send(() =>
        sendEmail({
          to: alert.email,
          subject,
          html,
          text,
          unsubscribeUrl,
          emailType: bestDrop ? 'price-drop' : 'alert-digest',
        })
      )

      if (gate.attempted && (gate.value.sent || gate.value.reason === 'no-key')) {
        // Update last_digest_at (+ digest_sends_count) so we don't re-send for the same window.
        await markDigestSent(supabase, [{ id: alert.id, digest_sends_count: alert.digest_sends_count }], new Date().toISOString())
        sent++
        emailsSent++
      }
      continue
    }

    // 2+ due, matching alerts for this email in the same pass — one combined
    // email, one section per alert, rather than one email per alert.
    // Each section's `samples` is fetched independently per-alert, so a
    // listing matching more than one of this subscriber's alerts (e.g.
    // "Cessna 182" + "all of TX") would otherwise render its card once per
    // matching section — dedupe so it shows once, attributed to its
    // first-matching section, with an honest "also matches" note. Never
    // touches newCount/dropCount — those stay the truthful per-alert totals.
    const sections: AlertDigestSection[] = dedupeDigestSectionSamples(
      group.map(({ alert, target, newCount, dropCount, samples, marketPulse }) => ({
        context: alert.context ?? null,
        newCount,
        dropCount,
        dropNoun: target.type === 'partnership' ? 'buy-in drop' : undefined,
        listingsUrl: `${SITE_URL}${alert.source_path ?? '/aircraft'}`,
        samples,
        marketPulse: marketPulse ?? undefined,
        // This alert's OWN token, not the combined comma-joined one — lets a
        // subscriber stop just this section instead of every alert in the
        // email (GOAL.md: "offer fewer instead of none"). Omitted for a
        // not-yet-migrated row with no token yet (fails soft, no dead link).
        stopUrl: alert.unsubscribe_token ? `${SITE_URL}/api/alerts/unsubscribe?token=${alert.unsubscribe_token}` : undefined,
        // Deep-links to this exact row on /alerts/manage with its edit form
        // pre-opened — same token this section's stopUrl already carries, so
        // no new ownership proof is needed.
        editUrl: alert.unsubscribe_token
          ? `${SITE_URL}/alerts/manage?token=${alert.unsubscribe_token}&edit=${alert.id}#alert-${alert.id}`
          : undefined,
        // Plain (non-tokenized) per-section share link — same precedent as
        // the single-alert send path above.
        shareUrl: alert.source_path ? `${SITE_URL}${withShareParam(alert.source_path)}` : undefined,
        // Same per-section token-scoped "view in browser" link as the
        // single-alert send path above.
        viewUrl: alert.unsubscribe_token ? `${SITE_URL}/alerts/digest/view?token=${alert.unsubscribe_token}` : undefined,
      }))
    )

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
    const email = group[0].alert.email

    // One suggestion for the whole combined email, tried across every
    // included alert's source_path (send order) — never spam with one per
    // section.
    const crossSell = firstToken
      ? await getDigestCrossSell(supabase, email, group.map((p) => p.alert.source_path))
      : null
    const crossSellOpt = crossSell
      ? {
          label: crossSell.label,
          acceptUrl: `${SITE_URL}/api/alerts/digest-cross-sell?token=${firstToken}&context=${encodeURIComponent(crossSell.context)}&path=${encodeURIComponent(crossSell.sourcePath)}`,
        }
      : undefined
    // Same one-click vote as the single-alert path — the first alert's token
    // is enough to resolve the responder's email (mirrors manageUrl above).
    const digestFeedbackBaseUrl = firstToken ? `${SITE_URL}/api/alerts/digest-feedback?token=${firstToken}` : undefined
    const digestFeedbackUpUrl = digestFeedbackBaseUrl ? `${digestFeedbackBaseUrl}&vote=up` : undefined
    const digestFeedbackDownUrl = digestFeedbackBaseUrl ? `${digestFeedbackBaseUrl}&vote=down` : undefined
    // Ladder parity with the single-alert digest's "Get fewer emails" link —
    // offered whenever at least one covered alert isn't already monthly (a
    // combined send can mix cadences, so `dir=step` on /api/alerts/frequency
    // steps each covered row down from its OWN current frequency instead of
    // one literal target for all of them). Omitted entirely once every
    // covered alert has already bottomed out at monthly, same "no lighter
    // rung left" gate the single-alert path applies.
    const frequencyUrl =
      allTokens && group.some((p) => p.frequency !== 'monthly')
        ? `${SITE_URL}/api/alerts/frequency?token=${allTokens}&dir=step`
        : undefined
    // Snoozing has no per-alert cadence to conflict over (unlike frequencyUrl's
    // step logic) — one link covers every token in the combined send at once.
    const snoozeUrl = allTokens ? `${SITE_URL}/api/alerts/snooze?token=${allTokens}` : undefined

    const { subject, html, text, trimmedSamples } = buildCombinedAlertDigestEmail({
      sections,
      manageUrl,
      unsubscribeUrl,
      frequencyUrl,
      snoozeUrl,
      crossSell: crossSellOpt,
      digestFeedbackUpUrl,
      digestFeedbackDownUrl,
      digestFeedbackBaseUrl,
    })

    if (trimmedSamples) {
      console.warn(
        `[alert-digest] combined digest HTML exceeded the Gmail-clip byte budget for ${email} (${group.length} alerts) — trimmed ${trimmedSamples} sample card(s)`
      )
    }

    const gate = await pacer.send(() => sendEmail({ to: email, subject, html, text, unsubscribeUrl, emailType: 'combined-digest' }))

    if (!gate.attempted) continue
    if (gate.value.sent || gate.value.reason === 'no-key') {
      const nowStamp = new Date().toISOString()
      await markDigestSent(
        supabase,
        group.map((p) => ({ id: p.alert.id, digest_sends_count: p.alert.digest_sends_count })),
        nowStamp
      )
      sent += group.length
      emailsSent++
    } else {
      sendFailures++
    }
  }

  // Listing-watch alerts whose target left `status: 'active'` this pass —
  // GOAL.md's honesty gate ("say so once rather than staying silent
  // forever"). Always its own dedicated email, even on the rare pass where
  // this same subscriber also has another alert due (bundling it into the
  // combined-digest template is a follow-up, not this slice) — and the alert
  // is paused right after sending so it's genuinely a one-time notice, not a
  // recurring one every future cron pass.
  for (const { alert, title, browseUrl, noun } of unavailableWatches) {
    const unsubToken = alert.unsubscribe_token ?? ''
    const manageUrl = unsubToken ? `${SITE_URL}/alerts/manage?token=${unsubToken}` : `${SITE_URL}/alerts/manage`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`
    // The watch relationship is dying right at the moment of proven high
    // intent (they watched ONE listing to the end) — offer a one-tap upgrade
    // into a whole-family alert instead of a passive "browse similar" link.
    // Same honesty-gated suggestion + de-dupe-against-existing-alerts helper
    // the regular digest's cross-sell uses (`getWatchCrossSell` resolves the
    // watched listing's real make/model and only suggests when there's a
    // genuine live match count).
    const crossSell = unsubToken ? await getDigestCrossSell(supabase, alert.email, [alert.source_path]) : null
    const crossSellOpt = crossSell
      ? {
          label: crossSell.label,
          acceptUrl: `${SITE_URL}/api/alerts/digest-cross-sell?token=${unsubToken}&context=${encodeURIComponent(crossSell.context)}&path=${encodeURIComponent(crossSell.sourcePath)}&source=watch_unavailable_email`,
        }
      : undefined
    const { subject, html, text } = buildListingUnavailableEmail({
      title,
      browseUrl,
      manageUrl,
      unsubscribeUrl,
      noun,
      crossSell: crossSellOpt,
    })

    const gate = await pacer.send(() =>
      sendEmail({ to: alert.email, subject, html, text, unsubscribeUrl, emailType: 'listing-unavailable' })
    )

    if (!gate.attempted) continue
    if (gate.value.sent || gate.value.reason === 'no-key') {
      const nowStamp = new Date().toISOString()
      // `unavailable_notified_at` is what lets sendBackOnMarketNotices (below)
      // tell this auto-pause apart from a user-initiated one — never dropped
      // silently, only retried away if genuinely unmigrated.
      let pausePayload: Record<string, unknown> = {
        status: 'paused',
        last_digest_at: nowStamp,
        paused_at: nowStamp,
        unavailable_notified_at: nowStamp,
      }
      const watchPauseOptionalKeys = ['paused_at', 'unavailable_notified_at']
      let { error: watchPauseError } = await supabase.from('alerts').update(pausePayload).eq('id', alert.id)
      // Not-yet-migrated DB (`paused_at`/`unavailable_notified_at` column missing) —
      // retry dropping whichever one the error names (order-independent, up to
      // once each) rather than leaving the alert stuck un-paused after the
      // one-time notice already sent.
      for (
        let i = 0;
        i < watchPauseOptionalKeys.length &&
        watchPauseError &&
        watchPauseOptionalKeys.some((k) => k in pausePayload && watchPauseError!.message?.includes(k));
        i++
      ) {
        const dropKey = watchPauseOptionalKeys.find((k) => k in pausePayload && watchPauseError!.message?.includes(k))!
        pausePayload = Object.fromEntries(Object.entries(pausePayload).filter(([k]) => k !== dropKey))
        ;({ error: watchPauseError } = await supabase.from('alerts').update(pausePayload).eq('id', alert.id))
      }
      sent++
      emailsSent++
    } else {
      sendFailures++
    }
  }

  const adminSummaryResult = await sendMondayAdminFunnelSummary(nowIso, pacer)
  const adminSummarySent = adminSummaryResult.sent
  sendFailures += adminSummaryResult.failed

  const repermissionResult = await sendDormantSubscriberRepermissionEmails(supabase, nowIso, pacer)
  const repermissionsSent = repermissionResult.sent
  sendFailures += repermissionResult.failed

  const backOnMarketResult = await sendBackOnMarketNotices(supabase, nowIso, pacer)
  const backOnMarketSent = backOnMarketResult.sent
  sendFailures += backOnMarketResult.failed

  const total = (alerts ?? []).length
  const deferredSends = pacer.deferredSends
  console.log(
    `[alert-digest] processed=${total} sent=${sent} emailsSent=${emailsSent} skipped=${skipped} unparseable=${unparseable} notDue=${notDue} remindersSent=${remindersSent} widenSuggestionsSent=${widenSuggestionsSent} adminSummarySent=${adminSummarySent} repermissionsSent=${repermissionsSent} backOnMarketSent=${backOnMarketSent} sendFailures=${sendFailures} deferredSends=${deferredSends}`
  )
  if (deferredSends > 0) {
    console.warn(
      `[alert-digest] ${deferredSends} send(s) deferred to the next run — approaching the 60s cron time budget. Each deferred alert/reminder stays due and is not marked sent.`
    )
  }

  // Health log for the /admin/alerts "Last run" panel (see alertCronHealth.ts). Fails
  // soft — a not-yet-migrated table (or any other insert error) never affects the real
  // digest send above, which has already completed by this point. `send_failures`/
  // `deferred_sends` may independently be un-migrated live — retry once without
  // whichever column the error names, same fail-soft pattern as every other column
  // on this table.
  const runLogRow: Record<string, number> = {
    processed: total,
    sent,
    emails_sent: emailsSent,
    skipped,
    unparseable,
    not_due: notDue,
    reminders_sent: remindersSent,
    widen_suggestions_sent: widenSuggestionsSent,
    duration_ms: Date.now() - runStartMs,
    send_failures: sendFailures,
    deferred_sends: deferredSends,
  }
  const runLogOptionalKeys = ['send_failures', 'deferred_sends']
  let { error: runLogError } = await supabase.from('alert_cron_runs').insert(runLogRow)
  for (
    let i = 0;
    i < runLogOptionalKeys.length && runLogError && runLogOptionalKeys.some((k) => k in runLogRow && runLogError!.message?.includes(k));
    i++
  ) {
    const dropKey = runLogOptionalKeys.find((k) => k in runLogRow && runLogError!.message?.includes(k))!
    delete runLogRow[dropKey]
    ;({ error: runLogError } = await supabase.from('alert_cron_runs').insert(runLogRow))
  }
  if (runLogError && !runLogError.message?.includes('alert_cron_runs')) {
    console.error('[alert-digest] run-log insert error:', runLogError.message)
  }

  return Response.json({
    processed: total,
    sent,
    emailsSent,
    skipped,
    unparseable,
    notDue,
    remindersSent,
    widenSuggestionsSent,
    adminSummarySent,
    repermissionsSent,
    sendFailures,
    deferredSends,
  })
}
