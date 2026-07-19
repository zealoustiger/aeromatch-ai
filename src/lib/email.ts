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

import type { CompResult } from '@/lib/aircraftComps'
import type { AlertFunnelWeeklySnapshot } from '@/lib/alertFunnelWeekly'
import type { AlertFrequency } from '@/lib/alertFrequency'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Sender identity. Override with ALERTS_FROM_EMAIL once a domain is verified. */
const FROM = process.env.ALERTS_FROM_EMAIL || 'ClubHanger <alerts@clubhanger.com>'

/**
 * Optional monitored reply-to address for alert emails. Unset by default (every
 * send stays exactly as today); once a human sets `ALERTS_REPLY_TO`, `sendEmail`
 * passes it to Resend on every send and the digest builders below add a quiet
 * "just reply" footer line — never invite a reply nobody will read.
 */

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  /** Plain-text fallback; recommended for deliverability. */
  text?: string
  /**
   * The recipient's own token-scoped unsubscribe URL, when this email is part of
   * the alerts system. When present, `sendEmail` adds RFC 8058 one-click
   * `List-Unsubscribe` headers so Gmail/Yahoo's native "Unsubscribe" affordance
   * works and bulk-sender deliverability rules are met.
   */
  unsubscribeUrl?: string
  /**
   * A short, stable label for which template this is (e.g. "alert-digest",
   * "price-drop"). Sent to Resend as a `type` tag, which Resend echoes back on
   * `email.opened`/`email.clicked` webhook events — the only way to roll up
   * engagement stats per email type (see `resendWebhook.ts`/`emailEngagement.ts`).
   */
  emailType?: string
}

export type SendEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: 'no-key' | 'error'; detail?: string }

/**
 * RFC 8058 one-click unsubscribe headers, keyed off a per-recipient unsubscribe
 * URL. Returns `undefined` when there is no such URL (e.g. non-alert emails),
 * so callers can spread the result without an empty `headers: {}`.
 */
export function buildListUnsubscribeHeaders(
  unsubscribeUrl?: string
): Record<string, string> | undefined {
  if (!unsubscribeUrl) return undefined
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}

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
    const listUnsubscribeHeaders = buildListUnsubscribeHeaders(input.unsubscribeUrl)
    const replyTo = process.env.ALERTS_REPLY_TO || undefined
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
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(listUnsubscribeHeaders ? { headers: listUnsubscribeHeaders } : {}),
        ...(input.emailType ? { tags: [{ name: 'type', value: input.emailType }] } : {}),
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
 *
 * `preview` — up to 3 real, currently-matching listings ("here's what you'd
 * be watching"), from the same `getAlertDigestPreview` fetcher the "send a
 * sample digest" action already uses. Pass `null`/omit for a source_path
 * shape that can't be matched (e.g. a "watch this listing" alert, or a query
 * error) — the email then renders exactly as before, no preview section.
 * Pass `{ count: 0, samples: [] }` for a real, confirmed zero-match alert —
 * this renders the honest "None match right now" line rather than silently
 * omitting the section, so a genuinely empty search doesn't look untested.
 */
export function buildAlertConfirmEmail(opts: {
  context: string | null
  confirmUrl: string
  manageUrl: string
  unsubscribeUrl: string
  preview?: { count: number; samples: AlertDigestSample[] } | null
}): { subject: string; html: string; text: string } {
  const thing = (opts.context || '').trim()
  const forThing = thing ? ` for new ${escapeHtml(thing)} listings` : ''
  const forThingText = thing ? ` for new ${thing} listings` : ''
  const subject = thing
    ? `Confirm your ClubHanger alerts for ${thing}`
    : 'Confirm your ClubHanger listing alerts'

  const manageUrl = withUtm(opts.manageUrl, 'confirm')
  const samples = (opts.preview?.samples ?? []).map((s) => ({ ...s, url: withUtm(s.url, 'confirm') }))
  const previewHtml = !opts.preview
    ? ''
    : samples.length > 0
      ? `<p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 10px;">Here&rsquo;s what you&rsquo;d be watching:</p>
        <div style="margin:0 0 22px;">${samples.map((s) => sampleCardHtml(s)).join('')}</div>`
      : `<p style="font-size:13px;line-height:1.6;color:#64748b;background:#f8f7f4;border:1px solid #ece6dc;border-radius:10px;padding:10px 12px;margin:0 0 22px;">None match right now &mdash; you&rsquo;ll be first to know when one does.</p>`

  const previewCount = opts.preview?.count ?? null
  const preheaderText =
    previewCount != null
      ? previewCount > 0
        ? `${previewCount === 1 ? '1 listing matches' : `${previewCount} listings match`} right now — confirm to start getting alerts${forThingText}.`
        : `Confirm to start getting alerts${forThingText} — you'll be first to know when one matches.`
      : `One click to start getting alerts${forThingText}.`

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheaderHtml(preheaderText)}
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:28px 24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:20px;font-weight:700;margin:0 0 12px;">Almost there — confirm your alerts</h1>
        <p class="ch-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 22px;">
          Thanks for signing up${forThing} on ClubHanger. One click and you&rsquo;re set — we&rsquo;ll
          only email you when a genuinely new matching listing shows up, never anything else.
        </p>
        ${previewHtml}
        <p style="margin:0 0 4px;">
          <a href="${escapeAttr(opts.confirmUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            Confirm my alerts
          </a>
        </p>
        <p class="ch-muted" style="font-size:13px;line-height:1.6;color:#94a3b8;margin:20px 0 0;">
          Didn&rsquo;t request this? No action needed — you won&rsquo;t hear from us again.
        </p>
      </div>
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        <a href="${escapeAttr(manageUrl)}" style="color:#a89f8e;">Manage alerts</a> &middot;
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`

  const previewLines = !opts.preview
    ? ''
    : samples.length > 0
      ? `Here's what you'd be watching:\n${samples
          .map((s) => {
            const price = s.price != null ? formatUsd(s.price) : ''
            return `- ${s.title}${price ? ` — ${price}` : ''}\n  ${s.url}`
          })
          .join('\n')}\n\n`
      : `None match right now — you'll be first to know when one does.\n\n`

  const text = `ClubHanger

Almost there — confirm your alerts${forThingText}.

${previewLines}Confirm your email: ${opts.confirmUrl}

Didn't request this? No action needed — you won't hear from us again.
Manage alerts: ${manageUrl}
Unsubscribe: ${opts.unsubscribeUrl}`

  return { subject, html, text }
}

/**
 * Build the "here's your alerts manage link" email — sent on request from the
 * signed-out `/alerts/manage` page for a subscriber who lost their original
 * digest/confirm email and has no account to sign back in with. Deliberately
 * carries no context/subject-line personalization (the request is looked up
 * only by email, so we don't know which alert prompted it) and never implies
 * whether alerts exist — the caller only sends this when a real alert row was
 * found, so receiving the email itself is the (neutral, expected) signal.
 */
