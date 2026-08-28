import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const TOKEN = process.env.SLACK_BOT_TOKEN
const CHANNEL = process.env.SLACK_VISITOR_CHANNEL_ID
const HOME_CITY = (process.env.VISITOR_HOME_CITY || 'Oakland').toLowerCase()

// Crawlers mostly don't run our client JS, so this is a backstop, not the main filter.
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|slackbot|whatsapp|telegram|headless|lightpanda|lighthouse|preview|monitor|ahrefs|semrush|dataprovider|python-requests|curl|wget|axios|node-fetch/i

// Known link-preview / "unfurl" bots — fetched once whenever someone pastes a
// ClubHanger URL into that app (Facebook, Slack, iMessage, etc.) so the share
// renders a title/image/description card. High-volume and zero-signal (every
// share = one hit, regardless of who shared it or whether a human ever visits),
// so these are logged to visitor_threads as usual (still counted in admin bot
// stats) but never posted to Slack — unlike other bots/scrapers, which stay
// visible since those ARE worth a human noticing.
const PREVIEW_BOT_RE =
  /facebookexternalhit|meta-externalagent|twitterbot|slackbot-linkexpanding|slack-imgproxy|whatsapp|telegrambot|linkedinbot|discordbot|redditbot|pinterest|quora link preview|bingpreview|skypeuripreview|embedly|iframely|vkshare|\bviber\b|^line\//i

// Cloud / datacenter / hosting orgs — a "visitor" whose IP belongs to one of
// these is almost always a bot (crawler, scraper, uptime monitor) running on a
// server, not a person. We TAG these rather than drop them, so the channel still
// shows every visit but real humans are easy to pick out.
const CLOUD_RE =
  /digitalocean|amazon|\baws\b|ec2|google|\bgcp\b|googleusercontent|microsoft|azure|hetzner|\bovh\b|linode|vultr|oracle|alibaba|aliyun|tencent|scaleway|contabo|leaseweb|choopa|\bm247\b|datacamp|hostinger|cloudflare|fastly|akamai|hosting|datacenter|colocation/i

