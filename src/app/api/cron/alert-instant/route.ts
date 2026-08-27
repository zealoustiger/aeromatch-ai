import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail, buildAlertDigestEmail, isTerminalSendOutcome, type AlertDigestSample } from '@/lib/email'
import { SITE_URL } from '@/lib/seo'
import { SendPacer } from '@/lib/alertSendPacing'
import {
  getMarketPulseLine,
  getAircraftMakePulseLine,
  getPartnershipMarketPulseLine,
} from '@/lib/alertMatchCounts'
import {
  parseSourcePath,
  resolveAircraftAirportState,
  countNew,
  fetchNewAircraftSamples,
  fetchNewPartnershipSamples,
  fetchNewSeekerSamples,
  attachWatchLinks,
  familyPriceMapGetter,
  markDigestSent,
  MAX_DIGEST_SAMPLES,
} from '@/app/api/cron/alert-digest/route'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Near-instant new-listing alerts (GOAL.md: "digest vs instant options").
 *
 * The daily `alert-digest` cron sends at most once a day, gated per-alert by
 * elapsed days — too slow for a buyer who wants to be first to a fresh listing.
 * This route runs on a much tighter cadence (`vercel.json`: every ~15 min) and
 * handles ONLY `frequency='instant'` alerts: for each, it counts new listings
 * since the alert's own `last_digest_at` watermark (reusing the daily digest's
 * exact `parseSourcePath`/`countNew`/sample fetchers + `buildAlertDigestEmail`),
 * sends when there's a genuine new match, and stamps `last_digest_at` via the
 * shared `markDigestSent`. The daily cron skips `frequency='instant'` outright,
 * so the same listing can never double-send across the two routes.
 *
 * Scope (this slice): new-listing matches only, per the backlog title
 * "Near-instant new-listing alerts." Price-drop matching stays on the daily
 * digest cadence — a follow-up can extend this route to instant drops.
 *
 * FAIL-SOFT: the additive `'instant'` value on the `alerts.frequency` CHECK
 * constraint is a pending human-apply migration (see supabase/schema.sql,
 * `alerts_frequency`). Until it lands, no row can ever be written with
 * `frequency='instant'` (the capture/toggle write paths fail the CHECK and
 * retry dropping the key — see `updateAlertFrequency`), so this route simply
 * finds zero instant alerts and early-outs at 200. If the `frequency` column
 * itself is somehow absent, the fetch below returns a clean "not migrated"
 * 200 instead of throwing. Near-free either way when zero instant alerts exist.
 */

type InstantAlertRow = {
  id: string
  email: string
  context: string | null
  source_path: string | null
  created_at: string
  last_digest_at: string | null
  unsubscribe_token: string | null
  new_listing_opt_out?: boolean
  digest_sends_count?: number
}

// Optional columns that may not be migrated live yet — dropped one-at-a-time
// from the select on the PostgREST "column does not exist" error, same
// graceful-degrade precedent as the daily digest's fetch. `frequency` is NOT
// in this list: it's the filter column, and its absence is a distinct
// "instant isn't wired live yet" case handled separately below.
const OPTIONAL_COLS = ['new_listing_opt_out', 'digest_sends_count']
const BASE_COLS = 'id, email, context, source_path, created_at, last_digest_at, unsubscribe_token'

