import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'
import { nextLighterFrequency, normalizeFrequency, type AlertFrequency } from '@/lib/alertFrequency'
import { parseAlertTokens } from '@/lib/alertTokenList'

export const dynamic = 'force-dynamic'

// One-click cadence switch — the digest/price-drop email footer's "Get fewer
// emails" link (daily→weekly) and the busy-digest "switch to daily" upgrade
// nudge (weekly→daily) both land here (see UnsubscribeRecover's "Switch to
// weekly" button for the same daily→weekly action reached via the
// unsubscribe-recovery path). Service role, because anon can't UPDATE
// `alerts` (RLS). Same graceful-degrade precedent as
// `updateAlertFrequencyByToken` in actions.ts: if the `frequency` column
// isn't migrated live yet, retry with no-op status so the click still lands
// on an honest confirmation instead of an error. `token` may be a single
// alert's token or, from a combined-digest email, a comma-separated list
// (see `parseAlertTokens`) — every matching row gets the same literal `dir`.
async function applyFrequency(token: string, dir: AlertFrequency): Promise<boolean> {
  const tokens = parseAlertTokens(token)
  if (!tokens.length) return false
  try {
    const supabase = createAdminClient()
    let { data, error } = await supabase
      .from('alerts')
      .update({ frequency: normalizeFrequency(dir) })
      .in('unsubscribe_token', tokens)
      .select('id')

    if (error && error.message?.includes('frequency')) {
      ;({ data, error } = await supabase.from('alerts').select('id').in('unsubscribe_token', tokens))
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

// Combined-digest "Get fewer emails" — unlike `applyFrequency`'s single
// literal target, a combined send can cover alerts sitting at DIFFERENT
// cadences (the digest cron groups due alerts by email, not by frequency),
// so one target for all of them would silently promote an already-weekly
// alert straight past monthly, or demote a daily one two rungs at once.
// Instead every covered row steps down ONE rung from its OWN current
// cadence: daily rows → weekly, weekly rows → monthly, monthly rows
// untouched (no lighter rung — see `nextLighterFrequency`). Two scoped
// updates rather than a read-then-write per row. Same graceful-degrade
// precedent as `applyFrequency` if `frequency` isn't migrated live yet.
async function applyFrequencyStep(token: string): Promise<boolean> {
  const tokens = parseAlertTokens(token)
  if (!tokens.length) return false
  try {
    const supabase = createAdminClient()
    let steppedAny = false
    for (const from of ['daily', 'weekly'] as const) {
      const to = nextLighterFrequency(from)
      const { data, error } = await supabase
        .from('alerts')
        .update({ frequency: to })
        .in('unsubscribe_token', tokens)
        .eq('frequency', from)
        .select('id')

      if (error) {
        if (error.message?.includes('frequency')) continue
        console.error('[alerts/frequency] step update failed:', error.message)
        return false
      }
      if (data && data.length > 0) steppedAny = true
    }
    if (steppedAny) return true
    // Nothing needed stepping (every covered alert already monthly, or the
    // `frequency` column isn't migrated live yet) — the link should still
    // resolve as valid, rather than "invalid", as long as the tokens are
    // real rows.
    const { data, error } = await supabase.from('alerts').select('id').in('unsubscribe_token', tokens)
    return !error && !!data && data.length > 0
  } catch (err) {
    console.error('[alerts/frequency] step error:', err)
    return false
  }
}

// GET-only — every digest/price-drop email footer links here directly with
// the row's `unsubscribe_token` (or, from a combined digest, every covered
// alert's token comma-joined): with no `dir` (or `dir=weekly`) for the
// daily-only "fewer emails" link, `dir=monthly` for the weekly-only "fewer
// emails" link, `dir=daily` for the weekly-only "switch to daily" upgrade
// nudge, or `dir=step` for the combined digest's "Get fewer emails" link
// (see `applyFrequencyStep`). Mirrors `/api/alerts/unsubscribe`'s GET
// redirect pattern. Defaults to `weekly` so every link already sent before
// this change keeps working byte-for-byte.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const rawDir = req.nextUrl.searchParams.get('dir')
  const dest = (state: string) =>
    NextResponse.redirect(
      `${SITE_URL}/alerts/status?state=${state}${(state === 'weekly' || state === 'daily' || state === 'monthly' || state === 'fewer') && token ? `&token=${encodeURIComponent(token)}` : ''}`
    )

  if (!token) return dest('invalid')

  if (rawDir === 'step') {
    const ok = await applyFrequencyStep(token)
    return dest(ok ? 'fewer' : 'invalid')
  }

  const dir: AlertFrequency = rawDir === 'daily' ? 'daily' : rawDir === 'monthly' ? 'monthly' : 'weekly'
  const ok = await applyFrequency(token, dir)
  return dest(ok ? dir : 'invalid')
}
