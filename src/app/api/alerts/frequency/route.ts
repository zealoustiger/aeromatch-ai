import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'
import { normalizeFrequency, type AlertFrequency } from '@/lib/alertFrequency'

export const dynamic = 'force-dynamic'

// One-click cadence switch — the digest/price-drop email footer's "Get fewer
// emails" link (daily→weekly) and the busy-digest "switch to daily" upgrade
// nudge (weekly→daily) both land here (see UnsubscribeRecover's "Switch to
// weekly" button for the same daily→weekly action reached via the
// unsubscribe-recovery path). Service role, because anon can't UPDATE
// `alerts` (RLS). Same graceful-degrade precedent as
// `updateAlertFrequencyByToken` in actions.ts: if the `frequency` column
// isn't migrated live yet, retry with no-op status so the click still lands
// on an honest confirmation instead of an error.
async function applyFrequency(token: string, dir: AlertFrequency): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    let { data, error } = await supabase
      .from('alerts')
      .update({ frequency: normalizeFrequency(dir) })
      .eq('unsubscribe_token', token)
      .select('id')

    if (error && error.message?.includes('frequency')) {
      ;({ data, error } = await supabase.from('alerts').select('id').eq('unsubscribe_token', token))
    }

    if (error) {
      console.error('[alerts/frequency] update failed:', error.message)
      return false
    }
    return !!data && data.length > 0
  } catch (err) {
    console.error('[alerts/frequency] error:', err)
    return false
  }
}

// GET-only — every digest/price-drop email footer links here directly with
// the row's `unsubscribe_token`: with no `dir` (or `dir=weekly`) for the
// daily-only "fewer emails" link, `dir=monthly` for the weekly-only "fewer
// emails" link, or `dir=daily` for the weekly-only "switch to daily" upgrade
// nudge. Mirrors `/api/alerts/unsubscribe`'s GET redirect pattern. Defaults
// to `weekly` so every link already sent before this change keeps working
// byte-for-byte.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const rawDir = req.nextUrl.searchParams.get('dir')
  const dir: AlertFrequency = rawDir === 'daily' ? 'daily' : rawDir === 'monthly' ? 'monthly' : 'weekly'
  const dest = (state: string) =>
    NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=${state}${(state === 'weekly' || state === 'daily' || state === 'monthly') && token ? `&token=${encodeURIComponent(token)}` : ''}`
    )

  if (!token) return dest('invalid')
  const ok = await applyFrequency(token, dir)
  return dest(ok ? dir : 'invalid')
}
