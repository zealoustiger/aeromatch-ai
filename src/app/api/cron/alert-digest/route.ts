import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail, buildAlertDigestEmail, type AlertDigestSample } from '@/lib/email'
import { getStateBySlug, getMakeBySlug, getMakeModel, SEO_MAKE_MODELS } from '@/lib/seo'
import { SITE_URL } from '@/lib/seo'
import { matchesModelFilter } from '@/lib/seekerModelFilter'
import { hasRecentPriceDrop } from '@/lib/priceDrops'
import { intervalDaysFor, isDigestDue, normalizeFrequency } from '@/lib/alertFrequency'
import { pickRealPhoto, getPlaceholderPhoto } from '@/lib/aircraftPhotos'

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
    }
  | { type: 'partnership'; make?: string; state?: string; icao?: string }
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

// ─── Count new listings ───────────────────────────────────────────────────────

async function countNewAircraft(
  supabase: ReturnType<typeof createAdminClient>,
  target: Extract<AlertTarget, { type: 'aircraft' }>,
  since: string
): Promise<number> {
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
    .select('asking_price, previous_price, price_changed_at')
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .gte('price_changed_at', since)
    .not('previous_price', 'is', null)

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

  type Row = { asking_price: number | null; previous_price: number | null; price_changed_at: string | null }
  const { data, error } = (await q) as { data: Row[] | null; error: { message: string } | null }
  if (error) {
    console.error('[alert-digest] price-drop count error:', error.message)
    return 0
  }
  return (data ?? []).filter((r) => hasRecentPriceDrop(r, since)).length
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
  if (target.icao) q = q.eq('home_airport', target.icao)

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
  let q = supabase
    .from('aircraft_for_sale')
    .select('id, make, model, year, asking_price, images, location, ttaf')
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .gte('first_seen_at', since)
    .order('first_seen_at', { ascending: false })
    .limit(limit)

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

  const { data, error } = await q
  if (error) {
    console.error('[alert-digest] new-aircraft sample error:', error.message)
    return []
  }
  return (data ?? []).map((row) => toDigestSample(row as AircraftSampleRow))
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
    .select('id, make, model, year, asking_price, previous_price, images, location, ttaf, price_changed_at')
    .eq('status', 'active')
    .gte('asking_price', PARTS_PRICE_FLOOR)
    .gte('price_changed_at', since)
    .not('previous_price', 'is', null)
    .order('price_changed_at', { ascending: false })

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

  type Row = Omit<AircraftSampleRow, 'previous_price'> & {
    previous_price: number | null
    price_changed_at: string | null
  }
  const { data, error } = (await q) as { data: Row[] | null; error: { message: string } | null }
  if (error) {
    console.error('[alert-digest] price-drop sample error:', error.message)
    return []
  }
  return (data ?? [])
    .filter((r) => hasRecentPriceDrop(r, since))
    .slice(0, limit)
    .map((row) => toDigestSample(row, row.previous_price))
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

  let sent = 0
  let skipped = 0
  let unparseable = 0
  let notDue = 0

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

    const newCount = await countNew(supabase, target, since)
    // Price-drop matching only applies to aircraft-for-sale alerts today —
    // partnerships track price changes on a different column pair
    // (previous_buy_in_price/buy_in_price_changed_at) and seekers have no price.
    // `price_drop_opt_in` defaults to true (both at the DB level and here, when
    // the column isn't in the row because the migration hasn't landed yet).
    const priceDropOptIn = alert.price_drop_opt_in ?? true
    const dropCount =
      target.type === 'aircraft' && priceDropOptIn
        ? await countRecentAircraftPriceDrops(supabase, target, since)
        : 0

    if (newCount === 0 && dropCount === 0) {
      skipped++
      continue
    }

    // Real preview cards — aircraft alerts only (the only listing type with
    // photos/price/specs the digest can honestly show). Prefer new-listing
    // samples; fall back to price-drop samples when there are no new ones.
    const samples =
      target.type === 'aircraft'
        ? newCount > 0
          ? await fetchNewAircraftSamples(supabase, target, since)
          : await fetchAircraftPriceDropSamples(supabase, target, since)
        : []

    const unsubToken = alert.unsubscribe_token ?? ''
    const listingsUrl = `${SITE_URL}${alert.source_path ?? '/aircraft'}`
    const manageUrl = `${SITE_URL}/alerts/manage`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`

    const { subject, html, text } = buildAlertDigestEmail({
      context: alert.context ?? null,
      samples,
      newCount,
      dropCount,
      listingsUrl,
      manageUrl,
      unsubscribeUrl,
    })

    const result = await sendEmail({ to: alert.email, subject, html, text })

    if (result.sent || result.reason === 'no-key') {
      // Update last_digest_at so we don't re-send for the same window.
      await supabase
        .from('alerts')
        .update({ last_digest_at: new Date().toISOString() })
        .eq('id', alert.id)
      sent++
    }
  }

  const total = (alerts ?? []).length
  console.log(
    `[alert-digest] processed=${total} sent=${sent} skipped=${skipped} unparseable=${unparseable} notDue=${notDue}`
  )
  return Response.json({ processed: total, sent, skipped, unparseable, notDue })
}
