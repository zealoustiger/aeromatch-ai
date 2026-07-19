import { createAdminClient } from './supabase-admin'

export interface AlertCronRun {
  id: string
  createdAt: string
  processed: number
  sent: number
  emailsSent: number
  skipped: number
  unparseable: number
  notDue: number
  remindersSent: number
  widenSuggestionsSent: number
  durationMs: number
}

type RunRow = {
  id: string
  created_at: string
  processed: number
  sent: number
  emails_sent: number
  skipped: number
  unparseable: number
  not_due: number
  reminders_sent: number
  widen_suggestions_sent: number
  duration_ms: number
}

function toRun(row: RunRow): AlertCronRun {
  return {
    id: row.id,
    createdAt: row.created_at,
    processed: row.processed,
    sent: row.sent,
    emailsSent: row.emails_sent,
    skipped: row.skipped,
    unparseable: row.unparseable,
    notDue: row.not_due,
    remindersSent: row.reminders_sent,
    widenSuggestionsSent: row.widen_suggestions_sent,
    durationMs: row.duration_ms,
  }
}

/**
 * The most recent `alert-digest` cron run, for the /admin/alerts "Last run" health
 * panel. Returns null on any error, including the `alert_cron_runs` table not being
 * migrated onto the live DB yet — same fail-soft convention as `facilityRatings.ts`.
 */
export async function getLastCronRun(): Promise<AlertCronRun | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alert_cron_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return toRun(data as RunRow)
  } catch {
    return null
  }
}

/** Small recent-run history for the health panel's trend list. Empty on any error. */
export async function getRecentCronRuns(limit = 5): Promise<AlertCronRun[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alert_cron_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as RunRow[]).map(toRun)
  } catch {
    return []
  }
}

/**
 * Every run since `sinceMs`, for the Monday admin email's week-over-week cron
 * reliability line (`alertFunnelWeekly.ts`) — unlike `getRecentCronRuns`, this is
 * date-bounded rather than count-bounded, so a WoW comparison stays accurate
 * regardless of how many runs happened. Empty on any error, including the table
 * not being migrated live yet — same fail-soft convention as the others above.
 */
export async function getCronRunsSince(sinceMs: number): Promise<AlertCronRun[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('alert_cron_runs')
      .select('*')
      .gte('created_at', new Date(sinceMs).toISOString())
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as RunRow[]).map(toRun)
  } catch {
    return []
  }
}
