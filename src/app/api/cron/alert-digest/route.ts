import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail, buildAlertDigestEmail } from '@/lib/email'
import { getStateBySlug, getMakeBySlug, getMakeModel, SEO_MAKE_MODELS } from '@/lib/seo'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PARTS_PRICE_FLOOR = 50_000
const DIGEST_INTERVAL_DAYS = 7

// ─── Source-path parsing ─────────────────────────────────────────────────────

type AlertTarget =
  | { type: 'aircraft'; make?: string; modelPattern?: string; notModelPattern?: string; state?: string }
  | { type: 'partnership'; make?: string; state?: string; icao?: string }

/**
 * Parse an alert `source_path` (e.g. "/aircraft/cessna/172") into a typed
 * filter struct that can drive a count query. Returns null for paths we can't
 * meaningfully match (mission presets, unknown families).
 */
function parseSourcePath(raw: string | null): AlertTarget | null {
  const p = (raw ?? '').split('?')[0].toLowerCase().replace(/\/$/, '') || '/'

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

  // /partnerships → all partnerships
  if (p === '/partnerships') return { type: 'partnership' }

  return null
}

/** Resolve a make+model slug pair to an aircraft AlertTarget, or null if unknown. */
function resolveAircraftMakeModel(makeSlug: string, modelSlug: string): AlertTarget | null {
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
  if (target.modelPattern) q = q.ilike('model', target.modelPattern)
  if (target.notModelPattern) q = q.not('model', 'ilike', target.notModelPattern)
  if (target.state) q = q.eq('state', target.state)

  const { count, error } = await q
  if (error) {
    console.error('[alert-digest] aircraft count error:', error.message)
    return 0
  }
  return count ?? 0
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

async function countNew(
  supabase: ReturnType<typeof createAdminClient>,
  target: AlertTarget,
  since: string
): Promise<number> {
  if (target.type === 'aircraft') return countNewAircraft(supabase, target, since)
  return countNewPartnerships(supabase, target, since)
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
  const windowStart = new Date(Date.now() - DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Fetch confirmed alerts that haven't been digested in 7+ days.
  const { data: alerts, error: fetchError } = await supabase
    .from('alerts')
    .select('id, email, context, source_path, created_at, last_digest_at, unsubscribe_token')
    .eq('status', 'confirmed')
    .or(`last_digest_at.is.null,last_digest_at.lt.${windowStart}`)

  if (fetchError) {
    console.error('[alert-digest] fetch error:', fetchError.message)
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  let unparseable = 0

  for (const alert of alerts ?? []) {
    const target = parseSourcePath(alert.source_path)
    if (!target) {
      unparseable++
      continue
    }

    // "Since when?" — use last_digest_at if present; else the signup date.
    const since = alert.last_digest_at ?? alert.created_at ?? windowStart

    const count = await countNew(supabase, target, since)

    if (count === 0) {
      skipped++
      continue
    }

    const unsubToken = alert.unsubscribe_token ?? ''
    const listingsUrl = `${SITE_URL}${alert.source_path ?? '/aircraft'}`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`

    const { subject, html, text } = buildAlertDigestEmail({
      context: alert.context ?? null,
      count,
      listingsUrl,
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
  console.log(`[alert-digest] processed=${total} sent=${sent} skipped=${skipped} unparseable=${unparseable}`)
  return Response.json({ processed: total, sent, skipped, unparseable })
}
