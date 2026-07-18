import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'
import { parseAlertTokens } from '@/lib/alertTokenList'

export const dynamic = 'force-dynamic'

// Shared by GET (human click) and POST (RFC 8058 one-click). Service role,
// because anon can't UPDATE `alerts` (RLS). Fails soft — returns false rather
// than throwing. `token` is usually a single alert's token, but a combined
// digest email (see alert-digest cron) links here with a comma-separated
// list of every alert's token it covered, so one click unsubscribes all of
// them — not just the first — rather than leaving the others as a silent
// "dead end" the subscriber thinks they already opted out of.
async function applyUnsubscribe(token: string): Promise<boolean> {
  const tokens = parseAlertTokens(token)
  if (!tokens.length) return false
  try {
    const supabase = createAdminClient()
    let { data, error } = await supabase
      .from('alerts')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .in('unsubscribe_token', tokens)
      .select('id')

    // Not-yet-migrated DB (`unsubscribed_at` column missing) — retry the plain
    // status flip rather than failing the unsubscribe itself.
    if (error?.message?.includes('unsubscribed_at')) {
      ;({ data, error } = await supabase
        .from('alerts')
        .update({ status: 'unsubscribed' })
        .in('unsubscribe_token', tokens)
        .select('id'))
    }

    if (error) {
      console.error('[alerts/unsubscribe] update failed:', error.message)
      return false
    }
    return !!data && data.length > 0
  } catch (err) {
    console.error('[alerts/unsubscribe] error:', err)
    return false
  }
}

// One-click unsubscribe. Every alert email links here with the row's
// `unsubscribe_token`; we flip the alert to unsubscribed (works from any prior
// state — pending or confirmed) and land the visitor on a friendly status page.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  // Unsubscribed lands with the FULL token list forwarded, so the status
  // page's recovery box ("get fewer emails instead" — see pauseAlertByToken
  // et al.) can apply to every alert a combined-send unsubscribed, not just
  // the first. The status page and the *ByToken actions both parse this the
  // same way (parseAlertTokens), so a single-token link behaves exactly as
  // before.
  const dest = (state: string) =>
    NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=${state}${state === 'unsubscribed' && token ? `&token=${encodeURIComponent(token)}` : ''}`
    )

  if (!token) return dest('invalid')
  const ok = await applyUnsubscribe(token)
  return dest(ok ? 'unsubscribed' : 'invalid')
}

// RFC 8058 one-click unsubscribe. Mail clients (Gmail/Yahoo's native
// "Unsubscribe" button, triggered by the `List-Unsubscribe`/`List-Unsubscribe-Post`
// headers) POST here directly — no user-visible page, no redirect. The RFC
// requires a fast, non-interactive response, so this never redirects to the
// status page the way GET does.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  if (!token) return new NextResponse(null, { status: 400 })
  await applyUnsubscribe(token)
  return new NextResponse(null, { status: 200 })
}