// Look up the IP's owning org (ipinfo.io — https, commercial-use OK, works
// server-side without a token; set IPINFO_TOKEN to raise the free rate limit).
// Returns the org name with the leading "AS#### " stripped, e.g. "DigitalOcean,
// LLC". Fail-open: any error returns null and the visit counts as human.
async function ipOrg(ip: string | null): Promise<string | null> {
  if (!ip) return null
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 2500)
  try {
    const token = process.env.IPINFO_TOKEN ? `?token=${process.env.IPINFO_TOKEN}` : ''
    const res = await fetch(`https://ipinfo.io/${ip}/json${token}`, {
      signal: ctrl.signal,
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    const j = (await res.json()) as { org?: string }
    return (j.org || '').replace(/^AS\d+\s+/, '').trim() || null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// Paths not worth a ping.
function boring(path: string) {
  return /^\/(admin|api|auth|_next)/.test(path)
}

async function slack(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

// ── Bot-wave collapsing ──────────────────────────────────────────────────────
// A scraper sweeping the site through a residential proxy pool (2026-08-20:
// ~430 sessions in 2h, one hit per IP, ten canned UAs) used to open a Slack
// thread PER SESSION and bury the evening's real visitors. Now, once the channel
// is in a wave (≥ WAVE_THRESHOLD new sessions in WAVE_WINDOW_MS; baseline is
// ~1/hour) or a session trips the UA-burst detector, bot sessions are folded
// into one "🌊 Bot wave" root message per UTC hour whose text is updated in
// place with the running count. The collector lives in visitor_threads as a
// synthetic `wave:<hour>` row (is_bot=true, so the admin "real visitors" view
// never sees it) — no new table needed.
const WAVE_WINDOW_MS = 10 * 60_000
const WAVE_THRESHOLD = 12
const WAVE_UPDATE_EVERY = 10

function waveText(n: number, path: string, loc: string, reason: string): string {
  return (
    `🌊 *Bot wave* — ${n} scripted session${n === 1 ? '' : 's'} this hour, collapsed here ` +
    `(each is still logged for admin bot stats)\nlatest: ${reason} · ${loc} · \`${path}\``
  )
}

async function collapseIntoWave(
  admin: ReturnType<typeof createAdminClient>,
  s: { path: string; loc: string; reason: string; ip: string | null; city: string | null; region: string | null; country: string | null }
) {
  const waveId = `wave:${new Date().toISOString().slice(0, 13)}` // hourly UTC bucket
  const { data: wave } = await admin
    .from('visitor_threads')
    .select('slack_thread_ts, event_count')
    .eq('session_id', waveId)
    .maybeSingle()
  if (!wave) {
    const root = await slack('chat.postMessage', {
      channel: CHANNEL,
      text: waveText(1, s.path, s.loc, s.reason),
      unfurl_links: false,
    })
    // A concurrent first hit can race this insert; the unique session_id makes
    // the loser throw, the caller's catch swallows it, and the next hit finds
    // the winner's row. One duplicate root message at worst.
    await admin.from('visitor_threads').insert({
      session_id: waveId,
      slack_thread_ts: root.ok ? root.ts : null,
      city: s.city,
      region: s.region,
      country: s.country,
      ip: s.ip,
      user_agent: 'bot-wave collector',
      is_bot: true,
      ip_org: null,
      first_path: s.path,
    })
    return
  }
  const n = (wave.event_count ?? 1) + 1
  await admin
    .from('visitor_threads')
    .update({ last_seen: new Date().toISOString(), event_count: n })
    .eq('session_id', waveId)
  // Edit the root in place (not a reply per hit): the first few so it visibly
  // comes alive, then every WAVE_UPDATE_EVERY-th so Slack sees ~1 call/10 hits.
  if (wave.slack_thread_ts && (n <= 3 || n % WAVE_UPDATE_EVERY === 0)) {
    await slack('chat.update', {
      channel: CHANNEL,
      ts: wave.slack_thread_ts,
      text: waveText(n, s.path, s.loc, s.reason),
    })
  }
}

const EMOJI: Record<string, string> = {
  $pageview: '👀',
  search_performed: '🔎',
  listing_viewed: '📄',
  contact_initiated: '✉️',
  source_link_clicked: '↗',
  listing_submitted: '📝',
  feedback_submitted: '💬',
  saved_listing: '❤️',
  alert_subscribed: '🔔',
  page_exit: '👋',
}

// Compact "left after 45s · scrolled 80%" summary for a page_exit beacon.
// `seconds` = wall-clock dwell, `scroll` = deepest % of the page reached,
// `engaged` = scrolled past the fold OR stayed >10s (bounce vs. real read).
function describeExit(e: string, path: string, props: Record<string, unknown>): string {
  const secs = Number(props.seconds) || 0
  const scroll = Number(props.scroll) || 0
  const dwell = secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`
  const engaged = props.engaged ? '' : ' · bounced'
  // "What they paused on" — the sections they lingered on longest, e.g.
  // "paused on: Estimate (22s), Cost to own (14s)". Omitted on a quick bounce.
  const sections = Array.isArray(props.sections) ? (props.sections as Array<{ label?: string; seconds?: number }>) : []
  const paused = sections.length
    ? `\n    ⏸️ paused on: ${sections.map((s) => `${String(s.label ?? '').slice(0, 48)}${s.seconds ? ` (${s.seconds}s)` : ''}`).join(', ')}`
    : ''
  return `${e} left \`${path}\` after ${dwell} · scrolled ${scroll}%${engaged}${paused}`
}

function describe(event: string, path: string, props: Record<string, unknown> = {}): string {
  const e = EMOJI[event] ?? '•'
  switch (event) {
    case '$pageview':
      return `${e} viewed \`${path}\``
    case 'page_exit':
      return describeExit(e, path, props)
    case 'search_performed':
      return `${e} searched — ${props.airports || props.airport || ''} ${props.radius_miles ? `(${props.radius_miles}mi)` : ''}`.trim()
    case 'listing_viewed':
      return `${e} opened a listing — ${[props.make, props.airport].filter(Boolean).join(' · ')}`
    case 'contact_initiated':
      return `${e} *clicked contact* — high intent!`
    case 'alert_subscribed':
      return `${e} *set an email alert*${props.context ? ` — ${props.context}` : ''}`
    case 'source_link_clicked':
      return `${e} clicked the original post`
    case 'listing_submitted':
      return `${e} *posted a listing*`
    case 'feedback_submitted':
      return `${e} submitted feedback`
    default:
      return `${e} ${event} \`${path}\``
  }
}

export async function POST(request: NextRequest) {
  // Slack not configured (e.g. staging/preview without the bot env) → no-op.
  // A 204 must be body-less; `NextResponse.json(..., { status: 204 })` throws an
  // "Invalid response status code 204" and 500s the beacon on every page load.
  if (!TOKEN || !CHANNEL) return new NextResponse(null, { status: 204 })

  // Light same-origin guard so randoms can't spam the channel.
  const origin = request.headers.get('origin') || ''
  if (origin && !/clubhanger\.com$|localhost(:\d+)?$/.test(new URL(origin).host)) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  let body: {
    sessionId?: string
    event?: string
    path?: string
    referrer?: string | null
    utm?: { source?: string | null; content?: string | null } | null
    hints?: { webdriver?: boolean; sw?: number; sh?: number; vw?: number; vh?: number } | null
    props?: Record<string, unknown>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const sessionId = body.sessionId
  const event = body.event || '$pageview'
  const path = body.path || '/'
  const props = body.props || {}
  const hints = body.hints || null
  // Campaign tag (from ?utm_source/&utm_content on the landing URL). Sanitized to a
  // short slug so a crafted link can't inject formatting into the Slack message.
  const clean = (s: unknown, n: number) =>
    typeof s === 'string' ? s.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, n) : ''
  const utmSource = clean(body.utm?.source, 24)
  const utmContent = clean(body.utm?.content, 32)
  const campaign = utmSource ? ` · ${utmSource}${utmContent ? `/${utmContent}` : ''}` : ''
  const rawReferrer = body.referrer || null
  // Strip to just the hostname, and ignore self-referrals (internal navigation).
  const referrerHost = (() => {
    if (!rawReferrer) return null
    try {
      const host = new URL(rawReferrer).hostname.replace(/^www\./, '')
      return host && !host.includes('clubhanger') ? host : null
    } catch { return null }
  })()
  if (!sessionId || boring(path)) return NextResponse.json({ ok: true })

  // We no longer drop bot hits — they're tagged below and still posted, so the
  // channel shows everything. Just skip our own city.
  const ua = request.headers.get('user-agent') || ''
  const city = request.headers.get('x-vercel-ip-city')
    ? decodeURIComponent(request.headers.get('x-vercel-ip-city')!)
    : null
  if (city && city.toLowerCase() === HOME_CITY) return NextResponse.json({ ok: true })

  const region = request.headers.get('x-vercel-ip-country-region') || null
  const country = request.headers.get('x-vercel-ip-country') || null
  const device = /mobile|android|iphone|ipad/i.test(ua) ? '📱 mobile' : '💻 desktop'
  // Client IP: Vercel puts the real client first in x-forwarded-for. Keep it for
  // post-hoc bot/human triage (whois the IP, inspect the UA) — PostHog can't, since
  // privacy blockers / the GFW stop its tracker but never our first-party beacon.
  const ip =
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    null
  // Loopback = the request came from the same machine as the server: local dev,
  // or (the common case) the overnight drain's headless-Chrome QA hammering
  // localhost:3000. Never a real visitor — drop silently so it doesn't flood the
  // Slack channel with "🤖 Bot" pings and bury genuine traffic.
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) {
    return NextResponse.json({ ok: true })
  }
  // Fall back to the country code when no city resolves, so an "unknown" visitor
  // still shows where they're roughly from in Slack instead of a blank.
  const loc = [city, region].filter(Boolean).join(', ') || country || 'Unknown location'

  // Known unfurl/link-preview bot → log for stats, never post to Slack (see
  // PREVIEW_BOT_RE above). Checked before the DB round-trip so a flood of these
  // (e.g. a link shared widely on Facebook) costs one cheap regex test, not a
  // wasted `visitor_threads` lookup.
  const isPreviewBot = PREVIEW_BOT_RE.test(ua)

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('visitor_threads')
    .select('slack_thread_ts, event_count')
    .eq('session_id', sessionId)
    .maybeSingle()

  try {
    if (!existing && isPreviewBot) {
      // Known unfurl bot on its very first hit: skip the ipinfo.io lookup, the
      // burst-detection query, and BOTH Slack posts entirely — just log it so
      // it still counts in admin bot stats. (A preview bot essentially never
      // sends a second event, so the `else` reply-branch below is moot for it,
      // but isPreviewBot still guards it below for safety.)
      await admin.from('visitor_threads').insert({
        session_id: sessionId,
        slack_thread_ts: null,
        city,
        region,
        country,
        ip,
        user_agent: ua,
        is_bot: true,
        ip_org: null,
        first_path: path,
      })
    } else if (!existing) {
      // First action this session → classify (bot vs human) and start a thread.
      // The IP-org lookup only runs here, once per session, not on every event.
      const org = await ipOrg(ip)
      const uaBot = BOT_RE.test(ua)
      const cloudBot = !!org && CLOUD_RE.test(org)

      // Residential-proxy burst detection: a scraper renting a residential
      // proxy network (BrightData, Soax, etc.) gets a Comcast/Cox/etc. exit IP
      // that passes the CLOUD_RE check, so the UA + IP-org filters miss it.
      // But the SAME scraper sweeping a URL from many exits shows up as a burst
      // of "different visitors" with the IDENTICAL user-agent string, landing
      // on the same first_path within minutes. Threshold ≥2 prior matches in
      // the last 6h flags this run as a bot. A 20-byte UA is too short to be
      // diagnostic; skip the burst check then. Capped lookup so a popular URL
      // doesn't slow the beacon. Safe: a real burst of 3+ humans on the same
      // page would have varied UAs (different browsers / versions / mobile mix).
      let burstBot = false
      let burstCount = 0
      if (path && ua && ua.length >= 20) {
        const sinceIso = new Date(Date.now() - 6 * 3600_000).toISOString()
        const { count } = await admin
          .from('visitor_threads')
          .select('session_id', { count: 'exact', head: true })
          .eq('first_path', path)
          .eq('user_agent', ua)
          .neq('session_id', sessionId)
          .gte('created_at', sinceIso)
        burstCount = count ?? 0
        if (burstCount >= 2) burstBot = true
      }

      // Wave mode: the channel is being swept. Baseline is ~1 new session an
      // hour, so WAVE_THRESHOLD new sessions inside WAVE_WINDOW_MS is a scripted
      // sweep, not a lucky evening. In a wave the per-(path, UA) burst threshold
      // drops to the FIRST repeat, and the headless window-geometry fingerprint
      // counts as a bot signal on its own. Outside a wave neither applies, so a
      // real burst of humans (a Reddit post) still gets individual 🟢 threads —
      // they arrive with referrers, varied UAs and varied window sizes.
      const { count: recentSessions } = await admin
        .from('visitor_threads')
        .select('session_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - WAVE_WINDOW_MS).toISOString())
      const wave = (recentSessions ?? 0) >= WAVE_THRESHOLD
      if (wave && burstCount >= 1) burstBot = true
      // Client-reported automation signals (see hints() in lib/analytics.ts).
      const webdriverBot = hints?.webdriver === true
      const headlessFp =
        !!hints &&
        hints.sw === 1920 &&
        hints.sh === 1080 &&
        hints.vw === 1280 &&
        hints.vh === 720 &&
        !rawReferrer
      const fingerprintBot = wave && headlessFp

      const isBot = uaBot || cloudBot || burstBot || webdriverBot || fingerprintBot
      const provider = org ? org.replace(/,?\s*(LLC|Inc\.?|Ltd\.?|GmbH|S\.?A\.?S?\.?|B\.?V\.?).*$/i, '').trim() : null
      const botReason = cloudBot
        ? provider || 'datacenter'
        : uaBot
          ? 'bot user-agent'
          : webdriverBot
            ? 'automation (navigator.webdriver)'
            : burstBot
              ? `UA burst (${burstCount + 1} hits on this URL)`
              : fingerprintBot
                ? 'headless fingerprint during wave'
                : null

      if (isBot && (wave || burstBot)) {
        // Scripted sweep: fold into the hourly "🌊 Bot wave" message instead of
        // opening a thread per session, and log the session thread-less (like
        // preview bots) so admin bot stats still count it. Lone bots outside a
        // wave (a datacenter crawler, one headless visit) keep their own thread
        // below — those are rare and worth a human glancing at.
        await collapseIntoWave(admin, { path, loc, reason: botReason ?? 'bot', ip, city, region, country })
        await admin.from('visitor_threads').insert({
          session_id: sessionId,
          slack_thread_ts: null,
          city,
          region,
          country,
          ip,
          user_agent: ua,
          is_bot: true,
          ip_org: org,
          first_path: path,
        })
      } else {
        const via = referrerHost ? ` · via ${referrerHost}` : ''
        const headline = isBot
          ? `🤖 *Bot* — ${botReason} · ${loc} · ${device}`
          : `🟢 *New visitor* — ${loc} · ${device}${via}${campaign}`
        const root = await slack('chat.postMessage', {
          channel: CHANNEL,
          text: `${headline}\n${isBot ? 'hit' : 'landed on'} \`${path}\``,
          unfurl_links: false,
        })
        if (!root.ok) return NextResponse.json({ ok: false, error: root.error })
        await admin.from('visitor_threads').insert({
          session_id: sessionId,
          slack_thread_ts: root.ts,
          city,
          region,
          country,
          ip,
          user_agent: ua,
          is_bot: isBot,
          ip_org: org,
          first_path: path,
        })
        // Also post the first action as a reply so the thread reads consistently.
        await slack('chat.postMessage', {
          channel: CHANNEL,
          thread_ts: root.ts,
          text: describe(event, path, props),
          unfurl_links: false,
        })
      }
    } else {
      // existing.slack_thread_ts is null for a preview-bot session (no thread was
      // ever posted) — skip the Slack reply in that case, just bump the counters.
      if (existing.slack_thread_ts && !isPreviewBot) {
        await slack('chat.postMessage', {
          channel: CHANNEL,
          thread_ts: existing.slack_thread_ts,
          text: describe(event, path, props),
          unfurl_links: false,
        })
      }
      await admin
        .from('visitor_threads')
        .update({ last_seen: new Date().toISOString(), event_count: (existing.event_count ?? 1) + 1 })
        .eq('session_id', sessionId)
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
