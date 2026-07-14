import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

type PendingRow = {
  id: string
  email: string
  pending_email: string | null
  unsubscribe_token: string | null
}

// Confirmation link from `buildAlertEmailChangeConfirmEmail`, sent to the NEW
// address by `requestAlertEmailChange`. `email_change_token` is stamped on
// every row the owner has, so this moves them all in one shot. Anon can't
// UPDATE `alerts` (RLS) — service role, same as every other alerts route.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  const dest = (state: string, extra?: Record<string, string>) => {
    const qs = new URLSearchParams({ state, ...(extra ?? {}) })
    return NextResponse.redirect(`${SITE_URL}/alerts/status?${qs.toString()}`)
  }

  if (!token) return dest('invalid')

  try {
    const admin = createAdminClient()

    const { data: rows, error: fetchError } = await admin
      .from('alerts')
      .select('id, email, pending_email, unsubscribe_token')
      .eq('email_change_token', token)
      .neq('status', 'unsubscribed')

    if (fetchError) {
      console.error('[alerts/confirm-email-change] lookup failed:', fetchError.message)
      return dest('invalid')
    }
    const matched = (rows ?? []) as PendingRow[]
    const target = matched.find((r) => r.pending_email)
    if (!target?.pending_email) return dest('invalid')

    const newEmail = target.pending_email
    const manageToken = matched.find((r) => r.unsubscribe_token)?.unsubscribe_token ?? undefined

    const { error: bulkError } = await admin
      .from('alerts')
      .update({ email: newEmail, pending_email: null, email_change_token: null })
      .eq('email_change_token', token)

    // A unique-constraint conflict (the new address already has an alert with
    // the same source_path) fails the WHOLE batch update at once — retry
    // per-row so one conflicting row can't block the rest of the move. A row
    // that itself conflicts just has its pending fields cleared and stays on
    // the OLD email (never dropped, never silently duplicated).
    if (bulkError?.code === '23505') {
      for (const row of matched) {
        if (!row.pending_email) continue
        const { error: rowError } = await admin
          .from('alerts')
          .update({ email: newEmail, pending_email: null, email_change_token: null })
          .eq('id', row.id)
        if (rowError) {
          await admin.from('alerts').update({ pending_email: null, email_change_token: null }).eq('id', row.id)
        }
      }
    } else if (bulkError) {
      console.error('[alerts/confirm-email-change] update failed:', bulkError.message)
      return dest('invalid')
    }

    return dest('email_changed', {
      newEmail,
      ...(manageToken ? { token: manageToken } : {}),
    })
  } catch (err) {
    console.error('[alerts/confirm-email-change] error:', err)
    return dest('invalid')
  }
}
