import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'
import { normalizeFrequency } from '@/lib/alertFrequency'

export const dynamic = 'force-dynamic'

// One-click "fewer emails" — the digest/price-drop email footer's
// daily-only third link (see UnsubscribeRecover's "Switch to weekly" button
// for the same action reached via the unsubscribe-recovery path). Service
// role, because anon can't UPDATE `alerts` (RLS). Same graceful-degrade
// precedent as `updateAlertFrequencyByToken` in actions.ts: if the
// `frequency` column isn't migrated live yet, retry with no-op status so the
// click still lands on an honest confirmation instead of an error.
async function applyWeeklyFrequency(token: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    let { data, error } = await supabase
      .from('alerts')
      .update({ frequency: normalizeFrequency('weekly') })
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
// the row's `unsubscribe_token` when the alert is on daily cadence. Mirrors
// `/api/alerts/unsubscribe`'s GET redirect pattern.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const dest = (state: string) =>
    NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=${state}${state === 'weekly' && token ? `&token=${encodeURIComponent(token)}` : ''}`
    )

  if (!token) return dest('invalid')
  const ok = await applyWeeklyFrequency(token)
  return dest(ok ? 'weekly' : 'invalid')
}
