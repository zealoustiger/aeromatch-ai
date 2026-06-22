import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const TOKEN = process.env.SLACK_BOT_TOKEN
const CHANNEL = process.env.SLACK_VISITOR_CHANNEL_ID
const HOME_CITY = (process.env.VISITOR_HOME_CITY || 'Oakland').toLowerCase()

// Crawlers mostly don't run our client JS, so this is a backstop, not the main filter.
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|slackbot|whatsapp|telegram|headless|lighthouse|preview|monitor|ahrefs|semrush|dataprovider|python-requests|curl|wget|axios|node-fetch/i

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
  if (!TOKEN || !CHANNEL) return NextResponse.json({ ok: false }, { status: 204 })

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

  // Bot backstop + skip our own city.
  const ua = request.headers.get('user-agent') || ''
  if (BOT_RE.test(ua)) return NextResponse.json({ ok: true })
  const city = request.headers.get('x-vercel-ip-city')
    ? decodeURIComponent(request.headers.get('x-vercel-ip-city')!)
    : null
  if (city && city.toLowerCase() === HOME_CITY) return NextResponse.json({ ok: true })

  const region = request.headers.get('x-vercel-ip-country-region') || null
  const country = request.headers.get('x-vercel-ip-country') || null
  const device = /mobile|android|iphone|ipad/i.test(ua) ? '📱 mobile' : '💻 desktop'
  const loc = [city, region].filter(Boolean).join(', ') || 'Unknown location'

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('visitor_threads')
    .select('slack_thread_ts, event_count')
    .eq('session_id', sessionId)
    .maybeSingle()

  try {
    if (!existing) {
      // First action this session → start a thread.
      const root = await slack('chat.postMessage', {
        channel: CHANNEL,
        text: `🟢 *New visitor* — ${loc} · ${device}\nlanded on \`${path}\``,
        unfurl_links: false,
      })
      if (!root.ok) return NextResponse.json({ ok: false, error: root.error })
      await admin.from('visitor_threads').insert({
        session_id: sessionId,
        slack_thread_ts: root.ts,
        city,
        region,
        country,
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