export function buildManageLinkEmail(opts: {
  manageUrl: string
}): { subject: string; html: string; text: string } {
  const subject = 'Your ClubHanger alerts manage link'

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:28px 24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:20px;font-weight:700;margin:0 0 12px;">Your alerts, one click away</h1>
        <p class="ch-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 22px;">
          You asked for a link to manage your ClubHanger alerts. Use it to view, pause, edit, or
          delete every alert tied to this email address — no account or password needed.
        </p>
        <p style="margin:0 0 4px;">
          <a href="${escapeAttr(opts.manageUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            Manage my alerts
          </a>
        </p>
        <p class="ch-muted" style="font-size:13px;line-height:1.6;color:#94a3b8;margin:20px 0 0;">
          Didn&rsquo;t request this? No action needed — this link only works for viewing alerts, it
          doesn&rsquo;t change anything on its own.
        </p>
      </div>
    </div>
  </body>
</html>`

  const text = `ClubHanger

Your alerts, one click away.

You asked for a link to manage your ClubHanger alerts. Use it to view, pause, edit, or
delete every alert tied to this email address — no account or password needed.

Manage my alerts: ${opts.manageUrl}

Didn't request this? No action needed — this link only works for viewing alerts, it doesn't
change anything on its own.`

  return { subject, html, text }
}

/**
 * Build the "confirm your new alerts email" email — sent to the NEW address when a
 * subscriber asks to move their alerts (double-opt-in, mirrors the original signup
 * confirm: nothing changes until this link is clicked, so a mistyped/malicious target
 * address can't silently steal someone's alerts). `manageUrl` is optional — omitted
 * when the request couldn't resolve any row's `unsubscribe_token` to link to.
 */
export function buildAlertEmailChangeConfirmEmail(opts: {
  oldEmail: string
  confirmUrl: string
  manageUrl?: string
}): { subject: string; html: string; text: string } {
  const subject = 'Confirm your new ClubHanger alerts email'

  const manageHtml = opts.manageUrl
    ? `<p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        <a href="${escapeAttr(opts.manageUrl)}" style="color:#a89f8e;">Manage alerts</a>
      </p>`
    : ''

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:28px 24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:20px;font-weight:700;margin:0 0 12px;">Confirm your new alerts email</h1>
        <p class="ch-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 22px;">
          Someone asked to move ClubHanger alerts from <strong>${escapeHtml(opts.oldEmail)}</strong> to this
          address. Click below to confirm — until you do, alerts keep going to the old address, and
          nothing changes here.
        </p>
        <p style="margin:0 0 4px;">
          <a href="${escapeAttr(opts.confirmUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            Confirm this email
          </a>
        </p>
        <p class="ch-muted" style="font-size:13px;line-height:1.6;color:#94a3b8;margin:20px 0 0;">
          Didn&rsquo;t request this? No action needed — ignore this email and nothing will change.
        </p>
      </div>
      ${manageHtml}
    </div>
  </body>
</html>`

  const text = `ClubHanger

Confirm your new alerts email.

Someone asked to move ClubHanger alerts from ${opts.oldEmail} to this address. Click below to
confirm — until you do, alerts keep going to the old address, and nothing changes here.

Confirm this email: ${opts.confirmUrl}

Didn't request this? No action needed — ignore this email and nothing will change.
${opts.manageUrl ? `\nManage alerts: ${opts.manageUrl}` : ''}`

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
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <h1 class="ch-heading" style="font-size:20px;font-weight:700;margin:0 0 12px;">You have a new message</h1>
      <p class="ch-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 20px;">
        Someone sent you a message on ClubHanger. Click below to read it and reply.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeAttr(opts.threadUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
          Read message
        </a>
      </p>
      <p class="ch-muted" style="font-size:13px;line-height:1.6;color:#64748b;margin:0;">
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
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <h1 class="ch-heading" style="font-size:20px;font-weight:700;margin:0 0 4px;">New listing inquiry</h1>
      <p class="ch-muted" style="font-size:14px;color:#64748b;margin:0 0 20px;">Sent to the <strong>${escapeHtml(persona)}</strong> persona &middot; routed to you as concierge.</p>
      <table style="width:100%;font-size:14px;color:#334155;border-collapse:collapse;margin:0 0 20px;">
        <tr><td style="padding:6px 0;color:#94a3b8;width:96px;">Listing</td><td style="padding:6px 0;"><a href="${escapeAttr(opts.listingUrl)}" style="color:#0284c7;">${escapeHtml(opts.listingTitle)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#94a3b8;">From</td><td class="ch-text" style="padding:6px 0;">${escapeHtml(from)}</td></tr>
      </table>
      <div class="ch-card" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.6;color:#0f172a;white-space:pre-wrap;margin:0 0 22px;">${escapeHtml(opts.body)}</div>
      <p style="margin:0 0 8px;">
        <a href="${escapeAttr(opts.threadUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:11px 20px;border-radius:10px;">
          Reply in-thread
        </a>
      </p>
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#94a3b8;margin:14px 0 0;">
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

/**
 * Build the price-drop notification email for one specific matching listing —
 * distinct from `buildAlertDigestEmail`'s aggregate weekly count, this fires
 * with enough detail (photo, old-vs-new price) to be useful standalone,
 * matching GOAL.md's "best listing alert email in aviation" bar. `photoUrl`
 * is optional — the layout degrades gracefully (no broken `<img>`) when a
 * listing has no usable photo. `periodLabel` (default "this week") names how
 * recently the drop happened — the send path is a daily/weekly cron, never
 * real-time, so the copy must never claim "just dropped" (GOAL.md honesty
 * rule); pass "yesterday" for a daily-frequency alert.
 */
export function buildPriceDropEmail(opts: {
  title: string
  photoUrl: string | null
  previousPrice: number
  askingPrice: number
  listingUrl: string
  manageUrl: string
  unsubscribeUrl: string
  /** Token-scoped "get fewer emails" link — present for daily- or weekly-
   *  frequency alerts (a monthly alert has no lower cadence to offer).
   *  Renders as a third footer link alongside Manage/Unsubscribe. */
  frequencyUrl?: string
  /** Which cadence `frequencyUrl` switches TO — default `'weekly'` (the
   *  daily→weekly link, byte-exact with every send before this option
   *  existed). Pass `'monthly'` for the weekly→monthly link so the text-part
   *  label names the real target instead of always saying "weekly". */
  frequencyTarget?: 'weekly' | 'monthly'
  periodLabel?: string
  /** Names what kind of drop this is — default "price drop" (aircraft); pass
   *  "buy-in drop" for a partnership whose "price" is a buy-in share, not an
   *  asking price. Same convention as `buildAlertDigestEmail`'s `dropNoun`. */
  dropNoun?: string
  /** Formatted share label (e.g. "1/4 Share") — partnership drops only, shown
   *  under the title same as `AlertDigestSample.shareType` on digest cards. */
  shareType?: string | null
  /** Honest one-line market-context sentence for the alert's family — "14
   *  Cessna 172s listed right now, median asking $89k" (see
   *  `getMarketPulseLine`/`getPartnershipMarketPulseLine`). Same convention as
   *  `buildAlertDigestEmail`'s `marketPulse`: omitted whenever the caller
   *  couldn't compute a trustworthy one — never a fabricated number. */
  marketPulse?: string
}): { subject: string; html: string; text: string } {
  const pct = Math.round(((opts.previousPrice - opts.askingPrice) / opts.previousPrice) * 100)
  const oldPrice = formatUsd(opts.previousPrice)
  const newPrice = formatUsd(opts.askingPrice)
  const dropNoun = opts.dropNoun ?? 'price drop'
  const subject = `${pct}% ${dropNoun} — ${opts.title} now ${newPrice}`
  const listingUrl = withUtm(opts.listingUrl, 'price_drop')
  const manageUrl = withUtm(opts.manageUrl, 'price_drop')

  const photo = opts.photoUrl
    ? `<img src="${escapeAttr(opts.photoUrl)}" alt="${escapeAttr(opts.title)}" width="472" style="display:block;width:100%;max-width:472px;height:auto;border-radius:12px;margin:0 0 18px;" />`
    : ''
  const marketPulseHtml = opts.marketPulse
    ? `<p style="margin:0 0 16px;font-size:12px;color:#0369a1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:8px 12px;">${escapeHtml(opts.marketPulse)}</p>`
    : ''
  const preheaderText = `${pct}% ${dropNoun} — ${opts.title} now ${newPrice} (was ${oldPrice}).`

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheaderHtml(preheaderText)}
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        ${photo}
        <h1 class="ch-heading" style="font-size:19px;font-weight:700;margin:0 0 10px;">${escapeHtml(opts.title)}</h1>
        ${opts.shareType ? `<p class="ch-muted" style="margin:0 0 8px;font-size:13px;color:#64748b;">${escapeHtml(opts.shareType)}</p>` : ''}
        <p style="margin:0 0 14px;">
          <span style="display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;">
            ${pct}% ${dropNoun}
          </span>
        </p>
        <p style="margin:0 0 22px;">
          <span style="color:#94a3b8;text-decoration:line-through;font-size:15px;margin-right:8px;">${oldPrice}</span>
          <span style="color:#0f172a;font-weight:700;font-size:22px;">${newPrice}</span>
        </p>
        ${marketPulseHtml}
        <p style="margin:0;">
          <a href="${escapeAttr(listingUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            View listing
          </a>
        </p>
      </div>
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        You&rsquo;re receiving this because you have an alert set up on ClubHanger.
        <a href="${escapeAttr(manageUrl)}" style="color:#a89f8e;">Manage alerts</a>
        &middot;
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>${opts.frequencyUrl ? ` &middot; <a href="${escapeAttr(opts.frequencyUrl)}" style="color:#a89f8e;">Get fewer emails</a>` : ''}.
      </p>
    </div>
  </body>
</html>`

  const periodLabel = opts.periodLabel ?? 'this week'
  const titleLine = opts.shareType ? `${opts.title} (${opts.shareType})` : opts.title
  const marketPulseText = opts.marketPulse ? `\n${opts.marketPulse}\n` : ''
  const text = `${titleLine} dropped ${pct}% ${periodLabel} — now ${newPrice} (was ${oldPrice})
${marketPulseText}
View listing: ${listingUrl}

Manage alerts: ${manageUrl}
Unsubscribe: ${opts.unsubscribeUrl}${opts.frequencyUrl ? `\nGet fewer emails (switch to ${opts.frequencyTarget ?? 'weekly'}): ${opts.frequencyUrl}` : ''}`

  return { subject, html, text }
}

/**
 * "The listing you were watching for a price drop is no longer available."
 * Sent exactly once by the alert-digest cron when a `listingId`-scoped watch
 * alert's target row goes missing or leaves `status: 'active'` (sold,
 * removed, etc.) — GOAL.md's honesty gate: say so once rather than the alert
 * silently never firing again with no explanation. The cron pauses the alert
 * right after this sends, so it's genuinely a one-time notice.
 */
export function buildListingUnavailableEmail(opts: {
  title: string
  browseUrl: string
  manageUrl: string
  unsubscribeUrl: string
  /** Defaults to 'aircraft' so the original aircraft watch-alert copy (`sold
   *  or taken off the market` / `Browse similar aircraft`) is byte-for-byte
   *  unchanged. Partnerships use `'closed'` status, not `'sold'`, and their
   *  "price" is a buy-in share — `'partnership'` swaps in copy that matches. */
  noun?: 'aircraft' | 'partnership'
}): { subject: string; html: string; text: string } {
  const subject = `${opts.title} is no longer available`
  const isPartnership = opts.noun === 'partnership'
  const statusLine = isPartnership
    ? "It&rsquo;s been filled or taken down, so we&rsquo;ve stopped watching it for a buy-in drop &mdash; this is the last email you&rsquo;ll get about this listing."
    : "It&rsquo;s been sold or taken off the market, so we&rsquo;ve stopped watching it for a price drop &mdash; this is the last email you&rsquo;ll get about this listing."
  const statusLineText = isPartnership
    ? "It's been filled or taken down, so we've stopped watching it for a buy-in drop — this is the last email you'll get about this listing."
    : "It's been sold or taken off the market, so we've stopped watching it for a price drop — this is the last email you'll get about this listing."
  const browseLabel = isPartnership ? 'Browse similar partnerships' : 'Browse similar aircraft'

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:19px;font-weight:700;margin:0 0 10px;">${escapeHtml(opts.title)} is no longer available</h1>
        <p class="ch-text" style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#475569;">
          ${statusLine}
        </p>
        <p style="margin:0;">
          <a href="${escapeAttr(opts.browseUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            ${browseLabel}
          </a>
        </p>
      </div>
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        You&rsquo;re receiving this because you had a watch alert set up on ClubHanger.
        <a href="${escapeAttr(opts.manageUrl)}" style="color:#a89f8e;">Manage alerts</a>
        &middot;
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`

  const text = `${opts.title} is no longer available

${statusLineText}

${browseLabel}: ${opts.browseUrl}

Manage alerts: ${opts.manageUrl}
Unsubscribe: ${opts.unsubscribeUrl}`

  return { subject, html, text }
}

/**
 * One-time "hasn't matched anything yet, widen it?" email for a confirmed
 * alert that's never matched a single listing since it was created. Caller
 * (the alert-digest cron) has already re-verified BOTH the current 0-match
 * state and the widened candidate's real >0 match count — this builder never
 * re-derives or guesses either number, it only renders what it's given.
 */
export function buildWidenSuggestionEmail(opts: {
  context: string | null
  /** e.g. "Show all Cessna listings" / "Search every state" — from `computeWidenCandidate`. */
  widenDescription: string
  widenCount: number
  widenNoun: 'listing' | 'pilot'
  manageUrl: string
  unsubscribeUrl: string
}): { subject: string; html: string; text: string } {
  const label = opts.context?.trim() || 'Your alert'
  const subject = `${label} hasn't matched anything yet — widen it?`
  const manageUrl = withUtm(opts.manageUrl, 'widen')
  const countLabel = `${opts.widenCount} ${opts.widenNoun}${opts.widenCount === 1 ? '' : 's'}`

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheaderHtml(`${label} hasn't matched anything yet. ${opts.widenDescription} — ${countLabel} match right now.`)}
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:19px;font-weight:700;margin:0 0 10px;">${escapeHtml(label)} hasn&rsquo;t matched anything yet</h1>
        <p class="ch-text" style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#475569;">
          It&rsquo;s been a few weeks with nothing to show &mdash; want to widen it? <strong>${escapeHtml(opts.widenDescription)}</strong> would match <strong>${countLabel}</strong> right now.
        </p>
        <p style="margin:0;">
          <a href="${escapeAttr(manageUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            Widen this alert
          </a>
        </p>
      </div>
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        You&rsquo;re receiving this because you have an alert on ClubHanger that hasn&rsquo;t sent anything yet.
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`

  const text = `${label} hasn't matched anything yet

It's been a few weeks with nothing to show — want to widen it? ${opts.widenDescription} would match ${countLabel} right now.

Widen this alert: ${manageUrl}

Unsubscribe: ${opts.unsubscribeUrl}`

  return { subject, html, text }
}

/**
 * One-time "you're confirmed, nothing matches yet" welcome email — sent
 * instead of silence when a subscriber double-opt-in confirms an alert that
 * currently has zero live matches (the confirm route used to just return
 * without sending anything in that case, the one lifecycle path that ended
 * in dead air). Never fabricates a match; `widen` — when passed — is a
 * single honest one-step-looser candidate the caller has already
 * re-verified against a real live count (see `getEmptyStateWidenSuggestion`),
 * same rule `buildWidenSuggestionEmail`'s later "hasn't matched in weeks"
 * nudge uses. Omitted entirely when there's no honest widen candidate.
 */
export function buildAlertZeroMatchWelcomeEmail(opts: {
  context: string | null
  frequency: AlertFrequency
  manageUrl: string
  unsubscribeUrl: string
  widen?: { description: string; count: number; noun: 'listing' | 'pilot'; url: string } | null
}): { subject: string; html: string; text: string } {
  const label = opts.context?.trim() || 'Your alert'
  const subject = `${label} is confirmed — we're watching`
  const manageUrl = withUtm(opts.manageUrl, 'confirm')

  const widenHtml = opts.widen
    ? `<div style="background:#f8f7f4;border:1px solid #ece6dc;border-radius:10px;padding:14px 16px;margin:0 0 22px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#475569;">
            In the meantime: <strong>${escapeHtml(opts.widen.description)}</strong> would show <strong>${opts.widen.count} ${opts.widen.noun}${opts.widen.count === 1 ? '' : 's'}</strong> right now.
            <a href="${escapeAttr(withUtm(opts.widen.url, 'widen'))}" style="color:#0284c7;">Widen this alert &rarr;</a>
          </p>
        </div>`
    : ''
  const widenText = opts.widen
    ? `\nIn the meantime: ${opts.widen.description} would show ${opts.widen.count} ${opts.widen.noun}${opts.widen.count === 1 ? '' : 's'} right now — ${withUtm(opts.widen.url, 'widen')}\n`
    : ''

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheaderHtml(`You're confirmed. Nothing matches ${label} right now — we're watching and will email you the moment something does.`)}
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:19px;font-weight:700;margin:0 0 10px;">You&rsquo;re confirmed &mdash; we&rsquo;re watching</h1>
        <p class="ch-text" style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#475569;">
          Nothing matches <strong>${escapeHtml(label)}</strong> right now, so there&rsquo;s no digest to send just yet. We&rsquo;ll email you the moment something does &mdash; checks run ${opts.frequency}.
        </p>
        ${widenHtml}
        <p style="margin:0;">
          <a href="${escapeAttr(manageUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            Manage your alerts
          </a>
        </p>
      </div>
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        You&rsquo;re receiving this because you just confirmed an alert on ClubHanger.
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`

  const text = `You're confirmed — we're watching

Nothing matches ${label} right now, so there's no digest to send just yet. We'll email you the moment something does — checks run ${opts.frequency}.
${widenText}
Manage your alerts: ${manageUrl}

Unsubscribe: ${opts.unsubscribeUrl}`

  return { subject, html, text }
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

/** Compact price label: "$118k" or "$1.3M" — a standalone copy of
 *  `formatPriceK` (src/lib/utils.ts) kept local so this file stays
 *  import-free (a deliberate existing convention — see the top of the
 *  file — so its plain-text-email builders stay trivially unit-testable
 *  without pulling in React/Tailwind-adjacent deps transitively). */
function formatPriceK(dollars: number): string {
  if (dollars >= 1_000_000) {
    const m = Math.round(dollars / 100_000) / 10
    return `$${m}M`
  }
  const k = Math.round(dollars / 1_000)
  return `$${k}k`
}

/**
 * Plain-text rendering of a `CompResult` (the on-site "vs market" comp,
 * `src/lib/aircraftComps.ts`) for the digest email — same honesty floors and
 * copy as the on-site `CompPill` ("~N% below avg · $Xk median · N comps"),
 * just without the badge markup. Pure; caller is responsible for the same
 * `compVsMarket` null check the on-site pill already requires (no comp →
 * no line, never a fabricated claim).
 */
export function compLabel(comp: CompResult): string {
  const medianK = formatPriceK(comp.median)
  const suffix = ` · ${medianK} median · ${comp.count} comps`
  if (comp.kind === 'near') return `Near avg${suffix}`
  return `~${comp.pct}% ${comp.kind} avg${suffix}`
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
 * Hidden inbox-preview ("preheader") line — Gmail/Apple Mail/etc. show the
 * first visible-ish text after `<body>` as the list-view preview snippet;
 * without one they fall back to our boilerplate "ClubHanger" header. Renders
 * as a zero-height, `display:none` div right after `<body>` so it never shows
 * in the rendered email itself, padded with `&nbsp;&zwnj;` so inbox clients
 * (which often show 90-100+ chars) don't pull in the visible header text
 * after it. HTML-only — plain-text emails have no "preview line" concept, so
 * callers must NOT include this in their `text` return value.
 */
function preheaderHtml(text: string): string {
  const padding = '&nbsp;&zwnj;'.repeat(40)
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(text)}${padding}</div>`
}

