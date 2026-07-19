import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/seo'
import { snoozeAlertByToken } from '@/app/actions'

export const dynamic = 'force-dynamic'

// GET-only, tokenized "Snooze 30 days" link for the digest email footer —
// mirrors `/api/alerts/frequency`'s one-click pattern, reusing the existing
// `snoozeAlertByToken` action (also used by `UnsubscribeRecover`'s "Snooze"
// button) so a subscriber can pause straight from the inbox with no
// click-through to `/alerts/manage`. `token` may be a single alert's
// `unsubscribe_token` or, from a combined-digest email, every covered
// alert's token comma-joined (see `parseAlertTokens`) — every matching row
// gets snoozed together.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const dest = (state: string) =>
    NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=${state}${state === 'snoozed' && token ? `&token=${encodeURIComponent(token)}` : ''}`
    )

  if (!token) return dest('invalid')

  const result = await snoozeAlertByToken(token)
  return dest(result.error ? 'invalid' : 'snoozed')
}
