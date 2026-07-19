import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

// One-click accept for a "want this alert too?" suggestion — GET-only, same
// precedent as `/api/alerts/frequency`, so the link works straight from an
// email client with no page/JS in between. `token` is the sending alert's
// own `unsubscribe_token` (already proven safe to embed in digest emails);
// resolving the owner through it means no second opt-in email is needed —
// the address is already verified. `path` must be the exact source_path the
// email actually offered, so a tampered link can't subscribe someone to an
// arbitrary path. Two callers share this route today (same accept logic,
// different `source` tag for per-placement analytics — GOAL.md's "prove it
// converts"): the digest email's cross-sell suggestion (alertCrossSell.ts /
// buildAlertDigestEmail's `crossSell` option, default `source`) and the
// watched-listing-unavailable email's "email me when similar ones list"
// upgrade (`buildListingUnavailableEmail`'s `crossSell` option, via the same
// `getDigestCrossSell` helper). `source` is allowlisted so the tag can't be
// spoofed to an arbitrary value.
const ALLOWED_SOURCES = new Set(['digest_cross_sell', 'watch_unavailable_email'])

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const context = req.nextUrl.searchParams.get('context')?.trim() ?? ''
  const path = req.nextUrl.searchParams.get('path')?.trim()
  const rawSource = req.nextUrl.searchParams.get('source')?.trim()
  const source = rawSource && ALLOWED_SOURCES.has(rawSource) ? rawSource : 'digest_cross_sell'

  const invalid = () => NextResponse.redirect(`${SITE_URL}/alerts/status?state=invalid`)
  if (!token || !path) return invalid()

  try {
    const admin = createAdminClient()
    const { data: owner } = await admin.from('alerts').select('email').eq('unsubscribe_token', token).maybeSingle()
    if (!owner?.email) return invalid()

    const payload: Record<string, unknown> = {
      email: owner.email,
      context: context || null,
      source_path: path,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirm_token: crypto.randomUUID(),
      unsubscribe_token: crypto.randomUUID(),
      source,
    }
    let { error } = await admin.from('alerts').insert(payload)
    if (error && error.code !== '23505' && error.message?.includes('source')) {
      delete payload.source
      ;({ error } = await admin.from('alerts').insert(payload))
    }
    // 23505 = unique_violation on (email, source_path) — already subscribed,
    // idempotent success (a re-click of the same email link).
    if (error && error.code !== '23505') {
      console.error('[alerts/digest-cross-sell] insert failed:', error.message)
      return invalid()
    }

    return NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=cross_sell_added&context=${encodeURIComponent(context)}&token=${encodeURIComponent(token)}&source=${encodeURIComponent(source)}`
    )
  } catch (err) {
    console.error('[alerts/digest-cross-sell] error:', err)
    return invalid()
  }
}