/**
 * Shared dark-mode-safe email `<head>` — opts every builder into explicit
 * light+dark `color-scheme` support so Gmail/Apple Mail/Outlook.com dark-mode
 * inboxes render deliberately-chosen dark colors instead of auto-inverting
 * (and mangling) the light cream/white inline styles. Insert once inside
 * `<head>`; pair with the `ch-body`/`ch-card`/`ch-heading`/`ch-text`/
 * `ch-muted`/`ch-brand` classes on whichever elements a builder wants
 * remapped — anything left unclassed (CTA buttons, status badges) keeps its
 * explicit light-mode colors in both schemes because those already carry
 * their own fixed-contrast background + text pair that reads fine regardless
 * of the surrounding page (deliberate, not an oversight).
 */
function emailColorSchemeHead(): string {
  return `<meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      @media (prefers-color-scheme: dark) {
        .ch-body { background:#17140f !important; }
        .ch-card { background:#221d15 !important; border-color:#3a3327 !important; box-shadow:none !important; }
        .ch-heading { color:#f3ecdd !important; }
        .ch-text { color:#cbc3b3 !important; }
        .ch-muted, .ch-muted a { color:#8f8879 !important; }
        .ch-brand { color:#38bdf8 !important; }
      }
    </style>`
}

/**
 * Tag a site-page link with UTM params so a visit driven by an alert email is
 * attributable in analytics (PostHog auto-captures UTM params client-side, no
 * receiving-side change needed). Preserves any existing query params. Never
 * apply this to the `/api/alerts/*` confirm/unsubscribe/frequency redirect
 * links — those tokens must stay byte-exact for the route to resolve them.
 * Falls back to the raw URL if it isn't parseable as an absolute URL.
 */
function withUtm(url: string, campaign: 'confirm' | 'digest' | 'price_drop' | 'combined' | 'widen'): string {
  try {
    const u = new URL(url)
    u.searchParams.set('utm_source', 'alert_email')
    u.searchParams.set('utm_medium', 'email')
    u.searchParams.set('utm_campaign', campaign)
    return u.toString()
  } catch {
    return url
  }
}

/** One real matching listing shown as a preview card in the digest email.
 *  `previousPrice` set only for a price-drop sample (renders struck-through
 *  next to the current price); omitted/undefined for a new-listing sample. */
export type AlertDigestSample = {
  title: string
  photoUrl: string | null
  /** True when `photoUrl` is a per-make placeholder, not a real harvested
   *  photo — renders an honest "Not actual plane photo" caption, same
   *  convention as every listing card site-wide. */
  isPlaceholder: boolean
  year: number | null
  ttaf: number | null
  /** Formatted share label (e.g. "1/4 Share") — partnership samples only.
   *  Rendered in place of `ttaf` (aircraft-only) in the specs line. */
  shareType?: string | null
  /** "Looking for" summary (e.g. "Cessna, Cirrus · 172, SR22") — seeker
   *  samples only. Takes priority over `shareType`/`ttaf` in the specs line;
   *  seekers have neither a share type nor a TTAF. */
  lookingFor?: string | null
  location: string | null
  price: number | null
  previousPrice?: number | null
  /** Honest market-context line ("~12% below avg · $52k median · 8 comps"),
   *  from `compLabel(compVsMarket(...))` — aircraft new-listing samples only.
   *  Omitted whenever the family has too few comps to publish a trustworthy
   *  claim (same honesty floor as the on-site "vs market" pill) — never a
   *  fabricated/guessed comparison. */
  compLabel?: string | null
  /** True only when the comp behind `compLabel` is `kind === 'below'` — the
   *  "good deal for a buyer" case the on-site `CompPill` highlights in
   *  emerald. Used purely to pick the pill color; never set without
   *  `compLabel` also set. */
  compBelowAvg?: boolean
  url: string
  /** Set only by the combined-digest cross-section dedupe pass
   *  (`dedupeDigestSectionSamples`) — this same listing also matched another
   *  of the subscriber's alerts in this send, so its card was shown once
   *  here rather than duplicated under that section too. Honesty note, not a
   *  new match signal. */
  alsoMatchesLabel?: string
  /** This sample's underlying row id (`aircraft_for_sale` / `partnerships` /
   *  `partnership_seekers`) — used only to build the per-sample "Not
   *  relevant?" feedback link (see `digestFeedbackBaseUrl`). Omitted
   *  entirely (e.g. the pre-confirmation preview in `buildAlertConfirmEmail`)
   *  just means that link never renders for this card. */
  id?: string
  /** Which table `id` refers to — lets the digest-feedback route rebuild the
   *  listing's real detail path without trusting a client-supplied URL. */
  type?: 'aircraft' | 'partnership' | 'seeker'
}

/**
 * Pick the single best price-drop sample from a set — the one with the
 * largest genuine `%` decrease, not just the most recent — for surfacing via
 * the rich single-listing `buildPriceDropEmail` template. Samples with no
 * usable before/after price (missing `previousPrice`/`price`, or no real
 * decrease) are ignored. Returns null when nothing qualifies.
 */