export async function GET(req: NextRequest) {
  // Same protection as the daily digest: Vercel passes CRON_SECRET via the
  // Authorization header. Unprotected in dev/staging without the secret.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  } else {
    console.warn('[alert-instant] CRON_SECRET not set — route is unprotected (ok in dev)')
  }

  const supabase = createAdminClient()

  let cols = `${BASE_COLS}, ${OPTIONAL_COLS.join(', ')}`
  let { data: alerts, error: fetchError } = (await supabase
    .from('alerts')
    .select(cols)
    .in('status', ['confirmed', 'active'])
    .eq('frequency', 'instant')) as unknown as {
    data: InstantAlertRow[] | null
    error: { message: string } | null
  }

  // Retry-drop any unmigrated OPTIONAL column the error names (one per pass).
  // NB: PostgREST reports one unknown column per error, and it may name an
  // absent optional column BEFORE it ever gets to evaluating the `frequency`
  // filter — so the "frequency not migrated" case is handled once, after this
  // loop, rather than up front (an early check would miss the ordering where
  // an optional column errors first).
  for (
    let i = 0;
    i < OPTIONAL_COLS.length && fetchError && OPTIONAL_COLS.some((c) => fetchError!.message?.includes(c));
    i++
  ) {
    cols = cols
      .split(', ')
      .filter((c) => !fetchError!.message.includes(c))
      .join(', ')
    ;({ data: alerts, error: fetchError } = (await supabase
      .from('alerts')
      .select(cols)
      .in('status', ['confirmed', 'active'])
      .eq('frequency', 'instant')) as unknown as {
      data: InstantAlertRow[] | null
      error: { message: string } | null
    })
  }

  if (fetchError) {
    // `frequency` column / `'instant'` value not migrated live yet → instant
    // isn't a real cadence on this DB. Nothing to send; return an honest 200
    // rather than a 500 (fail-soft, same precedent as every other alerts.*
    // pending migration). This is reached only after the optional-column
    // retry loop above has exhausted, so a residual error naming `frequency`
    // is unambiguously the not-migrated case.
    if (fetchError.message?.includes('frequency')) {
      return Response.json({ ok: true, migrated: false, instantAlerts: 0, sent: 0 })
    }
    console.error('[alert-instant] fetch error:', fetchError.message)
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  const rows = alerts ?? []
  if (rows.length === 0) {
    return Response.json({ ok: true, instantAlerts: 0, sent: 0 })
  }

  const getFamilyPriceMap = familyPriceMapGetter(supabase)
  const pacer = new SendPacer(Date.now())
  const nowIso = new Date().toISOString()

  let sent = 0
  let skipped = 0
  let unparseable = 0

  for (const alert of rows) {
    const target = parseSourcePath(alert.source_path)
    if (!target) {
      unparseable++
      continue
    }
    if (target.type === 'aircraft' && target.icao) {
      await resolveAircraftAirportState(supabase, target)
    }

    // New listings only, since this alert's own watermark (or signup date on
    // the first-ever run — never a historical backfill, since a just-created
    // alert's `created_at` is now). Respects the "Drops only" mode toggle by
    // muting new-listing matching entirely, same as the daily digest.
    const newListingOptOut =
      (target.type === 'aircraft' || target.type === 'partnership') && (alert.new_listing_opt_out ?? false)
    const since = alert.last_digest_at ?? alert.created_at ?? nowIso
    const newCount = newListingOptOut ? 0 : await countNew(supabase, target, since)
    if (newCount === 0) {
      skipped++
      continue
    }

    const samples: AlertDigestSample[] =
      target.type === 'aircraft'
        ? await fetchNewAircraftSamples(supabase, target, since, MAX_DIGEST_SAMPLES, getFamilyPriceMap)
        : target.type === 'partnership'
          ? await fetchNewPartnershipSamples(supabase, target, since)
          : target.type === 'seeker'
            ? await fetchNewSeekerSamples(supabase, target, since)
            : await (async () => {
                // `all` (site-wide capture) → aircraft first, top up with partnerships.
                const aircraftSamples = await fetchNewAircraftSamples(
                  supabase,
                  { type: 'aircraft' },
                  since,
                  MAX_DIGEST_SAMPLES,
                  getFamilyPriceMap
                )
                if (aircraftSamples.length >= MAX_DIGEST_SAMPLES) return aircraftSamples
                const partnershipSamples = await fetchNewPartnershipSamples(
                  supabase,
                  { type: 'partnership' },
                  since,
                  MAX_DIGEST_SAMPLES - aircraftSamples.length
                )
                return [...aircraftSamples, ...partnershipSamples]
              })()

    // Same honest market-pulse line the daily digest attaches (never a
    // fabricated number — see getMarketPulseLine's honesty floors).
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

    const unsubToken = alert.unsubscribe_token ?? ''
    const listingsUrl = `${SITE_URL}${alert.source_path ?? '/aircraft'}`
    const manageUrl = unsubToken ? `${SITE_URL}/alerts/manage?token=${unsubToken}` : `${SITE_URL}/alerts/manage`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`
    // "Get fewer emails" → step instant down one rung to daily (the next
    // lighter cadence). Omitted for a pre-migration row with no token yet.
    const frequencyUrl = unsubToken ? `${SITE_URL}/api/alerts/frequency?token=${unsubToken}&dir=daily` : undefined

    const { subject, html, text } = buildAlertDigestEmail({
      context: alert.context ?? null,
      samples: samplesWithWatch,
      newCount,
      dropCount: 0,
      dropNoun: target.type === 'partnership' ? 'buy-in drop' : undefined,
      listingsUrl,
      manageUrl,
      unsubscribeUrl,
      frequencyUrl,
      frequencyTarget: 'weekly',
      marketPulse: marketPulse ?? undefined,
      // Honest cadence framing — this is a ~15-min sweep, not a weekly roundup.
      periodLabel: 'just now',
    })

    const gate = await pacer.send(() =>
      sendEmail({ to: alert.email, subject, html, text, unsubscribeUrl, emailType: 'alert-digest' })
    )

    if (gate.attempted && (isTerminalSendOutcome(gate.value))) {
      // Stamp last_digest_at (+ digest_sends_count) so neither this route nor
      // the daily cron re-sends the same window.
      await markDigestSent(
        supabase,
        [{ id: alert.id, digest_sends_count: alert.digest_sends_count }],
        new Date().toISOString()
      )
      sent++
    }
  }

  return Response.json({ ok: true, instantAlerts: rows.length, sent, skipped, unparseable })
}
