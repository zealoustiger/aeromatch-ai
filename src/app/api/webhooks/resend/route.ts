import { NextRequest, NextResponse } from 'next/server'
import {
  verifyResendWebhookSignature,
  extractHardBouncedEmails,
  extractComplainedEmails,
  extractEngagementEvent,
} from '@/lib/resendWebhook'
import { pauseAlertsForBouncedEmail, unsubscribeAlertsForComplainedEmail } from '@/lib/alertBounce'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// ⚠️ HUMAN ACTION: register this endpoint's URL + a signing secret in the
// Resend dashboard (Webhooks → Add endpoint, subscribe to `email.bounced`,
// `email.complained`, `email.opened`, AND `email.clicked`), then set
// RESEND_WEBHOOK_SECRET in the environment. Ships dark until then — see
// nightshift/BACKLOG.md's "Auto-pause alerts on hard email bounces" /
// "Auto-unsubscribe on spam complaints" / "Email engagement stats".
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Not configured anywhere yet → no-op, matching visitor-webhook's convention.
  // A 204 response must be body-less (NextResponse.json(..., {status:204})
  // throws), so this uses a raw NextResponse.
  if (!WEBHOOK_SECRET) return new NextResponse(null, { status: 204 })

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ ok: false, error: 'missing signature headers' }, { status: 401 })
  }

  // Signature verification needs the exact raw bytes Resend signed — never
  // parse-then-restringify, which can reorder/reformat and invalidate the HMAC.
  const rawBody = await request.text()
  const verified = verifyResendWebhookSignature({
    payload: rawBody,
    secret: WEBHOOK_SECRET,
    svixId,
    svixTimestamp,
    svixSignature,
  })
  if (!verified) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON' }, { status: 400 })
  }

  const bouncedEmails = extractHardBouncedEmails(body)
  const complainedEmails = extractComplainedEmails(body)
  const engagementEvent = extractEngagementEvent(body)
  try {
    for (const email of bouncedEmails) {
      await pauseAlertsForBouncedEmail(email)
    }
    for (const email of complainedEmails) {
      await unsubscribeAlertsForComplainedEmail(email)
    }
    if (engagementEvent) {
      // Health log for the /admin/alerts "Email engagement" panel (see
      // emailEngagement.ts). Fails soft — a not-yet-migrated
      // `email_engagement_events` table never turns into a 500 here.
      const admin = createAdminClient()
      const engagementRow = {
        event_type: engagementEvent.eventType,
        email_type: engagementEvent.emailType,
        resend_email_id: engagementEvent.resendEmailId,
        link_url: engagementEvent.link,
        recipient: engagementEvent.recipient,
      }
      let { error } = await admin.from('email_engagement_events').insert(engagementRow)
      if (error?.code === '42703' || error?.code === 'PGRST204') {
        // `recipient` isn't migrated on every environment yet — retry without
        // it so the open/click still logs (same retry-on-missing-column
        // precedent as aircraft_for_sale.contact_phone in actions.ts).
        const { recipient: _recipient, ...withoutRecipient } = engagementRow
        ;({ error } = await admin.from('email_engagement_events').insert(withoutRecipient))
      }
      if (error && !error.message?.includes('email_engagement_events')) {
        console.error('[webhooks/resend] engagement-log insert error:', error.message)
      }
    }
  } catch {
    // Signature is already verified — a DB hiccup here shouldn't make Resend
    // retry-storm a legitimate delivery, same posture as visitor-webhook.
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({
    ok: true,
    paused: bouncedEmails.length,
    unsubscribed: complainedEmails.length,
    engagementLogged: engagementEvent ? 1 : 0,
  })
}