export function pickBestPriceDropSample(samples: AlertDigestSample[]): AlertDigestSample | null {
  let best: AlertDigestSample | null = null
  let bestPct = 0
  for (const s of samples) {
    if (s.previousPrice == null || s.price == null || s.previousPrice <= s.price) continue
    const pct = (s.previousPrice - s.price) / s.previousPrice
    if (!best || pct > bestPct) {
      best = s
      bestPct = pct
    }
  }
  return best
}

function specsLine(s: AlertDigestSample): string {
  const parts: string[] = []
  if (s.year) parts.push(String(s.year))
  if (s.lookingFor) parts.push(s.lookingFor)
  else if (s.shareType) parts.push(s.shareType)
  else if (s.ttaf) parts.push(`${s.ttaf.toLocaleString()} TTAF`)
  if (s.location) parts.push(s.location)
  return parts.join(' &middot; ')
}

/** Builds the one-click "Not relevant?" link for a single digest sample —
 *  see the digest-feedback route's `listing` param. `undefined` whenever the
 *  caller has no `digestFeedbackBaseUrl` (no token yet, e.g. the
 *  pre-confirmation preview) or the sample carries no `id` — never a broken
 *  link. `s.type` is forwarded so the route can rebuild the listing's real
 *  detail path server-side instead of trusting a client-supplied URL. */
function notRelevantLink(baseUrl: string | undefined, s: AlertDigestSample): string | undefined {
  if (!baseUrl || !s.id) return undefined
  const typeParam = s.type ? `&type=${s.type}` : ''
  return `${baseUrl}&listing=${encodeURIComponent(s.id)}${typeParam}&title=${encodeURIComponent(s.title)}`
}

function sampleCardHtml(s: AlertDigestSample, notRelevantUrl?: string): string {
  const photo = s.photoUrl
    ? `<img src="${escapeAttr(s.photoUrl)}" alt="${escapeAttr(s.title)}" width="88" height="66" style="width:88px;height:66px;object-fit:cover;border-radius:8px;flex-shrink:0;display:block;" />`
    : ''
  const specs = specsLine(s)
  const priceHtml =
    s.previousPrice != null && s.price != null && s.previousPrice !== s.price
      ? `<span style="color:#94a3b8;text-decoration:line-through;font-size:12px;margin-right:6px;">${formatUsd(s.previousPrice)}</span><span style="color:#0f172a;font-weight:700;font-size:15px;">${formatUsd(s.price)}</span>`
      : s.price != null
        ? `<span style="color:#0f172a;font-weight:700;font-size:15px;">${formatUsd(s.price)}</span>`
        : ''
  const placeholderNote = s.isPlaceholder
    ? `<p style="margin:2px 0 0;font-size:10px;color:#a89f8e;">Not actual plane photo</p>`
    : ''
  const alsoMatchesNote = s.alsoMatchesLabel
    ? `<p style="margin:2px 0 0;font-size:10px;color:#0369a1;">${escapeHtml(s.alsoMatchesLabel)}</p>`
    : ''
  // Fixed-contrast background+text pair (not a plain text color) so it reads
  // correctly in both light and dark inboxes without an emailColorSchemeHead
  // class — same convention this file documents for status badges/CTAs.
  const compLabelHtml = s.compLabel
    ? `<p style="margin:3px 0 0;"><span style="display:inline-block;background:${s.compBelowAvg ? '#ecfdf5' : '#f1f5f9'};color:${s.compBelowAvg ? '#047857' : '#475569'};padding:1px 7px;border-radius:9999px;font-size:11px;font-weight:600;">${escapeHtml(s.compLabel)}</span></p>`
    : ''
  // Rendered as a sibling AFTER the card's own <a>, never nested inside it
  // (nested anchors are invalid HTML and unreliable across email clients).
  // Right-aligned + tiny so it reads as a quiet footer affordance, never
  // competing with the listing CTA above it.
  const notRelevantHtml = notRelevantUrl
    ? `<p style="margin:2px 0 0;text-align:right;"><a href="${escapeAttr(notRelevantUrl)}" style="font-size:10px;color:#c2b8a3;text-decoration:none;">Not relevant?</a></p>`
    : ''

  return `<div style="padding:12px 0;border-bottom:1px solid #ece6dc;">
        <a href="${escapeAttr(s.url)}" style="display:flex;gap:12px;text-decoration:none;color:inherit;">
          ${photo}
          <div style="min-width:0;">
            <p style="margin:0 0 3px;font-weight:700;font-size:14px;color:#0f172a;">${escapeHtml(s.title)}</p>
            ${specs ? `<p style="margin:0 0 4px;font-size:12px;color:#64748b;">${specs}</p>` : ''}
            ${priceHtml ? `<p style="margin:0;">${priceHtml}</p>` : ''}
            ${compLabelHtml}
            ${placeholderNote}
            ${alsoMatchesNote}
          </div>
        </a>
        ${notRelevantHtml}
      </div>`
}

/**
 * Build the weekly digest email for a confirmed alert subscriber.
 * Sent when there's a new matching listing and/or a genuine price drop on a
 * matching listing since their last digest. `newCount`/`dropCount` are named
 * distinctly in the copy rather than summed — GOAL.md requires alert content
 * be honest, and a price drop on an existing listing is not "a new listing."
 * `samples` (optional, up to 3 real matching listings — aircraft and
 * partnership new-listing alerts; seeker alerts and partnership price-drop
 * alerts still get the CTA-only fallback) render as preview cards above the
 * "view all" CTA; when omitted or empty the email still renders cleanly with
 * the CTA alone. `dropNoun`
 * (default "price drop") names what kind of drop `dropCount` counts — e.g.
 * partnership alerts pass "buy-in drop" since their "price" is a buy-in
 * share, not an asking price.
 */
