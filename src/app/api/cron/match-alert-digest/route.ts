import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail, buildMatchAlertEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/seo'
import { aircraftLabel } from '@/lib/utils'
import {
  getMatchingSeekersForPartnership,
  getMatchingPartnershipsForSeeker,
  seekerBrowseHrefForPartnership,
  partnershipBrowseHrefForSeeker,
} from '@/lib/matchingQuery'
import type { Partnership, PartnershipSeeker } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DIGEST_INTERVAL_DAYS = 7

async function processPartnerships(
  supabase: ReturnType<typeof createAdminClient>,
  windowStart: string
): Promise<{ sent: number; skipped: number }> {
  const { data: rows, error } = await supabase
    .from('partnerships')
    .select('*')
    .eq('status', 'active')
    .not('poster_id', 'is', null)
    .or(`match_alert_last_sent_at.is.null,match_alert_last_sent_at.lt.${windowStart}`)

  if (error) {
    if (error.code === '42703') throw error
    console.error('[match-alert-digest] partnerships fetch error:', error.message)
    return { sent: 0, skipped: 0 }
  }

  let sent = 0
  let skipped = 0
  for (const row of (rows ?? []) as Partnership[]) {
    const since = row.match_alert_last_sent_at ?? row.created_at
    const matches = await getMatchingSeekersForPartnership(row)
    const fresh = matches.filter((s) => s.created_at >= since)
    if (fresh.length === 0) {
      skipped++
      continue
    }

    const { subject, html, text } = buildMatchAlertEmail({
      listingLabel: `your ${aircraftLabel(row.make, row.model, row.year)} partnership`,
      otherSideLabel: 'pilots seeking a partnership',
      count: fresh.length,
      matchesUrl: `${SITE_URL}${seekerBrowseHrefForPartnership(row)}`,
    })
    const result = await sendEmail({ to: row.contact_email, subject, html, text, emailType: 'match-alert' })
    if (result.sent || result.reason === 'no-key') {
      await supabase
        .from('partnerships')
        .update({ match_alert_last_sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    }
  }
  return { sent, skipped }
}

async function processSeekers(
  supabase: ReturnType<typeof createAdminClient>,
  windowStart: string
): Promise<{ sent: number; skipped: number }> {
  const { data: rows, error } = await supabase
    .from('partnership_seekers')
    .select('*')
    .eq('status', 'active')
    .not('poster_id', 'is', null)
    .or(`match_alert_last_sent_at.is.null,match_alert_last_sent_at.lt.${windowStart}`)

  if (error) {
    if (error.code === '42703') throw error
    console.error('[match-alert-digest] seekers fetch error:', error.message)
    return { sent: 0, skipped: 0 }
  }

  let sent = 0
  let skipped = 0
  for (const row of (rows ?? []) as PartnershipSeeker[]) {
    const since = row.match_alert_last_sent_at ?? row.created_at
    const matches = await getMatchingPartnershipsForSeeker(row)
    const fresh = matches.filter((p) => p.created_at >= since)
    if (fresh.length === 0) {
      skipped++
      continue
    }

    const { subject, html, text } = buildMatchAlertEmail({
      listingLabel: 'your partnership search',
      otherSideLabel: 'partnerships',
      count: fresh.length,
      matchesUrl: `${SITE_URL}${partnershipBrowseHrefForSeeker(row)}`,
    })
    const result = await sendEmail({ to: row.contact_email, subject, html, text, emailType: 'match-alert' })
    if (result.sent || result.reason === 'no-key') {
      await supabase
        .from('partnership_seekers')
        .update({ match_alert_last_sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    }
  }
  return { sent, skipped }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  } else {
    console.warn('[match-alert-digest] CRON_SECRET not set — route is unprotected (ok in dev)')
  }

  const supabase = createAdminClient()
  const windowStart = new Date(Date.now() - DIGEST_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  try {
    const [partnerships, seekers] = await Promise.all([
      processPartnerships(supabase, windowStart),
      processSeekers(supabase, windowStart),
    ])
    console.log(
      `[match-alert-digest] partnerships sent=${partnerships.sent} skipped=${partnerships.skipped}` +
        ` seekers sent=${seekers.sent} skipped=${seekers.skipped}`
    )
    return Response.json({ partnerships, seekers })
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === '42703') {
      // match_alert_last_sent_at not yet migrated on the live DB — never fall
      // back to a behavior that could resend/spam every run; just no-op.
      console.warn('[match-alert-digest] match_alert_last_sent_at column missing — migration pending, sending nothing')
      return Response.json({ skipped: 'migration-pending' })
    }
    console.error('[match-alert-digest] unexpected error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
