import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const TOKEN = process.env.SLACK_BOT_TOKEN
const CHANNEL = process.env.SLACK_VISITOR_CHANNEL_ID
const HOME_CITY = (process.env.VISITOR_HOME_CITY || 'Oakland').toLowerCase()

// Crawlers mostly don't run our client JS, so this is a backstop, not the main filter.
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|slackbot|whatsapp|telegram|headless|lighthouse|preview|monitor|ahrefs|semrush|dataprovider|python-requests|curl|wget|axios|node-fetch/i

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

const EMOJI: Record<string, string> = {
  $pageview: '👀',
  search_performed: '🔎',
  listing_viewed: '📄',
  contact_initiated: '✉️',
  source_link_clicked: '↗',
  listing_submitted: '📝',
  feedback_submitted: '💬',
  saved_listing: '❤️',
}

function describe(event: string, path: string, props: Record<string, unknown> = {}): string {
  const e = EMOJI[event] ?? '•'
  switch (event) {
    case '$pageview':
      return `${e} viewed \`${path}\``
    case 'search_performed':
      return `${e} searched — ${props.airports || props.airport || ''} ${props.radius_miles ? `(${props.radius_miles}mi)` : ''}`.trim()
    case 'listing_viewed':
      return `${e} opened a listing — ${[props.make, props.airport].filter(Boolean).join(' · ')}`
    case 'contact_initiated':
      return `${e} *clicked contact* — high intent!`
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

  let body: { sessionId?: string; event?: string; path?: string; props?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const sessionId = body.sessionId
  const event = body.event || '$pageview'
  const path = body.path || '/'
  const props = body.props || {}
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
  // Fall back to the country code when no city resolves, so an "unknown" visitor
  // still shows where they're roughly from in Slack instead of a blank.
  const loc = [city, region].filter(Boolean).join(', ') || country || 'Unknown location'

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('visitor_threads')
    .select('slack_thread_ts, event_count')
    .eq('session_id', sessionId)
    .maybeSingle()

  try {
    if (!existing) {
      // First action this session → classify (bot vs human) and start a thread.
      // The IP-org lookup only runs here, once per session, not on every event.
      const org = await ipOrg(ip)
      const uaBot = BOT_RE.test(ua)
      const cloudBot = !!org && CLOUD_RE.test(org)
      const isBot = uaBot || cloudBot
      const provider = org ? org.replace(/,?\s*(LLC|Inc\.?|Ltd\.?|GmbH|S\.?A\.?S?\.?|B\.?V\.?).*$/i, '').trim() : null
      const botReason = cloudBot ? provider || 'datacenter' : uaBot ? 'bot user-agent' : null

      const headline = isBot
        ? `🤖 *Bot* — ${botReason} · ${loc} · ${device}`
        : `🟢 *New visitor* — ${loc} · ${device}`
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
    } else {
      await slack('chat.postMessage', {
        channel: CHANNEL,
        thread_ts: existing.slack_thread_ts,
        text: describe(event, path, props),
        unfurl_links: false,
      })
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