export function buildAlertDigestEmail(opts: {
  context: string | null
  newCount: number
  dropCount: number
  dropNoun?: string
  listingsUrl: string
  manageUrl: string
  unsubscribeUrl: string
  /** Token-scoped "get fewer emails" link — present for daily- or weekly-
   *  frequency alerts (a monthly alert has no lower cadence to offer).
   *  Renders as a third footer link alongside Manage/Unsubscribe. */
  frequencyUrl?: string
  /** Which cadence `frequencyUrl` switches TO — default `'weekly'` (the
   *  daily→weekly link, byte-exact with every send before this option
   *  existed). Pass `'monthly'` for the weekly→monthly link so the text-part
   *  label names the real target instead of always saying "weekly". */
  frequencyTarget?: 'weekly' | 'monthly'
  /** Token-scoped "switch to daily" upgrade link — present only when the
   *  caller has already confirmed (via `shouldOfferDailyUpgrade`) this is a
   *  weekly-cadence alert whose send genuinely cleared the volume bar.
   *  Renders as one honest line above the footer; never an upsell on a
   *  quiet search. */
  upgradeUrl?: string
  samples?: AlertDigestSample[]
  /** When set, renders this send as an honest preview rather than a real
   *  digest firing: subject gets a `Sample: ` prefix, and an on-brand banner
   *  with this cadence line (e.g. "your real weekly digest arrives
   *  automatically when there's a genuine match.") renders at the top of both
   *  bodies. Also switches the count/body copy from "new this week" framing
   *  to honest "current matches" framing, since a sample's matches aren't
   *  necessarily new. Used by the owner-scoped "Send me a sample digest"
   *  action so a preview can never be mistaken for a real alert firing. */
  sampleNote?: string
  /** Set for the one-time "instant first digest" sent right when a subscriber
   *  confirms an alert that already has live matches (see the alert confirm
   *  route) — a real send, not a sample, but at t=0 there's no "since last
   *  digest" window to call these "new this week." Switches to the same
   *  honest "current match" count framing as `sampleNote`, minus the sample
   *  banner/subject-prefix, plus copy noting this was sent at confirm time. */
  firstSend?: boolean
  /** Optional one-click "also want alerts for X?" suggestion rendered above
   *  the footer (see `getCrossSellSuggestion` / GOAL.md's digest -> grow
   *  loop) — no second opt-in needed, `acceptUrl` is a plain GET link (see
   *  `/api/alerts/digest-cross-sell`) so it works straight from the email
   *  client. Omitted whenever no honest suggestion applies. */
  crossSell?: { label: string; acceptUrl: string }
  /** Honest one-line market-context sentence for the alert's family — "14
   *  Cessna 172s listed right now, median asking $89k" (see
   *  `getMarketPulseLine`). Omitted whenever the caller couldn't compute a
   *  trustworthy one (make-only/uncurated/multi-model alerts, or a family
   *  too sparse to trust a median) — never a fabricated number. */
  marketPulse?: string
  /** Token-scoped one-click "was this useful" links (see the digest-feedback
   *  route) — rendered as a small 👍/👎 footer row above Manage/Unsubscribe,
   *  only when BOTH are present (they're always built as a pair). Omitted
   *  whenever the alert has no `unsubscribe_token` yet (pre-migration row),
   *  same precedent as `frequencyUrl`. */
  digestFeedbackUpUrl?: string
  digestFeedbackDownUrl?: string
  /** Base URL (token embedded, no `vote`/`listing`/`type`/`title` yet — see
   *  `notRelevantLink`) for each sample's own "Not relevant?" link. Same
   *  no-token graceful-degrade as `digestFeedbackUpUrl` — a sample with no
   *  `id` also never gets the link even when this is set. */
  digestFeedbackBaseUrl?: string
  /** Plain (non-tokenized) link to the alert's own source_path with the
   *  existing `share=alert` marker (see `withShareParam`) — lets a
   *  subscriber forward this exact search to a co-buyer without exposing
   *  manage/unsubscribe control. Renders as one quiet line above the
   *  footer. Omitted when the alert has no source_path to share. */
  shareUrl?: string
  /** Token-scoped link to `/alerts/digest/view` — renders the alert's
   *  CURRENT live matches server-side (never the archived HTML of this
   *  exact send, since none is stored), the standard "View in browser"
   *  affordance for image-blocking clients. Renders as one quiet link near
   *  the top of the email. Omitted whenever the alert has no
   *  `unsubscribe_token` yet, same graceful-degrade as `manageUrl`. */
  viewUrl?: string
}): { subject: string; html: string; text: string } {
  const thing = (opts.context || '').trim()
  const forThing = thing ? ` ${escapeHtml(thing)}` : ''
  const forThingText = thing ? ` ${thing}` : ''
  const samples = (opts.samples ?? []).map((s) => ({ ...s, url: withUtm(s.url, 'digest') }))
  const listingsUrl = withUtm(opts.listingsUrl, 'digest')
  const manageUrl = withUtm(opts.manageUrl, 'digest')
  const viewUrl = opts.viewUrl ? withUtm(opts.viewUrl, 'digest') : undefined
  const dropNoun = opts.dropNoun ?? 'price drop'
  const isSample = !!opts.sampleNote
  const isFirstSend = !isSample && !!opts.firstSend
  const total = opts.newCount + opts.dropCount

  let countLabel: string
  if (isSample) {
    countLabel = total === 1 ? '1 current match' : `${total} current matches`
  } else if (isFirstSend) {
    countLabel = total === 1 ? '1 match right now' : `${total} matches right now`
  } else {
    const parts: string[] = []
    if (opts.newCount > 0) parts.push(opts.newCount === 1 ? '1 new listing' : `${opts.newCount} new listings`)
    if (opts.dropCount > 0) parts.push(opts.dropCount === 1 ? `1 ${dropNoun}` : `${opts.dropCount} ${dropNoun}s`)
    countLabel = parts.join(' + ')
  }
  const countLabelText = countLabel
  const subjectBase = thing ? `${countLabel} — ${thing} on ClubHanger` : `${countLabel} on ClubHanger`
  // Name the standout listing in the subject when there's exactly one genuine
  // new match (no price drops, no sample/first-send framing) and a usable
  // sample — never fabricate a title/price that isn't in the data, so every
  // other case falls back to the generic count-only subject above.
  const standout =
    !isSample && !isFirstSend && opts.newCount === 1 && opts.dropCount === 0 && samples.length === 1
      ? samples[0]
      : null
  const subject =
    standout && standout.title && standout.price != null
      ? `New: ${standout.title} at ${formatUsd(standout.price)}${thing ? ` — your ${thing} alert` : ' — new match on ClubHanger'}`
      : isSample
        ? `Sample: ${subjectBase}`
        : subjectBase

  const samplesHtml = samples.length
    ? `<div style="margin:0 0 20px;">${samples.map((s) => sampleCardHtml(s, notRelevantLink(opts.digestFeedbackBaseUrl, s))).join('')}</div>`
    : ''
  const remaining = total - samples.length
  const ctaLabel = samples.length > 0 && remaining > 0 ? `See all${forThing} matches` : `View${forThing} listings`
  const bodyCopy = isSample
    ? `${countLabel} for your${forThing} alert right now.`
    : isFirstSend
      ? `${countLabel} for your${forThing} alert — here's what's live the moment you confirmed. We'll email again automatically when something new matches.`
      : `There ${total === 1 ? 'is' : 'are'} ${countLabel} matching your${forThing} alert on ClubHanger this week.`
  const sampleBannerHtml = isSample
    ? `<p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;">Sample email &mdash; ${escapeHtml(opts.sampleNote!)}</p>`
    : ''
  const crossSellHtml = opts.crossSell
    ? `<div style="margin:16px 0 0;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 18px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#0f172a;">${escapeHtml(opts.crossSell.label)}</p>
        <a href="${escapeAttr(opts.crossSell.acceptUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:9px 16px;border-radius:8px;">
          Yes, alert me too &rarr;
        </a>
      </div>`
    : ''
  const marketPulseHtml = opts.marketPulse
    ? `<p style="margin:0 0 16px;font-size:12px;color:#0369a1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:8px 12px;">${escapeHtml(opts.marketPulse)}</p>`
    : ''
  const upgradeNudgeHtml = opts.upgradeUrl
    ? `<p style="margin:16px 4px 0;font-size:12px;line-height:1.6;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;">Busy week for this search — <a href="${escapeAttr(opts.upgradeUrl)}" style="color:#b45309;font-weight:600;">switch to daily digests</a>.</p>`
    : ''
  const digestFeedbackHtml =
    opts.digestFeedbackUpUrl && opts.digestFeedbackDownUrl
      ? `<p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:16px 4px 0;">Was this digest useful? <a href="${escapeAttr(opts.digestFeedbackUpUrl)}" style="color:#a89f8e;">&#128077; Yes</a> &middot; <a href="${escapeAttr(opts.digestFeedbackDownUrl)}" style="color:#a89f8e;">&#128078; No</a></p>`
      : ''
  const digestFeedbackText =
    opts.digestFeedbackUpUrl && opts.digestFeedbackDownUrl
      ? `\nWas this digest useful? Yes: ${opts.digestFeedbackUpUrl}  No: ${opts.digestFeedbackDownUrl}\n`
      : ''
  const shareHtml = opts.shareUrl
    ? `<p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:16px 4px 0;">Buying with a partner? <a href="${escapeAttr(opts.shareUrl)}" style="color:#a89f8e;text-decoration:underline;">Share this alert</a></p>`
    : ''
  const shareText = opts.shareUrl ? `\nBuying with a partner? Share this alert: ${opts.shareUrl}\n` : ''
  const replyToConfigured = !!process.env.ALERTS_REPLY_TO
  const replyToFooterHtml = replyToConfigured
    ? `<p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:16px 4px 0;">Question about a listing? Just reply to this email.</p>`
    : ''
  const replyToFooterText = replyToConfigured ? '\nQuestion about a listing? Just reply to this email.\n' : ''
  const viewUrlHtml = viewUrl
    ? `<p style="margin:0 0 14px;text-align:right;"><a href="${escapeAttr(viewUrl)}" style="font-size:11px;color:#a89f8e;text-decoration:underline;">View in browser</a></p>`
    : ''
  const viewUrlText = viewUrl ? `View in browser: ${viewUrl}\n\n` : ''
  // Unescaped mirror of `bodyCopy` (same wording, but built from the raw —
  // not HTML-entity-escaped — `countLabelText`/`forThingText`) so
  // `preheaderHtml`'s own `escapeHtml()` call doesn't double-escape entities
  // already escaped into `bodyCopy`/`forThing`.
  const preheaderText = isSample
    ? `${countLabelText} for your${forThingText} alert right now.`
    : isFirstSend
      ? `${countLabelText} for your${forThingText} alert — here's what's live the moment you confirmed. We'll email again automatically when something new matches.`
      : `There ${total === 1 ? 'is' : 'are'} ${countLabelText} matching your${forThingText} alert on ClubHanger this week.`

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheaderHtml(preheaderText)}
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      ${viewUrlHtml}
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      ${sampleBannerHtml}
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:20px;font-weight:700;margin:0 0 10px;">${escapeHtml(countLabel)}</h1>
        <p class="ch-muted" style="font-size:14px;line-height:1.6;color:#64748b;margin:0 0 20px;">
          ${bodyCopy}
        </p>
        ${marketPulseHtml}
        ${samplesHtml}
        <p style="margin:0;">
          <a href="${escapeAttr(listingsUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
            ${ctaLabel}
          </a>
        </p>
      </div>
      ${crossSellHtml}
      ${upgradeNudgeHtml}
      ${digestFeedbackHtml}
      ${shareHtml}
      ${replyToFooterHtml}
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        You&rsquo;re receiving this because you set up${forThing} alerts on ClubHanger.
        <a href="${escapeAttr(manageUrl)}" style="color:#a89f8e;">Manage alerts</a>
        &middot;
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>${opts.frequencyUrl ? ` &middot; <a href="${escapeAttr(opts.frequencyUrl)}" style="color:#a89f8e;">Get fewer emails</a>` : ''}.
      </p>
    </div>
  </body>
</html>`

  const sampleLines = samples
    .map((s) => {
      const price =
        s.previousPrice != null && s.price != null && s.previousPrice !== s.price
          ? `${formatUsd(s.price)} (was ${formatUsd(s.previousPrice)})`
          : s.price != null
            ? formatUsd(s.price)
            : ''
      const specs = [
        s.year,
        s.lookingFor ?? s.shareType ?? (s.ttaf ? `${s.ttaf.toLocaleString()} TTAF` : null),
        s.location,
      ]
        .filter(Boolean)
        .join(' · ')
      const notRelevantUrl = notRelevantLink(opts.digestFeedbackBaseUrl, s)
      return `- ${s.title}${specs ? ` (${specs})` : ''}${price ? ` — ${price}` : ''}${s.compLabel ? ` [${s.compLabel}]` : ''}\n  ${s.url}${notRelevantUrl ? `\n  Not relevant? ${notRelevantUrl}` : ''}`
    })
    .join('\n')

  const bodyCopyText = isSample
    ? `${countLabelText} for your${forThingText} alert right now.`
    : isFirstSend
      ? `${countLabelText} for your${forThingText} alert — here's what's live the moment you confirmed. We'll email again automatically when something new matches.`
      : `${countLabelText} matching your${forThingText} alert on ClubHanger.`
  const sampleBannerText = isSample ? `SAMPLE EMAIL — ${opts.sampleNote}\n\n` : ''

  const crossSellText = opts.crossSell ? `\n${opts.crossSell.label}\n${opts.crossSell.acceptUrl}\n` : ''
  const marketPulseText = opts.marketPulse ? `\n${opts.marketPulse}\n` : ''
  const upgradeNudgeText = opts.upgradeUrl
    ? `\nBusy week for this search — switch to daily digests: ${opts.upgradeUrl}\n`
    : ''

  const text = `${viewUrlText}${sampleBannerText}${bodyCopyText}
${marketPulseText}${sampleLines ? `\n${sampleLines}\n` : ''}
${ctaLabel}: ${listingsUrl}
${crossSellText}${upgradeNudgeText}${digestFeedbackText}${shareText}${replyToFooterText}
Manage alerts: ${manageUrl}
Unsubscribe: ${opts.unsubscribeUrl}${opts.frequencyUrl ? `\nGet fewer emails (switch to ${opts.frequencyTarget ?? 'weekly'}): ${opts.frequencyUrl}` : ''}`

  return { subject, html, text }
}

/** One alert's contribution to a combined digest email — the same
 *  context/counts/dropNoun/samples/listingsUrl fields `buildAlertDigestEmail`
 *  takes for a single alert, minus the manage/unsubscribe/frequency links
 *  (the combined email carries those once, at the footer, instead). */
