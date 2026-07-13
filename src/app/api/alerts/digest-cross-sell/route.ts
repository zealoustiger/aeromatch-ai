import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

// One-click accept for the digest email's cross-sell suggestion (see
// alertCrossSell.ts / buildAlertDigestEmail's `crossSell` option) — GET-only,
// same precedent as `/api/alerts/frequency`, so the link works straight from
// an email client with no page/JS in between. `token` is the sending alert's
// own `unsubscribe_token` (already proven safe to embed in digest emails);
// resolving the owner through it means no second opt-in email is needed —
// the address is already verified. `path` must be the exact source_path the
// digest actually offered, so a tampered link can't subscribe someone to an
// arbitrary path.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const context = req.nextUrl.searchParams.get('context')?.trim() ?? ''
  const path = req.nextUrl.searchParams.get('path')?.trim()

  const invalid = () => NextResponse.redirect(`${SITE_URL}/alerts/status?state=invalid`)
  if (!token || !path) return invalid()

  try {
    const admin = createAdminClient()
    const { data: owner } = await admin.from('alerts').select('email').eq('unsubscribe_token', token).maybeSingle()
    if (!owner?.email) return invalid()

    const { error } = await admin.from('alerts').insert({
      email: owner.email,
      context: context || null,
      source_path: path,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirm_token: crypto.randomUUID(),
      unsubscribe_token: crypto.randomUUID(),
    })
    // 23505 = unique_violation on (email, source_path) — already subscribed,
    // idempotent success (a re-click of the same email link).
    if (error && error.code !== '23505') {
      console.error('[alerts/digest-cross-sell] insert failed:', error.message)
      return invalid()
    }

    return NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=cross_sell_added&context=${encodeURIComponent(context)}&token=${encodeURIComponent(token)}`
    )
  } catch (err) {
    console.error('[alerts/digest-cross-sell] error:', err)
    return invalid()
  }
}
