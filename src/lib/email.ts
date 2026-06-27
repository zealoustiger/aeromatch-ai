// Transactional email — Resend, with a safe no-op fallback.
//
// Sends via the Resend HTTP API when `RESEND_API_KEY` is present; when it is NOT
// (e.g. this environment, or before the human verifies a sender domain), every
// call is a logged no-op that returns `{ sent:false, reason:'no-key' }`. This
// lets the whole double-opt-in flow ship and be exercised end-to-end safely —
// nothing actually leaves the building until the key is dropped in, at which
// point it "just works" with no further code change.
//
// Server-only — never import into a client component (it reads server env + the
// API key).

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Sender identity. Override with ALERTS_FROM_EMAIL once a domain is verified. */
const FROM = process.env.ALERTS_FROM_EMAIL || 'ClubHanger <alerts@clubhanger.com>'

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  /** Plain-text fallback; recommended for deliverability. */
  text?: string
}

export type SendEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: 'no-key' | 'error'; detail?: string }

/**
 * Send one transactional email. Resolves (never throws) so a caller in a
 * server action / route handler can fire-and-forget without risking a 500.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    // No provider configured yet — log and no-op so callers stay simple/safe.
    console.log(
      `[email:noop] would send "${input.subject}" to ${input.to} (no RESEND_API_KEY)`
    )
    return { sent: false, reason: 'no-key' }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[email] Resend ${res.status}: ${detail.slice(0, 300)}`)
      return { sent: false, reason: 'error', detail: `${res.status}` }
    }
    const json = (await res.json().catch(() => null)) as { id?: string } | null
    return { sent: true, id: json?.id ?? null }
  } catch (err) {
    console.error('[email] Resend request failed:', err)
    return { sent: false, reason: 'error', detail: String(err) }
  }
}

/**
 * Build the double-opt-in confirmation email for a new-listing alert signup.
 * `context` is the human-readable thing being alerted on (e.g. "Cessna 172"),
 * may be empty. Returns subject + html + text ready for `sendEmail`.
 */
export function buildAlertConfirmEmail(opts: {
  context: string | null
  confirmUrl: string
  unsubscribeUrl: string
}): { subject: string; html: string; text: string } {
  const thing = (opts.context || '').trim()
  const forThing = thing ? ` for new ${escapeHtml(thing)} listings` : ''
  const forThingText = thing ? ` for new ${thing} listings` : ''
  const subject = thing
    ? `Confirm your ClubHanger alerts for ${thing}`
    : 'Confirm your ClubHanger listing alerts'

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;">Confirm your alerts</h1>
      <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 20px;">
        Thanks for signing up${forThing} on ClubHanger. Click below to confirm your
        email — we&rsquo;ll only message you when a genuinely new matching aircraft is listed.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeAttr(opts.confirmUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
          Confirm my alerts
        </a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0 0 8px;">
        If you didn&rsquo;t request this, you can ignore this email — you won&rsquo;t hear from us again.
      </p>
      <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:16px 0 0;">
        Prefer not to get these? <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#94a3b8;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`

  const text = `Confirm your ClubHanger alerts${forThingText}.

Confirm your email: ${opts.confirmUrl}

If you didn't request this, ignore this email.
Unsubscribe: ${opts.unsubscribeUrl}`

  return { subject, html, text }
}

/**
 * Build the "you have a new message" notification email for on-site messaging.
 * `threadUrl` is the full absolute URL to the thread (e.g. https://clubhanger.com/messages/{id}).
 * Returns subject + html + text ready for `sendEmail`.
 */
export function buildNewMessageEmail(opts: {
  threadUrl: string
}): { subject: string; html: string; text: string } {
  const subject = 'New message on ClubHanger'
  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;">You have a new message</h1>
      <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 20px;">
        Someone sent you a message on ClubHanger. Click below to read it and reply.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeAttr(opts.threadUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
          Read message
        </a>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0;">
        You&rsquo;re receiving this because you have an active conversation on ClubHanger.
      </p>
    </div>
  </body>
</html>`

  const text = `You have a new message on ClubHanger.

Read and reply: ${opts.threadUrl}`

  return { subject, html, text }
}

/**
 * Build the operator alert for a new inquiry on a seed/concierge listing. Unlike
 * the generic new-message email, this carries full context (persona, listing,
 * inquirer email, message body) so the operator can act straight from their inbox
 * without logging in as the concierge — though `threadUrl` lets them reply in-thread.
 */
export function buildSeedInquiryEmail(opts: {
  personaName: string
  listingTitle: string
  listingUrl: string
  threadUrl: string
  inquirerEmail: string | null
  body: string
}): { subject: string; html: string; text: string } {
  const persona = opts.personaName || 'a seed listing'
  const subject = `New inquiry on "${opts.listingTitle}" (${persona})`
  const from = opts.inquirerEmail || 'a signed-in member'

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 4px;">New listing inquiry</h1>
      <p style="font-size:14px;color:#64748b;margin:0 0 20px;">Sent to the <strong>${escapeHtml(persona)}</strong> persona &middot; routed to you as concierge.</p>
      <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;margin:0 0 20px;">
        <tr><td style="padding:6px 0;color:#94a3b8;width:96px;">Listing</td><td style="padding:6px 0;"><a href="${escapeAttr(opts.listingUrl)}" style="color:#0284c7;">${escapeHtml(opts.listingTitle)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">From</td><td style="padding:6px 0;">${escapeHtml(from)}</td></tr>
      </table>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.6;color:#0f172a;white-space:pre-wrap;margin:0 0 22px;">${escapeHtml(opts.body)}</div>
      <p style="margin:0 0 8px;">
        <a href="${escapeAttr(opts.threadUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:11px 20px;border-radius:10px;">
          Reply in-thread
        </a>
      </p>
      <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:14px 0 0;">
        Log in as the concierge account to reply here, or just email ${escapeHtml(from)} directly.
      </p>
    </div>
  </body>
</html>`

  const text = `New inquiry on "${opts.listingTitle}" (persona: ${persona})

From: ${from}
Listing: ${opts.listingUrl}

${opts.body}

Reply in-thread: ${opts.threadUrl}`

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;')
}

/**
 * Build the weekly digest email for a confirmed alert subscriber.
 * Sent when there are new matching listings since their last digest.
 * Simple: count + link back to the page — no per-listing details.
 */
export function buildAlertDigestEmail(opts: {
  context: string | null
  count: number
  listingsUrl: string
  unsubscribeUrl: string
}): { subject: string; html: string; text: string } {
  const thing = (opts.context || '').trim()
  const forThing = thing ? ` ${escapeHtml(thing)}` : ''
  const forThingText = thing ? ` ${thing}` : ''
  const countLabel = opts.count === 1 ? '1 new listing' : `${opts.count} new listings`
  const countLabelText = countLabel
  const subject = thing
    ? `${countLabel} — ${thing} on ClubHanger`
    : `${countLabel} on ClubHanger`

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;">${escapeHtml(countLabel)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 20px;">
        There ${opts.count === 1 ? 'is' : 'are'} ${countLabel} matching your${forThing} alert on ClubHanger this week.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeAttr(opts.listingsUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
          View${forThing} listings
        </a>
      </p>
      <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:16px 0 0;">
        You&rsquo;re receiving this because you signed up for${forThing} alerts on ClubHanger.
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#94a3b8;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`

  const text = `${countLabelText} matching your${forThingText} alert on ClubHanger.

View listings: ${opts.listingsUrl}

Unsubscribe: ${opts.unsubscribeUrl}`

  return { subject, html, text }
}