export type AlertDigestSection = {
  context: string | null
  newCount: number
  dropCount: number
  dropNoun?: string
  listingsUrl: string
  samples?: AlertDigestSample[]
  /** Same honest market-context line `buildAlertDigestEmail` takes — see its doc. */
  marketPulse?: string
  /** This section's OWN alert's single-token unsubscribe link (not the
   *  combined, comma-joined `opts.unsubscribeUrl`) — renders a "Stop just
   *  this alert" link so a subscriber with several due alerts in one email
   *  can drop just one instead of all-or-nothing (GOAL.md: "offer fewer
   *  instead of none"). Omitted whenever the row has no `unsubscribe_token`
   *  yet, same graceful-degrade precedent as `frequencyUrl` above. */
  stopUrl?: string
  /** This section's own alert deep-linked into the token-scoped
   *  `/alerts/manage` view with its edit form pre-opened — lets a subscriber
   *  whose criteria are slightly wrong (too narrow, wrong state, stale price
   *  cap) fix them in one click instead of stopping the whole alert
   *  (GOAL.md: "offer fewer instead of none," applied to relevance). Omitted
   *  under the same no-token graceful-degrade as `stopUrl`. */
  editUrl?: string
  /** This section's own alert's plain (non-tokenized) share link — see
   *  `buildAlertDigestEmail`'s `shareUrl` doc. Renders as a "Share this
   *  alert" link scoped to this section only, distinct from any other
   *  section's link. Omitted when the alert has no source_path to share. */
  shareUrl?: string
  /** This section's own alert's `/alerts/digest/view` link — see
   *  `buildAlertDigestEmail`'s `viewUrl` doc. Renders as a "View in browser"
   *  link scoped to this section only. Omitted under the same no-token
   *  graceful-degrade as `stopUrl`/`editUrl`. */
  viewUrl?: string
}

/**
 * Build ONE email covering 2+ due alerts for the same subscriber — used when
 * a cron pass finds more than one alert due at once, so a subscriber with
 * e.g. 3 due alerts gets a single inbox item instead of 3 separate ones
 * (GOAL.md: "never spam"). Each section keeps its own honest criteria-echo
 * line, sample cards, and new/drop counts — never summed together across
 * alerts, same honesty convention as `buildAlertDigestEmail`. The overall
 * subject states a real total across every included alert. The
 * manage/unsubscribe links are shared once at the footer; the caller is
 * responsible for scoping `unsubscribeUrl` to cover every alert included in
 * `sections` (see the alert-digest cron's multi-token unsubscribe). For
 * exactly one due alert, callers should use `buildAlertDigestEmail` directly
 * instead — this function is for 2+, and doesn't offer a `frequencyUrl`
 * (a per-alert daily→weekly toggle that's ambiguous across multiple alerts
 * in one send; Manage alerts covers it per-alert instead).
 */
export function buildCombinedAlertDigestEmail(opts: {
  sections: AlertDigestSection[]
  manageUrl: string
  unsubscribeUrl: string
  /** Same one-click cross-sell as `buildAlertDigestEmail`'s option — exactly
   *  one suggestion for the whole combined email, never one per section
   *  (GOAL.md: "never spam"). */
  crossSell?: { label: string; acceptUrl: string }
  /** Same one-click 👍/👎 "was this useful" links as `buildAlertDigestEmail`
   *  — see its doc. One vote covers the whole combined send, not per-section
   *  (same "never spam" precedent as `crossSell`). */
  digestFeedbackUpUrl?: string
  digestFeedbackDownUrl?: string
  /** Same per-sample "Not relevant?" base URL as `buildAlertDigestEmail`'s
   *  option — applied to every section's sample cards (each still uses its
   *  own sample's `id`/`type`/`title`, just sharing this one token-scoped
   *  base). */
  digestFeedbackBaseUrl?: string
}): { subject: string; html: string; text: string } {
  const sections = opts.sections
  const totalNew = sections.reduce((n, s) => n + s.newCount, 0)
  const totalDrop = sections.reduce((n, s) => n + s.dropCount, 0)
  const manageUrl = withUtm(opts.manageUrl, 'combined')
  const digestFeedbackHtml =
    opts.digestFeedbackUpUrl && opts.digestFeedbackDownUrl
      ? `<p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:16px 4px 0;">Was this digest useful? <a href="${escapeAttr(opts.digestFeedbackUpUrl)}" style="color:#a89f8e;">&#128077; Yes</a> &middot; <a href="${escapeAttr(opts.digestFeedbackDownUrl)}" style="color:#a89f8e;">&#128078; No</a></p>`
      : ''
  const digestFeedbackText =
    opts.digestFeedbackUpUrl && opts.digestFeedbackDownUrl
      ? `\nWas this digest useful? Yes: ${opts.digestFeedbackUpUrl}  No: ${opts.digestFeedbackDownUrl}\n`
      : ''
  const replyToConfigured = !!process.env.ALERTS_REPLY_TO
  const replyToFooterHtml = replyToConfigured
    ? `<p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:16px 4px 0;">Question about a listing? Just reply to this email.</p>`
    : ''
  const replyToFooterText = replyToConfigured ? '\nQuestion about a listing? Just reply to this email.\n' : ''

  const overallParts: string[] = []
  if (totalNew > 0) overallParts.push(totalNew === 1 ? '1 new listing' : `${totalNew} new listings`)
  if (totalDrop > 0) overallParts.push(totalDrop === 1 ? '1 price drop' : `${totalDrop} price drops`)
  const overallLabel = overallParts.join(' + ')
  const subject = `${overallLabel} across your ${sections.length} alerts on ClubHanger`

  const sectionParts = sections.map((s, i) => {
    const thing = (s.context || '').trim()
    const heading = thing || 'Your alert'
    const forThing = thing ? ` ${thing}` : ''
    const dropNoun = s.dropNoun ?? 'price drop'
    const countParts: string[] = []
    if (s.newCount > 0) countParts.push(s.newCount === 1 ? '1 new listing' : `${s.newCount} new listings`)
    if (s.dropCount > 0) countParts.push(s.dropCount === 1 ? `1 ${dropNoun}` : `${s.dropCount} ${dropNoun}s`)
    const countLabel = countParts.join(' + ')
    const listingsUrl = withUtm(s.listingsUrl, 'combined')
    const samples = (s.samples ?? []).map((sm) => ({ ...sm, url: withUtm(sm.url, 'combined') }))
    const remaining = s.newCount + s.dropCount - samples.length
    const ctaLabel = samples.length > 0 && remaining > 0 ? `See all${forThing} matches` : `View${forThing} listings`
    const samplesHtml = samples.length
      ? `<div style="margin:0 0 14px;">${samples.map((sm) => sampleCardHtml(sm, notRelevantLink(opts.digestFeedbackBaseUrl, sm))).join('')}</div>`
      : ''
    const marketPulseHtml = s.marketPulse
      ? `<p style="margin:0 0 12px;font-size:11px;color:#0369a1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:6px 10px;">${escapeHtml(s.marketPulse)}</p>`
      : ''
    const isLast = i === sections.length - 1

    const editLinkHtml = s.editUrl
      ? `<a href="${escapeAttr(s.editUrl)}" style="color:#a89f8e;font-weight:400;font-size:12px;text-decoration:underline;margin-left:10px;">Edit this alert</a>`
      : ''
    const stopLinkHtml = s.stopUrl
      ? `<a href="${escapeAttr(s.stopUrl)}" style="color:#a89f8e;font-weight:400;font-size:12px;text-decoration:underline;margin-left:10px;">Stop just this alert</a>`
      : ''
    const shareLinkHtml = s.shareUrl
      ? `<a href="${escapeAttr(s.shareUrl)}" style="color:#a89f8e;font-weight:400;font-size:12px;text-decoration:underline;margin-left:10px;">Share this alert</a>`
      : ''
    const viewLinkHtml = s.viewUrl
      ? `<a href="${escapeAttr(s.viewUrl)}" style="color:#a89f8e;font-weight:400;font-size:12px;text-decoration:underline;margin-left:10px;">View in browser</a>`
      : ''

    const html = `<div style="margin:0 0 ${isLast ? '0' : '22px'};${isLast ? '' : 'padding-bottom:20px;border-bottom:1px solid #ece6dc;'}">
        <h2 class="ch-heading" style="font-size:15px;font-weight:700;margin:0 0 4px;">${escapeHtml(heading)}</h2>
        <p class="ch-muted" style="font-size:13px;color:#64748b;margin:0 0 12px;">${escapeHtml(countLabel)}</p>
        ${marketPulseHtml}
        ${samplesHtml}
        <p style="margin:0;">
          <a href="${escapeAttr(listingsUrl)}" style="color:#0284c7;font-weight:600;font-size:13px;text-decoration:none;">${escapeHtml(ctaLabel)} &rarr;</a>${editLinkHtml}${stopLinkHtml}${shareLinkHtml}${viewLinkHtml}
        </p>
      </div>`

    const sampleLines = samples
      .map((sm) => {
        const price =
          sm.previousPrice != null && sm.price != null && sm.previousPrice !== sm.price
            ? `${formatUsd(sm.price)} (was ${formatUsd(sm.previousPrice)})`
            : sm.price != null
              ? formatUsd(sm.price)
              : ''
        const notRelevantUrl = notRelevantLink(opts.digestFeedbackBaseUrl, sm)
        return `- ${sm.title}${price ? ` — ${price}` : ''}${sm.compLabel ? ` [${sm.compLabel}]` : ''}\n  ${sm.url}${sm.alsoMatchesLabel ? `\n  (${sm.alsoMatchesLabel})` : ''}${notRelevantUrl ? `\n  Not relevant? ${notRelevantUrl}` : ''}`
      })
      .join('\n')
    const text = `${heading} — ${countLabel}\n${s.marketPulse ? `${s.marketPulse}\n` : ''}${sampleLines ? `${sampleLines}\n` : ''}${ctaLabel}: ${listingsUrl}${s.editUrl ? `\nEdit this alert: ${s.editUrl}` : ''}${s.stopUrl ? `\nStop just this alert: ${s.stopUrl}` : ''}${s.shareUrl ? `\nShare this alert: ${s.shareUrl}` : ''}${s.viewUrl ? `\nView in browser: ${s.viewUrl}` : ''}`

    return { html, text }
  })

  const preheaderText = `${overallLabel} across your ${sections.length} alerts on ClubHanger.`

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheaderHtml(preheaderText)}
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:20px;font-weight:700;margin:0 0 16px;">${escapeHtml(overallLabel)} across your ${sections.length} alerts</h1>
        ${sectionParts.map((s) => s.html).join('')}
      </div>
      ${
        opts.crossSell
          ? `<div style="margin:16px 0 0;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 18px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#0f172a;">${escapeHtml(opts.crossSell.label)}</p>
        <a href="${escapeAttr(opts.crossSell.acceptUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:13px;padding:9px 16px;border-radius:8px;">
          Yes, alert me too &rarr;
        </a>
      </div>`
          : ''
      }
      ${digestFeedbackHtml}
      ${replyToFooterHtml}
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        You&rsquo;re receiving this because you set up these alerts on ClubHanger &mdash; combined into one email since more than one had new matches.
        <a href="${escapeAttr(manageUrl)}" style="color:#a89f8e;">Manage alerts</a>
        &middot;
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe from these</a>.
      </p>
    </div>
  </body>
