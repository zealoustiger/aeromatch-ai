import { createAdminClient } from './supabase-admin'
import { getStateBySlug, getMakeBySlug, getMakeModel, SITE_URL } from './seo'
import { matchesModelFilter } from './seekerModelFilter'
import { getAirportsWithinRadius } from './airports'
import { pickRealPhoto, getPlaceholderPhoto } from './aircraftPhotos'
import { formatShareType } from './utils'
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
      state?: string
      minPrice?: number
      maxPrice?: number
      minYear?: number
      maxYear?: number
      maxTt?: number
    }
  | { type: 'partnership'; make?: string; state?: string; icao?: string; radius?: number }
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
        state: g('state')?.toUpperCase(),
        minPrice: numOrUndef(g('min_price')),
        maxPrice: numOrUndef(g('max_price')),
        minYear: numOrUndef(g('min_year')),
        maxYear: numOrUndef(g('max_year')),
        maxTt: numOrUndef(g('max_tt')),
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

async function countActiveAircraft(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  excludeId?: string
): Promise<number> {
  let q = supabase
    .from('aircraft_for_sale')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)

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
  if (excludeId) q = q.neq('id', excludeId)

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
  excludeId?: string
): Promise<number> {
  let q = supabase.from('partnerships').select('id', { count: 'exact', head: true }).eq('status', 'active')

  if (target.make) q = q.ilike('make', `%${target.make}%`)
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
  target: Extract<AlertTarget, { type: 'seeker' }>
): Promise<number> {
  let q = supabase.from('partnership_seekers').select('id, preferred_models').eq('status', 'active')

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
 */
export async function getAlertMatchCount(
  sourcePath: string | null,
  opts?: { excludeId?: string }
): Promise<AlertMatchCount | null> {
  const target = parseSourcePath(sourcePath)
  if (!target) return null
  try {
    const admin = createAdminClient()
    if (target.type === 'aircraft') {
      return { count: await countActiveAircraft(admin, target, opts?.excludeId), noun: 'listing' }
    }
    if (target.type === 'seeker') {
      return { count: await countActiveSeekers(admin, target), noun: 'pilot' }
    }
    return { count: await countActivePartnerships(admin, target, opts?.excludeId), noun: 'listing' }
  } catch (err) {
    console.error('[alertMatchCounts] count error:', err instanceof Error ? err.message : err)
    return null
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
  if (target.state) q = q.eq('state', target.state)
  if (target.minPrice !== undefined) q = q.gte('asking_price', target.minPrice)
  if (target.maxPrice !== undefined) q = q.lte('asking_price', target.maxPrice)
  if (target.minYear !== undefined) q = q.gte('year', target.minYear)
  if (target.maxYear !== undefined) q = q.lte('year', target.maxYear)
  if (target.maxTt !== undefined) q = q.lte('ttaf', target.maxTt)

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
