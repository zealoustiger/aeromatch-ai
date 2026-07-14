import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

// One-click "was this digest useful?" vote from a digest email's footer link.
// Service role because anon has no SELECT on `alerts` (it holds PII) and no
// INSERT on `feedback` beyond the public site widget's own policy shape.
// Mirrors /api/alerts/unsubscribe's structure: resolve by `unsubscribe_token`,
// record the vote, redirect to a friendly status page. Fails soft — a bad or
// already-used token lands on the same `invalid` state the other alert
// token routes use, never a raw error page.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const voteRaw = req.nextUrl.searchParams.get('vote')?.trim()
  const vote = voteRaw === 'up' || voteRaw === 'down' ? voteRaw : null

  const dest = (state: string) =>
    NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=${state}${token ? `&token=${encodeURIComponent(token)}` : ''}`
    )

  if (!token || !vote) return dest('invalid')

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alerts')
      .select('email, source_path')
      .eq('unsubscribe_token', token)
      .maybeSingle()

    if (error || !data) return dest('invalid')

    await admin.from('feedback').insert({
      type: 'digest_vote',
      message: vote === 'up' ? '👍 Digest was useful' : '👎 Digest was not useful',
      email: data.email,
      page_path: data.source_path ?? '/alerts/digest',
    })
  } catch (err) {
    console.error('[alerts/digest-feedback] error:', err)
    return dest('invalid')
  }

  return dest(vote === 'up' ? 'digest_feedback_up' : 'digest_feedback_down')
}