</html>`

  const crossSellText = opts.crossSell ? `\n${opts.crossSell.label}\n${opts.crossSell.acceptUrl}\n` : ''

  const text = `${overallLabel} across your ${sections.length} alerts on ClubHanger.

${sectionParts.map((s) => s.text).join('\n\n')}
${crossSellText}${digestFeedbackText}${replyToFooterText}
Manage alerts: ${manageUrl}
Unsubscribe from these: ${opts.unsubscribeUrl}`

  return { subject, html, text }
}

/**
 * Build the "new matches on your listing" email for a partnership/seeker owner.
 * `listingLabel` is the owner's own listing (e.g. "your 2004 Cessna 172S Skyhawk
 * partnership"); `otherSideLabel` names what showed up (e.g. "pilots seeking a
 * partnership" / "partnerships"). Unlike the search-alert digest this has no
 * unsubscribe link — it's tied to the owner's own active listing, the same
 * unprompted-but-relevant precedent as the existing new-message notification.
 */
export function buildMatchAlertEmail(opts: {
  listingLabel: string
  otherSideLabel: string
  count: number
  matchesUrl: string
}): { subject: string; html: string; text: string } {
  const countLabel = opts.count === 1 ? `1 new match` : `${opts.count} new matches`
  const subject = `${countLabel} for ${opts.listingLabel} on ClubHanger`

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <h1 class="ch-heading" style="font-size:20px;font-weight:700;margin:0 0 12px;">${escapeHtml(countLabel)}</h1>
      <p class="ch-text" style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 20px;">
        ${opts.count === 1 ? 'A new listing' : 'New listings'} for ${escapeHtml(opts.otherSideLabel)}
        now match ${escapeHtml(opts.listingLabel)} on ClubHanger.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeAttr(opts.matchesUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
          View your matches
        </a>
      </p>
      <p class="ch-muted" style="font-size:12px;line-height:1.6;color:#94a3b8;margin:16px 0 0;">
        You&rsquo;re receiving this because you have an active listing on ClubHanger.
      </p>
    </div>
  </body>
</html>`

  const text = `${countLabel} for ${opts.listingLabel} on ClubHanger.

View your matches: ${opts.matchesUrl}`

  return { subject, html, text }
}

function formatWeekDelta(thisWeek: number, lastWeek: number): string {
  const delta = thisWeek - lastWeek
  if (delta === 0) return 'flat vs last week'
  return `${delta > 0 ? '+' : ''}${delta} vs last week`
}

function formatWeekRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${fmt(startIso)} – ${fmt(endIso)}`
}

/**
 * The Monday admin alert-funnel week-over-week summary (GOAL.md: "judge
 * alerts week-over-week"). DB-derived from `getAlertFunnelWeeklySnapshot`.
 * created/confirmed/unsubscribed/paused/bounced all have real timestamps, so
 * each gets an honest WoW delta once its matching `*AtMigrated` flag is true
 * (see supabase/schema.sql's `alerts_unsubscribed_at` /
 * `alerts_paused_bounced_at` blocks) — rendering in the current-totals table
 * only, exactly as before, until then. Internal-only, no unsubscribe link
 * (not a subscriber-facing email).
 */
export function buildAdminAlertFunnelEmail(
  snapshot: AlertFunnelWeeklySnapshot,
  dashboardUrl: string
): { subject: string; html: string; text: string } {
  const weekRange = formatWeekRange(snapshot.weekStart, snapshot.weekEnd)
  const subject = `Alert funnel — ${weekRange}: ${snapshot.createdThisWeek} new, ${snapshot.confirmedThisWeek} confirmed`

  const sourceRowsHtml = snapshot.topSourcesThisWeek.length
    ? snapshot.topSourcesThisWeek
        .map(
          (row) => `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#334155;">${escapeHtml(row.source)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#0f172a;text-align:right;font-weight:600;">${row.createdThisWeek}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#94a3b8;text-align:right;">${row.createdLastWeek}</td>
          </tr>`
        )
        .join('')
    : `<tr><td colspan="3" style="padding:6px 10px;font-size:13px;color:#94a3b8;">No new alerts this week.</td></tr>`

  const sourceRowsText = snapshot.topSourcesThisWeek.length
    ? snapshot.topSourcesThisWeek.map((row) => `  - ${row.source}: ${row.createdThisWeek} (last week: ${row.createdLastWeek})`).join('\n')
    : '  (no new alerts this week)'

  const migratedNote = snapshot.sourceColumnMigrated
    ? ''
    : `<p class="ch-muted" style="font-size:11px;line-height:1.5;color:#a89f8e;margin:8px 0 0;">Per-source breakdown unavailable — the \`alerts.source\` column isn&rsquo;t migrated live yet.</p>`

  const hasEverVoted = snapshot.digestVotesUpTotal > 0 || snapshot.digestVotesDownTotal > 0
  const digestFeedbackHtml = hasEverVoted
    ? `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Digest feedback (👍/👎)</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">👍 ${snapshot.digestVotesUpThisWeek} / 👎 ${snapshot.digestVotesDownThisWeek}</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${escapeHtml(formatWeekDelta(snapshot.digestVotesUpThisWeek, snapshot.digestVotesUpLastWeek))} 👍, ${escapeHtml(formatWeekDelta(snapshot.digestVotesDownThisWeek, snapshot.digestVotesDownLastWeek))} 👎</td></tr>`
    : `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Digest feedback (👍/👎)</td>
            <td style="padding:4px 0;text-align:right;font-size:13px;color:#94a3b8;">No votes yet</td>
          </tr>`

  const digestFeedbackText = hasEverVoted
    ? `Digest feedback: 👍 ${snapshot.digestVotesUpThisWeek} (${formatWeekDelta(snapshot.digestVotesUpThisWeek, snapshot.digestVotesUpLastWeek)}), 👎 ${snapshot.digestVotesDownThisWeek} (${formatWeekDelta(snapshot.digestVotesDownThisWeek, snapshot.digestVotesDownLastWeek)})\n`
    : `Digest feedback: No votes yet\n`

  const demandGapRowsHtml = snapshot.demandWithNoSupply
    .map(
      (row) => `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#334155;">${escapeHtml(row.label)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#0f172a;text-align:right;font-weight:600;">${row.subscriberCount} waiting · 0 matches</td>
          </tr>`
    )
    .join('')

  const demandGapEmptyMessage =
    snapshot.liveTotal === 0 ? 'No confirmed alerts yet.' : 'Every top search has live matches right now.'

  const demandGapSectionHtml = snapshot.demandWithNoSupply.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
          ${demandGapRowsHtml}
        </table>`
    : `<p class="ch-muted" style="font-size:13px;color:#94a3b8;margin:0 0 20px;">${escapeHtml(demandGapEmptyMessage)}</p>`

  const demandGapSectionText = snapshot.demandWithNoSupply.length
    ? snapshot.demandWithNoSupply.map((row) => `  - ${row.label}: ${row.subscriberCount} waiting, 0 matches`).join('\n')
    : `  (${demandGapEmptyMessage})`

  const hasEverEngaged = snapshot.emailOpenedTotal > 0 || snapshot.emailClickedTotal > 0
  const emailEngagementHtml = hasEverEngaged
    ? `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Email engagement (opened/clicked)</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">👀 ${snapshot.emailOpenedThisWeek} / 🖱️ ${snapshot.emailClickedThisWeek}</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${escapeHtml(formatWeekDelta(snapshot.emailOpenedThisWeek, snapshot.emailOpenedLastWeek))} opens, ${escapeHtml(formatWeekDelta(snapshot.emailClickedThisWeek, snapshot.emailClickedLastWeek))} clicks</td></tr>`
    : `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Email engagement (opened/clicked)</td>
            <td style="padding:4px 0;text-align:right;font-size:13px;color:#94a3b8;">No engagement events yet</td>
          </tr>`

  const emailEngagementText = hasEverEngaged
    ? `Email engagement: 👀 ${snapshot.emailOpenedThisWeek} opened (${formatWeekDelta(snapshot.emailOpenedThisWeek, snapshot.emailOpenedLastWeek)}), 🖱️ ${snapshot.emailClickedThisWeek} clicked (${formatWeekDelta(snapshot.emailClickedThisWeek, snapshot.emailClickedLastWeek)})\n`
    : `Email engagement: No engagement events yet\n`

  // Instant-alerts interest — the demand signal accumulating behind the blocked
  // Vercel-cron-tier call. All-time is the ledger that matters for that decision;
  // this-week shows momentum. Honest empty state, never a fabricated 0.
  const hasInstantInterest = snapshot.instantInterestAllTime > 0
  const instantInterestHtml = hasInstantInterest
    ? `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Instant-alerts interest (taps)</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">⚡ ${snapshot.instantInterestThisWeek} this week</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${snapshot.instantInterestAllTime} all-time</td></tr>`
    : `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Instant-alerts interest (taps)</td>
            <td style="padding:4px 0;text-align:right;font-size:13px;color:#94a3b8;">No interest recorded yet</td>
          </tr>`

  const instantInterestText = hasInstantInterest
    ? `Instant-alerts interest: ⚡ ${snapshot.instantInterestThisWeek} this week, ${snapshot.instantInterestAllTime} all-time\n`
    : `Instant-alerts interest: No interest recorded yet\n`

  // "Least relevant listings this week" — the per-sample "Not relevant?" taps
  // rolled up by listing (top by count, with the subscriber-shown title). An
  // empty week is a clean "nothing flagged", not a fabricated row.
  const notRelevantRowsHtml = snapshot.notRelevantListings
    .map(
      (row) => `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#334155;">${escapeHtml(row.title)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#0f172a;text-align:right;font-weight:600;">${row.count} flagged</td>
          </tr>`
    )
    .join('')

  const notRelevantSectionHtml = snapshot.notRelevantListings.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
          ${notRelevantRowsHtml}
        </table>`
    : `<p class="ch-muted" style="font-size:13px;color:#94a3b8;margin:0 0 20px;">No listings flagged as off-target this week.</p>`

  const notRelevantSectionText = snapshot.notRelevantListings.length
    ? snapshot.notRelevantListings.map((row) => `  - ${row.title}: ${row.count} flagged`).join('\n')
    : '  (no listings flagged as off-target this week)'

  // "Why people unsubscribe" — the one-tap reason chips on /alerts/status,
  // finally read back. An unmigrated column and a genuinely-empty column both
  // render an honest empty state, distinguished by wording, never a fabricated row.
  const unsubscribeReasonsRowsHtml = snapshot.unsubscribeReasons
    .map(
      (row) => `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#334155;">${escapeHtml(row.label)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#0f172a;text-align:right;font-weight:600;">${row.countThisWeek} this week</td>
            <td style="padding:6px 10px;border-bottom:1px solid #ece6dc;font-size:13px;color:#94a3b8;text-align:right;">${row.countAllTime} all-time</td>
          </tr>`
    )
    .join('')

  const unsubscribeReasonsEmptyMessage = snapshot.unsubscribeReasonColumnMigrated
    ? 'No reasons recorded yet.'
    : 'Not available yet — the `alerts.unsubscribe_reason` column isn’t migrated live.'

  const unsubscribeReasonsSectionHtml = snapshot.unsubscribeReasons.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
          ${unsubscribeReasonsRowsHtml}
        </table>`
    : `<p class="ch-muted" style="font-size:13px;color:#94a3b8;margin:0 0 20px;">${escapeHtml(unsubscribeReasonsEmptyMessage)}</p>`

  const unsubscribeReasonsSectionText = snapshot.unsubscribeReasons.length
    ? snapshot.unsubscribeReasons.map((row) => `  - ${row.label}: ${row.countThisWeek} this week, ${row.countAllTime} all-time`).join('\n')
    : `  (${unsubscribeReasonsEmptyMessage})`

  // Cron reliability — lets the human tell a genuinely quiet week apart from a silently
  // broken digest cron. `cronRunsRecorded` is false when `alert_cron_runs` has no rows in
  // the last 14 days at all (table not migrated live yet, or the cron truly hasn't run).
  const cronDaysShort = snapshot.cronRunDaysThisWeek < 7
  const cronReliabilityHtml = snapshot.cronRunsRecorded
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Days the cron ran</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:${cronDaysShort ? '#be123c' : '#0f172a'};">${snapshot.cronRunDaysThisWeek}/7</td>
          </tr>
          ${
            cronDaysShort
              ? `<tr><td colspan="2" style="padding:0 0 6px;font-size:12px;color:#be123c;text-align:right;">⚠️ fewer days than expected — check for silent failures</td></tr>`
              : ''
          }
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Emails sent this week</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">${snapshot.cronEmailsSentThisWeek}</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${escapeHtml(formatWeekDelta(snapshot.cronEmailsSentThisWeek, snapshot.cronEmailsSentLastWeek))}</td></tr>
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Avg run duration</td>
            <td style="padding:4px 0;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${snapshot.cronAvgDurationMsThisWeek !== null ? `${Math.round(snapshot.cronAvgDurationMsThisWeek / 1000)}s` : '—'}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Send failures</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:${snapshot.cronSendFailuresThisWeek > 0 ? '#be123c' : '#0f172a'};">${snapshot.cronSendFailuresThisWeek}</td>
          </tr>
          ${
            snapshot.cronSendFailuresThisWeek > 0
              ? `<tr><td colspan="2" style="padding:0 0 6px;font-size:12px;color:#be123c;text-align:right;">⚠️ real sendEmail errors this week — check the Resend dashboard</td></tr>`
              : ''
          }
        </table>`
    : `<p class="ch-muted" style="font-size:13px;color:#94a3b8;margin:0 0 20px;">No cron run data yet — either the digest cron hasn&rsquo;t run since this log was added, or the <code>alert_cron_runs</code> table isn&rsquo;t migrated live yet.</p>`

  const cronReliabilityText = snapshot.cronRunsRecorded
    ? `Cron reliability: ran ${snapshot.cronRunDaysThisWeek}/7 days${cronDaysShort ? ' (⚠️ fewer than expected — check for silent failures)' : ''}, ${snapshot.cronEmailsSentThisWeek} emails sent (${formatWeekDelta(snapshot.cronEmailsSentThisWeek, snapshot.cronEmailsSentLastWeek)}), avg duration ${snapshot.cronAvgDurationMsThisWeek !== null ? `${Math.round(snapshot.cronAvgDurationMsThisWeek / 1000)}s` : '—'}, ${snapshot.cronSendFailuresThisWeek} send failures${snapshot.cronSendFailuresThisWeek > 0 ? ' (⚠️ check the Resend dashboard)' : ''}`
    : 'Cron reliability: No cron run data yet (table not migrated or cron hasn’t run)'

  const html = `<!doctype html>
