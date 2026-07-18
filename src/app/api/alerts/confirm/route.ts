import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'
import { getAlertDigestPreview, getEmptyStateWidenSuggestion } from '@/lib/alertMatchCounts'
import { buildAlertDigestEmail, buildAlertZeroMatchWelcomeEmail, sendEmail } from '@/lib/email'
import { normalizeFrequency } from '@/lib/alertFrequency'

export const dynamic = 'force-dynamic'

const PRECONFIRM_COLS = 'id, status, email, context, source_path, unsubscribe_token'

type PreConfirmAlert = {
  id: string
  status: string
  email: string
  context: string | null
  source_path: string | null
  unsubscribe_token: string | null
  frequency?: string
}

// Fire-and-log only — never lets an email failure block the confirm redirect.
// Only called on a genuine pending→confirmed transition (see caller), so a
// repeat click on an already-confirmed link never re-sends this.
async function sendInstantFirstDigest(
  supabase: ReturnType<typeof createAdminClient>,
  alert: { id: string; email: string; context: string | null; source_path: string | null; unsubscribe_token: string | null },
  frequency: string | undefined
) {
  try {
    const preview = await getAlertDigestPreview(alert.source_path)
    if (!preview) return // unrecognized source_path shape — can't honestly say anything either way

    const unsubToken = alert.unsubscribe_token ?? ''
    const manageUrl = unsubToken ? `${SITE_URL}/alerts/manage?token=${unsubToken}` : `${SITE_URL}/alerts/manage`
    const unsubscribeUrl = `${SITE_URL}/api/alerts/unsubscribe?token=${unsubToken}`
    const freq = normalizeFrequency(frequency)

    if (preview.count === 0) {
      // Nothing to send as a digest, but silence is a dead end — send an
      // honest "you're confirmed, we're watching" welcome instead, with an
      // optional real widen suggestion. Deliberately does NOT stamp
      // `last_digest_at` — that stays null so the normal cron still treats
      // this alert as never-sent and delivers the first real digest the
      // moment a genuine match appears.
      const widenSuggestion = await getEmptyStateWidenSuggestion(alert.source_path)
      const { subject, html, text } = buildAlertZeroMatchWelcomeEmail({
        context: alert.context,
        frequency: freq,
        manageUrl,
        unsubscribeUrl,
        widen: widenSuggestion
          ? {
              description: widenSuggestion.description,
              count: widenSuggestion.count,
              noun: widenSuggestion.noun,
              url: `${SITE_URL}${widenSuggestion.sourcePath}`,
            }
          : null,
      })
      await sendEmail({ to: alert.email, subject, html, text, unsubscribeUrl, emailType: 'alert-zero-match-welcome' })
      return
    }

    const listingsUrl = `${SITE_URL}${alert.source_path ?? '/aircraft'}`
    const frequencyUrl =
      freq === 'daily' && unsubToken ? `${SITE_URL}/api/alerts/frequency?token=${unsubToken}` : undefined

    const { subject, html, text } = buildAlertDigestEmail({
      context: alert.context,
      newCount: preview.count,
      dropCount: 0,
      listingsUrl,
      manageUrl,
      unsubscribeUrl,
      frequencyUrl,
      samples: preview.samples ?? [],
      firstSend: true,
    })
    const result = await sendEmail({ to: alert.email, subject, html, text, unsubscribeUrl, emailType: 'alert-digest' })

    if (result.sent || result.reason === 'no-key') {
      await supabase.from('alerts').update({ last_digest_at: new Date().toISOString() }).eq('id', alert.id)
    }
  } catch (err) {
    console.error('[alerts/confirm] instant first digest failed:', err)
  }
}

// Double-opt-in confirmation. The link in the confirmation email points here with
// the row's `confirm_token`; we flip that pending alert to confirmed and bounce
// the visitor to a friendly status page. Anon can't UPDATE `alerts` (RLS), so we
// use the service role. Fails soft to ?state=invalid — never a 500 on a stale or
// bogus token.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  // Confirmed lands with the same token forwarded, so the status page can look up
  // the alert's source_path and offer a token-scoped cross-sell suggestion (see
  // subscribeToConfirmedAlert) — mirrors the unsubscribe route's existing convention
  // of forwarding unsubscribe_token on ?state=unsubscribed.
  const dest = (state: string) =>
    NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=${state}${state === 'confirmed' && token ? `&token=${encodeURIComponent(token)}` : ''}`
    )

  if (!token) return dest('invalid')

  try {
    const supabase = createAdminClient()

    // Look up status BEFORE updating, so a repeat click on an already-confirmed
    // link never re-fires the instant first digest below. `frequency` may not be
    // migrated live yet on every environment — retry once without it, same
    // graceful-fallback pattern as sendSampleDigest/the alert-digest cron.
    let { data: existing, error: fetchError } = (await supabase
      .from('alerts')
      .select(`${PRECONFIRM_COLS}, frequency`)
      .eq('confirm_token', token)
      .neq('status', 'unsubscribed')
      .maybeSingle()) as unknown as { data: PreConfirmAlert | null; error: { message: string } | null }
    if (fetchError?.message?.includes('frequency')) {
      ;({ data: existing, error: fetchError } = (await supabase
        .from('alerts')
        .select(PRECONFIRM_COLS)
        .eq('confirm_token', token)
        .neq('status', 'unsubscribed')
        .maybeSingle()) as unknown as { data: PreConfirmAlert | null; error: { message: string } | null })
    }

    if (fetchError) {
      console.error('[alerts/confirm] lookup failed:', fetchError.message)
      return dest('invalid')
    }
    if (!existing) return dest('invalid')

    const wasPending = existing.status === 'pending'

    // The lookup above only excludes 'unsubscribed', so an old confirm link
    // clicked after the row has since been paused or bounced still lands here
    // — clear both status-timestamp columns alongside the confirm, same as
    // every other path that lands on 'confirmed' (resumeAlert et al). Each
    // may independently be un-migrated live — retry dropping whichever one
    // the error names, up to once each.
    let payload: Record<string, unknown> = {
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      paused_at: null,
      bounced_at: null,
    }
    const optionalKeys = ['paused_at', 'bounced_at']
    let { error: updateError } = await supabase.from('alerts').update(payload).eq('id', existing.id)
    for (
      let i = 0;
      i < optionalKeys.length &&
      updateError &&
      optionalKeys.some((k) => k in payload && updateError!.message?.includes(k));
      i++
    ) {
      const dropKey = optionalKeys.find((k) => k in payload && updateError!.message?.includes(k))!
      payload = Object.fromEntries(Object.entries(payload).filter(([k]) => k !== dropKey))
      ;({ error: updateError } = await supabase.from('alerts').update(payload).eq('id', existing.id))
    }

    if (updateError) {
      console.error('[alerts/confirm] update failed:', updateError.message)
      return dest('invalid')
    }

    if (wasPending) {
      await sendInstantFirstDigest(supabase, existing, existing.frequency)
    }

    return dest('confirmed')
  } catch (err) {
    console.error('[alerts/confirm] error:', err)
    return dest('invalid')
  }
}
