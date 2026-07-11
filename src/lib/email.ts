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
  <body style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:28px 24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;">Almost there — confirm your alerts</h1>
        <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 22px;">
          Thanks for signing up${forThing} on ClubHanger. One click and you&rsquo;re set — we&rsquo;ll
          only email you when a genuinely new matching listing shows up, never anything else.
        </p>
        <p style="margin:0 0 4px;">
          <a href="${escapeAttr(opts.confirmUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            Confirm my alerts
          </a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#94a3b8;margin:20px 0 0;">
          Didn&rsquo;t request this? No action needed — you won&rsquo;t hear from us again.
        </p>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        Prefer not to get these? <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`

  const text = `ClubHanger

Almost there — confirm your alerts${forThingText}.

Confirm your email: ${opts.confirmUrl}

Didn't request this? No action needed — you won't hear from us again.
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

/**
 * Build the price-drop notification email for one specific matching listing —
 * distinct from `buildAlertDigestEmail`'s aggregate weekly count, this fires
 * with enough detail (photo, old-vs-new price) to be useful standalone,
 * matching GOAL.md's "best listing alert email in aviation" bar. `photoUrl`
 * is optional — the layout degrades gracefully (no broken `<img>`) when a
 * listing has no usable photo.
 */
export function buildPriceDropEmail(opts: {
  title: string
  photoUrl: string | null
  previousPrice: number
  askingPrice: number
  listingUrl: string
  manageUrl: string
  unsubscribeUrl: string
}): { subject: string; html: string; text: string } {
  const pct = Math.round(((opts.previousPrice - opts.askingPrice) / opts.previousPrice) * 100)
  const oldPrice = formatUsd(opts.previousPrice)
  const newPrice = formatUsd(opts.askingPrice)
  const subject = `${pct}% price drop — ${opts.title} now ${newPrice}`

  const photo = opts.photoUrl
    ? `<img src="${escapeAttr(opts.photoUrl)}" alt="${escapeAttr(opts.title)}" width="472" style="display:block;width:100%;max-width:472px;height:auto;border-radius:12px;margin:0 0 18px;" />`
    : ''

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        ${photo}
        <h1 style="font-size:19px;font-weight:700;margin:0 0 10px;">${escapeHtml(opts.title)}</h1>
        <p style="margin:0 0 14px;">
          <span style="display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;">
            ${pct}% price drop
          </span>
        </p>
        <p style="margin:0 0 22px;">
          <span style="color:#94a3b8;text-decoration:line-through;font-size:15px;margin-right:8px;">${oldPrice}</span>
          <span style="color:#0f172a;font-weight:700;font-size:22px;">${newPrice}</span>
        </p>
        <p style="margin:0;">
          <a href="${escapeAttr(opts.listingUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">
            View listing
          </a>
        </p>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        You&rsquo;re receiving this because you have an alert set up on ClubHanger.
        <a href="${escapeAttr(opts.manageUrl)}" style="color:#a89f8e;">Manage alerts</a>
        &middot;
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>.
      </p>
    </div>
  </body>
</html>`

  const text = `${opts.title} just dropped ${pct}% — now ${newPrice} (was ${oldPrice})

View listing: ${opts.listingUrl}

Manage alerts: ${opts.manageUrl}
Unsubscribe: ${opts.unsubscribeUrl}`

  return { subject, html, text }
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
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
  location: string | null
  price: number | null
  previousPrice?: number | null
  url: string
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
  if (s.ttaf) parts.push(`${s.ttaf.toLocaleString()} TTAF`)
  if (s.location) parts.push(s.location)
  return parts.join(' &middot; ')
}

function sampleCardHtml(s: AlertDigestSample): string {
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

  return `<a href="${escapeAttr(s.url)}" style="display:flex;gap:12px;text-decoration:none;color:inherit;padding:12px 0;border-bottom:1px solid #ece6dc;">
        ${photo}
        <div style="min-width:0;">
          <p style="margin:0 0 3px;font-weight:700;font-size:14px;color:#0f172a;">${escapeHtml(s.title)}</p>
          ${specs ? `<p style="margin:0 0 4px;font-size:12px;color:#64748b;">${specs}</p>` : ''}
          <p style="margin:0;">${priceHtml}</p>
          ${placeholderNote}
        </div>
      </a>`
}

/**
 * Build the weekly digest email for a confirmed alert subscriber.
 * Sent when there's a new matching listing and/or a genuine price drop on a
 * matching listing since their last digest. `newCount`/`dropCount` are named
 * distinctly in the copy rather than summed — GOAL.md requires alert content
 * be honest, and a price drop on an existing listing is not "a new listing."
 * `samples` (optional, up to 3 real matching listings — aircraft alerts only
 * today) render as preview cards above the "view all" CTA; when omitted or
 * empty the email still renders cleanly with the CTA alone. `dropNoun`
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
  samples?: AlertDigestSample[]
}): { subject: string; html: string; text: string } {
  const thing = (opts.context || '').trim()
  const forThing = thing ? ` ${escapeHtml(thing)}` : ''
  const forThingText = thing ? ` ${thing}` : ''
  const samples = opts.samples ?? []
  const dropNoun = opts.dropNoun ?? 'price drop'

  const parts: string[] = []
  if (opts.newCount > 0) parts.push(opts.newCount === 1 ? '1 new listing' : `${opts.newCount} new listings`)
  if (opts.dropCount > 0) parts.push(opts.dropCount === 1 ? `1 ${dropNoun}` : `${opts.dropCount} ${dropNoun}s`)
  const countLabel = parts.join(' + ')
  const countLabelText = countLabel
  const total = opts.newCount + opts.dropCount
  const subject = thing
    ? `${countLabel} — ${thing} on ClubHanger`
    : `${countLabel} on ClubHanger`

  const samplesHtml = samples.length
    ? `<div style="margin:0 0 20px;">${samples.map(sampleCardHtml).join('')}</div>`
    : ''
  const remaining = total - samples.length
  const ctaLabel = samples.length > 0 && remaining > 0 ? `See all${forThing} matches` : `View${forThing} listings`

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p style="margin:0 0 20px;font-size:15px;font-weight:700;letter-spacing:-0.01em;color:#0284c7;">ClubHanger</p>
      <div style="background:#ffffff;border:1px solid #ece6dc;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(31,24,12,0.04),0 4px 12px rgba(31,24,12,0.06);">
        <h1 style="font-size:20px;font-weight:700;margin:0 0 10px;">${escapeHtml(countLabel)}</h1>
        <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0 0 20px;">
          There ${total === 1 ? 'is' : 'are'} ${countLabel} matching your${forThing} alert on ClubHanger this week.
        </p>
        ${samplesHtml}
        <p style="margin:0;">
          <a href="${escapeAttr(opts.listingsUrl)}"
             style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
            ${ctaLabel}
          </a>
        </p>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#a89f8e;margin:20px 4px 0;">
        You&rsquo;re receiving this because you set up${forThing} alerts on ClubHanger.
        <a href="${escapeAttr(opts.manageUrl)}" style="color:#a89f8e;">Manage alerts</a>
        &middot;
        <a href="${escapeAttr(opts.unsubscribeUrl)}" style="color:#a89f8e;">Unsubscribe</a>.
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
      const specs = [s.year, s.ttaf ? `${s.ttaf.toLocaleString()} TTAF` : null, s.location].filter(Boolean).join(' · ')
      return `- ${s.title}${specs ? ` (${specs})` : ''}${price ? ` — ${price}` : ''}\n  ${s.url}`
    })
    .join('\n')

  const text = `${countLabelText} matching your${forThingText} alert on ClubHanger.
${sampleLines ? `\n${sampleLines}\n` : ''}
${ctaLabel}: ${opts.listingsUrl}

Manage alerts: ${opts.manageUrl}
Unsubscribe: ${opts.unsubscribeUrl}`

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
  <body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;">${escapeHtml(countLabel)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 20px;">
        ${opts.count === 1 ? 'A new listing' : 'New listings'} for ${escapeHtml(opts.otherSideLabel)}
        now match ${escapeHtml(opts.listingLabel)} on ClubHanger.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeAttr(opts.matchesUrl)}"
           style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
          View your matches
        </a>
      </p>
      <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:16px 0 0;">
        You&rsquo;re receiving this because you have an active listing on ClubHanger.
      </p>
    </div>
  </body>
</html>`

  const text = `${countLabel} for ${opts.listingLabel} on ClubHanger.

View your matches: ${opts.matchesUrl}`

  return { subject, html, text }
}