<html>
  <head>${emailColorSchemeHead()}</head>
  <body class="ch-body" style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheaderHtml(`${snapshot.createdThisWeek} new alert signups, ${snapshot.confirmedThisWeek} confirmed this week.`)}
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <p class="ch-brand" style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger — admin</p>
      <div class="ch-card" style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 class="ch-heading" style="font-size:19px;font-weight:700;margin:0 0 4px;">Alert funnel — ${escapeHtml(weekRange)}</h1>
        <p class="ch-muted" style="font-size:12px;color:#a89f8e;margin:0 0 20px;">Week-over-week, computed from the \`alerts\` table.</p>

        <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:18px;">
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">New signups</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">${snapshot.createdThisWeek}</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${escapeHtml(formatWeekDelta(snapshot.createdThisWeek, snapshot.createdLastWeek))}</td></tr>
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Confirmed (double opt-in)</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">${snapshot.confirmedThisWeek}</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${escapeHtml(formatWeekDelta(snapshot.confirmedThisWeek, snapshot.confirmedLastWeek))}</td></tr>
          ${
            snapshot.unsubscribedAtMigrated
              ? `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Unsubscribed</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">${snapshot.unsubscribedThisWeek}</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${escapeHtml(formatWeekDelta(snapshot.unsubscribedThisWeek, snapshot.unsubscribedLastWeek))}</td></tr>`
              : ''
          }
          ${
            snapshot.pausedAtMigrated
              ? `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Paused</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">${snapshot.pausedThisWeek}</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${escapeHtml(formatWeekDelta(snapshot.pausedThisWeek, snapshot.pausedLastWeek))}</td></tr>`
              : ''
          }
          ${
            snapshot.bouncedAtMigrated
              ? `<tr>
            <td style="padding:4px 0;font-size:14px;color:#334155;">Bounced</td>
            <td style="padding:4px 0;text-align:right;font-size:18px;font-weight:700;color:#0f172a;">${snapshot.bouncedThisWeek}</td>
          </tr>
          <tr><td colspan="2" style="padding:0 0 10px;font-size:12px;color:#94a3b8;text-align:right;">${escapeHtml(formatWeekDelta(snapshot.bouncedThisWeek, snapshot.bouncedLastWeek))}</td></tr>`
              : ''
          }
          ${digestFeedbackHtml}
          ${emailEngagementHtml}
          ${instantInterestHtml}
        </table>

        <p class="ch-text" style="font-size:12px;font-weight:600;color:#64748b;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.03em;">Current totals (not weekly)</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:3px 0;font-size:13px;color:#334155;">Live (active + confirmed)</td>
            <td style="padding:3px 0;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${snapshot.liveTotal}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:13px;color:#334155;">Pending confirmation</td>
            <td style="padding:3px 0;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${snapshot.pendingTotal}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:13px;color:#334155;">Paused</td>
            <td style="padding:3px 0;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${snapshot.pausedTotal}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:13px;color:#334155;">Unsubscribed</td>
            <td style="padding:3px 0;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${snapshot.unsubscribedTotal}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:13px;color:#334155;">Bounced</td>
            <td style="padding:3px 0;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${snapshot.bouncedTotal}</td>
          </tr>
        </table>

        <p class="ch-text" style="font-size:12px;font-weight:600;color:#64748b;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.03em;">Top sources this week</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="padding:4px 10px 4px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.03em;">Source</td>
            <td style="padding:4px 10px;font-size:11px;color:#94a3b8;text-align:right;text-transform:uppercase;letter-spacing:0.03em;">This week</td>
            <td style="padding:4px 10px;font-size:11px;color:#94a3b8;text-align:right;text-transform:uppercase;letter-spacing:0.03em;">Last week</td>
          </tr>
          ${sourceRowsHtml}
        </table>
        ${migratedNote}

        <p class="ch-text" style="font-size:12px;font-weight:600;color:#64748b;margin:20px 0 6px;text-transform:uppercase;letter-spacing:0.03em;">Demand with no supply</p>
        ${demandGapSectionHtml}

        <p class="ch-text" style="font-size:12px;font-weight:600;color:#64748b;margin:20px 0 6px;text-transform:uppercase;letter-spacing:0.03em;">Least relevant listings this week</p>
        ${notRelevantSectionHtml}

        <p class="ch-text" style="font-size:12px;font-weight:600;color:#64748b;margin:20px 0 6px;text-transform:uppercase;letter-spacing:0.03em;">Why people unsubscribe</p>
        ${unsubscribeReasonsSectionHtml}

        <p class="ch-text" style="font-size:12px;font-weight:600;color:#64748b;margin:20px 0 6px;text-transform:uppercase;letter-spacing:0.03em;">Cron reliability</p>
        ${cronReliabilityHtml}

        <p style="margin:20px 0 0;">
          <a href="${escapeAttr(dashboardUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 20px;border-radius:10px;">
            Open full dashboard
          </a>
        </p>
      </div>
    </div>
  </body>
</html>`

  const text = `Alert funnel — ${weekRange}

New signups: ${snapshot.createdThisWeek} (${formatWeekDelta(snapshot.createdThisWeek, snapshot.createdLastWeek)})
Confirmed: ${snapshot.confirmedThisWeek} (${formatWeekDelta(snapshot.confirmedThisWeek, snapshot.confirmedLastWeek)})
${snapshot.unsubscribedAtMigrated ? `Unsubscribed: ${snapshot.unsubscribedThisWeek} (${formatWeekDelta(snapshot.unsubscribedThisWeek, snapshot.unsubscribedLastWeek)})\n` : ''}${snapshot.pausedAtMigrated ? `Paused: ${snapshot.pausedThisWeek} (${formatWeekDelta(snapshot.pausedThisWeek, snapshot.pausedLastWeek)})\n` : ''}${snapshot.bouncedAtMigrated ? `Bounced: ${snapshot.bouncedThisWeek} (${formatWeekDelta(snapshot.bouncedThisWeek, snapshot.bouncedLastWeek)})\n` : ''}${digestFeedbackText}${emailEngagementText}${instantInterestText}
Current totals (not weekly):
  Live: ${snapshot.liveTotal}
  Pending confirmation: ${snapshot.pendingTotal}
  Paused: ${snapshot.pausedTotal}
  Unsubscribed: ${snapshot.unsubscribedTotal}
  Bounced: ${snapshot.bouncedTotal}

Top sources this week:
${sourceRowsText}

Demand with no supply:
${demandGapSectionText}

Least relevant listings this week:
${notRelevantSectionText}

Why people unsubscribe:
${unsubscribeReasonsSectionText}

${cronReliabilityText}

Full dashboard: ${dashboardUrl}`

  return { subject, html, text }
}
