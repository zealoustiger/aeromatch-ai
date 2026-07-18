import { createAdminClient } from '@/lib/supabase-admin'

// A hard bounce means the address is dead — pause every non-unsubscribed
// alert for it under a distinct 'bounced' status (not reusing 'paused', so
// `/alerts/manage` can explain *why* and the subscriber isn't left thinking
// they did it themselves). The digest cron only ever queries `status =
// 'confirmed'`, so this alone stops future sends — no cron change needed.
// Mirrors `pauseAllAlerts`'s scoped-update shape in `src/app/actions.ts`.
export async function pauseAlertsForBouncedEmail(email: string): Promise<{ count: number }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('alerts')
    .update({ status: 'bounced' })
    .eq('email', email.toLowerCase())
    .in('status', ['pending', 'confirmed', 'paused'])
    .select('id')
  if (error) return { count: 0 }
  return { count: data?.length ?? 0 }
}

// A spam complaint is a terminal "never email me" signal — unlike a bounce
// (which can be a transient mailbox issue), it's never auto-resumable, so
// this reuses the same `unsubscribed` status the one-click unsubscribe link
// sets rather than `bounced`. `/alerts/manage`'s existing
// `.neq('status', 'unsubscribed')` filter and the digest cron's
// `status = 'confirmed'` query already treat that status correctly with no
// further code change. Mirrors `pauseAlertsForBouncedEmail`'s shape.
export async function unsubscribeAlertsForComplainedEmail(email: string): Promise<{ count: number }> {
  const admin = createAdminClient()
  let { data, error } = await admin
    .from('alerts')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())
    .in('status', ['pending', 'confirmed', 'paused', 'bounced'])
    .select('id')
  // Not-yet-migrated DB (`unsubscribed_at` column missing) — retry the plain
  // status flip, same graceful-fallback pattern as every other alerts.* column.
  if (error?.message?.includes('unsubscribed_at')) {
    ;({ data, error } = await admin
      .from('alerts')
      .update({ status: 'unsubscribed' })
      .eq('email', email.toLowerCase())
      .in('status', ['pending', 'confirmed', 'paused', 'bounced'])
      .select('id'))
  }
  if (error) return { count: 0 }
  return { count: data?.length ?? 0 }
}
