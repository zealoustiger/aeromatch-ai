import { createAdminClient } from './supabase-admin'
import { SITE_URL } from './seo'
import { buildAlertDigestEmail, type AlertDigestSample } from './email'
import {
  getMarketPulseLine,
  getAircraftMakePulseLine,
  getPartnershipMarketPulseLine,
} from './alertMatchCounts'
import {
  parseSourcePath,
  countNew,
  fetchNewAircraftSamples,
  fetchNewPartnershipSamples,
  fetchNewSeekerSamples,
  attachWatchLinks,
  familyPriceMapGetter,
  MAX_DIGEST_SAMPLES,
} from '@/app/api/cron/alert-digest/route'

/**
 * Admin-only replay of the alert digest that `/api/cron/alert-digest` sends.
 *
 * It deliberately shares the cron's own `parseSourcePath`, `countNew` and
 * sample fetchers, and renders through the same `buildAlertDigestEmail`, so
 * what an admin sees is what a subscriber receives — a preview that can drift
 * from the real send is worse than no preview. Same reuse contract, and the
 * same import list, as `/api/cron/alert-instant`.
 *
 * Two things it deliberately does NOT do: email the subscriber (the caller
 * always sends to the signed-in admin) and stamp `last_digest_at` (replaying
 * an alert must never swallow that subscriber's real next digest).
 *
 * Scope: new-listing matches, matching `/api/cron/alert-instant`'s own scope.
 * The daily cron can also send price-drop-only digests, whose fetchers are
 * private to that route; a replay therefore reports `dropCount: 0` rather than
 * inventing a number it can't source.
 */

/** Statuses the digest cron actually sends to (`status in (...)` there). */
const LIVE_STATUSES = ['confirmed', 'active']

export type ReplayableAlert = {
  id: string
  email: string
  context: string | null
  sourcePath: string
  lastDigestAt: string | null
}

type AlertRow = {
  id: string
  email: string
  context: string | null
  source_path: string | null
  last_digest_at: string | null
  created_at: string | null
  unsubscribe_token: string | null
}

/**
 * Recent live alerts whose saved search the cron can actually parse, newest
 * digest first. Unparseable `source_path`s are dropped because the cron skips
 * them too — offering one here would promise a replay that can't happen.
 */
export async function listReplayableAlerts(limit = 40): Promise<ReplayableAlert[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('alerts')
    .select('id, email, context, source_path, last_digest_at, created_at')
    .in('status', LIVE_STATUSES)
    .not('confirmed_at', 'is', null)
    .order('last_digest_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit * 2)

  return ((data ?? []) as AlertRow[])
    .filter((a) => parseSourcePath(a.source_path) !== null)
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      email: a.email,
      context: a.context ?? null,
      sourcePath: a.source_path ?? '',
      lastDigestAt: a.last_digest_at ?? null,
    }))
}

export type DigestReplay = {
  alert: ReplayableAlert
  subject: string
  html: string
  text: string
  /** How many listings matched, and over what window — surfaced in the UI and
   *  in the email's own banner so a test can never be mistaken for a real
   *  send. */
  matchCount: number
  window: 'since-last-digest' | 'most-recent'
  note: string
}

/** Far enough back to mean "everything currently live" for the fallback
 *  window. Not `new Date(0)`: some rows carry null timestamps, and an explicit
 *  date reads clearly in a query log. */
const EPOCH = '1970-01-01T00:00:00.000Z'

/**
 * Rebuild one alert's digest exactly as the cron would.
 *
 * Preferred window is the real one — everything new since `last_digest_at`,
 * i.e. precisely what the subscriber's next email will contain, rendered
 * byte-identically. When that window is empty (the common case right after a
 * send) it falls back to every current match for the same search so there is
 * always something to look at, and switches the email to its built-in honest
 * "sample" framing rather than passing existing listings off as new.
 */
