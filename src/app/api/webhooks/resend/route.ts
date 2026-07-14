import { NextRequest, NextResponse } from 'next/server'
import { verifyResendWebhookSignature, extractHardBouncedEmails } from '@/lib/resendWebhook'
import { pauseAlertsForBouncedEmail } from '@/lib/alertBounce'

export const dynamic = 'force-dynamic'

// ⚠️ HUMAN ACTION: register this endpoint's URL + a signing secret in the
// Resend dashboard (Webhooks → Add endpoint, subscribe to `email.bounced`),
// then set RESEND_WEBHOOK_SECRET in the environment. Ships dark until then —
// see nightshift/BACKLOG.md's "Auto-pause alerts on hard email bounces".
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
  try {
    for (const email of bouncedEmails) {
      await pauseAlertsForBouncedEmail(email)
    }
  } catch {
    // Signature is already verified — a DB hiccup here shouldn't make Resend
    // retry-storm a legitimate delivery, same posture as visitor-webhook.
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true, paused: bouncedEmails.length })
}
