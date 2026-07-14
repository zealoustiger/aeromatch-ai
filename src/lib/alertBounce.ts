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