export async function buildDigestReplay(alertId?: string): Promise<DigestReplay | null> {
  const supabase = createAdminClient()

  let query = supabase
    .from('alerts')
    .select('id, email, context, source_path, last_digest_at, created_at, unsubscribe_token')
    .in('status', LIVE_STATUSES)
    .not('confirmed_at', 'is', null)
  query = alertId
    ? query.eq('id', alertId)
    : query
        .order('last_digest_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
  const { data } = await query.limit(alertId ? 1 : 20)

  const rows = (data ?? []) as AlertRow[]
  const alert = rows.find((a) => parseSourcePath(a.source_path) !== null)
  if (!alert) return null
  const target = parseSourcePath(alert.source_path)
  if (!target) return null

  const getFamilyPriceMap = familyPriceMapGetter(supabase)

  /** The cron's own sample selection, minus the price-drop branches (see the
   *  scope note above): aircraft, partnerships, `all` topped up from both, and
   *  seekers. */
  const fetchSamples = async (since: string): Promise<AlertDigestSample[]> => {
    if (target.type === 'aircraft') {
      return fetchNewAircraftSamples(supabase, target, since, MAX_DIGEST_SAMPLES, getFamilyPriceMap)
    }
    if (target.type === 'partnership') {
      return fetchNewPartnershipSamples(supabase, target, since)
    }
    if (target.type === 'all') {
      const aircraft = await fetchNewAircraftSamples(
        supabase,
        { type: 'aircraft' },
        since,
        MAX_DIGEST_SAMPLES,
        getFamilyPriceMap
      )
      if (aircraft.length >= MAX_DIGEST_SAMPLES) return aircraft
      const partnerships = await fetchNewPartnershipSamples(
        supabase,
        { type: 'partnership' },
        since,
        MAX_DIGEST_SAMPLES - aircraft.length
      )
      return [...aircraft, ...partnerships]
    }
    return fetchNewSeekerSamples(supabase, target, since)
  }

  const runWindow = async (since: string) => ({
    count: await countNew(supabase, target, since),
    samples: await fetchSamples(since),
  })

  const realSince = alert.last_digest_at ?? alert.created_at ?? EPOCH
  let window: DigestReplay['window'] = 'since-last-digest'
  let result = await runWindow(realSince)
  if (result.samples.length === 0) {
    window = 'most-recent'
    result = await runWindow(EPOCH)
  }
  if (result.samples.length === 0) return null

  const note =
    window === 'since-last-digest'
      ? `Real send window — ${result.count} new since ${alert.last_digest_at ?? 'this alert was created'}. This is exactly what ${alert.email} gets next.`
      : `Nothing new since the last digest, so this shows every current match for the same search. Layout is identical to a real send; the listings are not new, and the email says so.`

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

  const token = alert.unsubscribe_token
  const samples = await attachWatchLinks(supabase, alert.email, token, result.samples)

  const built = buildAlertDigestEmail({
    context: alert.context ?? null,
    samples,
    newCount: result.count,
    dropCount: 0,
    dropNoun: target.type === 'partnership' ? 'buy-in drop' : undefined,
    listingsUrl: `${SITE_URL}${alert.source_path ?? '/aircraft'}`,
    manageUrl: token ? `${SITE_URL}/alerts/manage?token=${token}` : `${SITE_URL}/alerts/manage`,
    unsubscribeUrl: token
      ? `${SITE_URL}/api/alerts/unsubscribe?token=${token}`
      : `${SITE_URL}/alerts/manage`,
    marketPulse: marketPulse ?? undefined,
    // Only the fallback window gets the sample banner + "current matches"
    // framing. The real window is rendered exactly as it will ship, so an
    // admin previewing it sees the subscriber's actual email, not a variant.
    sampleNote: window === 'most-recent' ? note : undefined,
  })

  return {
    alert: {
      id: alert.id,
      email: alert.email,
      context: alert.context ?? null,
      sourcePath: alert.source_path ?? '',
      lastDigestAt: alert.last_digest_at ?? null,
    },
    ...built,
    matchCount: result.count,
    window,
    note,
  }
}
