import { createAdminClient } from '@/lib/supabase-admin'

// A hard bounce means the address is dead — pause every non-unsubscribed
// alert for it under a distinct 'bounced' status (not reusing 'paused', so
// `/alerts/manage` can explain *why* and the subscriber isn't left thinking
// they did it themselves). The digest cron only ever queries `status =
// 'confirmed'`, so this alone stops future sends — no cron change needed.
// Mirrors `pauseAllAlerts`'s scoped-update shape in `src/app/actions.ts`.
export async function pauseAlertsForBouncedEmail(email: string): Promise<{ count: number }> {
  const admin = createAdminClient()
  // bounced_at and paused_at may independently be un-migrated live — retry
  // dropping whichever one the error names, up to once each (order-
  // independent), same graceful-fallback pattern as unsubscribeAlertsForComplainedEmail
  // below. Without this retry, a not-yet-migrated `bounced_at` column would
  // silently fail the WHOLE bounce-pause (not just the timestamp).
  let payload: Record<string, unknown> = {
    status: 'bounced',
    bounced_at: new Date().toISOString(),
    paused_at: null,
  }
  const optionalKeys = ['bounced_at', 'paused_at']
  let { data, error } = await admin
    .from('alerts')
    .update(payload)
    .eq('email', email.toLowerCase())
    .in('status', ['pending', 'confirmed', 'paused'])
    .select('id')
  for (
    let i = 0;
    i < optionalKeys.length && error && optionalKeys.some((k) => k in payload && error!.message?.includes(k));
    i++
  ) {
    const dropKey = optionalKeys.find((k) => k in payload && error!.message?.includes(k))!
    payload = Object.fromEntries(Object.entries(payload).filter(([k]) => k !== dropKey))
    ;({ data, error } = await admin
      .from('alerts')
      .update(payload)
      .eq('email', email.toLowerCase())
      .in('status', ['pending', 'confirmed', 'paused'])
      .select('id'))
  }
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
  // unsubscribed_at, paused_at, and bounced_at may independently be
  // un-migrated live — retry dropping whichever one the error names, up to
  // once each (order-independent), same graceful-fallback pattern as every
  // other alerts.* column. Can hit a row coming from 'paused' or 'bounced',
  // so clear both alongside setting unsubscribed_at.
  let payload: Record<string, unknown> = {
    status: 'unsubscribed',
    unsubscribed_at: new Date().toISOString(),
    paused_at: null,
    bounced_at: null,
  }
  const optionalKeys = ['unsubscribed_at', 'paused_at', 'bounced_at']
  let { data, error } = await admin
    .from('alerts')
    .update(payload)
    .eq('email', email.toLowerCase())
    .in('status', ['pending', 'confirmed', 'paused', 'bounced'])
    .select('id')
  for (
    let i = 0;
    i < optionalKeys.length && error && optionalKeys.some((k) => k in payload && error!.message?.includes(k));
    i++
  ) {
    const dropKey = optionalKeys.find((k) => k in payload && error!.message?.includes(k))!
    payload = Object.fromEntries(Object.entries(payload).filter(([k]) => k !== dropKey))
    ;({ data, error } = await admin
      .from('alerts')
      .update(payload)
      .eq('email', email.toLowerCase())
      .in('status', ['pending', 'confirmed', 'paused', 'bounced'])
      .select('id'))
  }
  if (error) return { count: 0 }
  return { count: data?.length ?? 0 }
}
