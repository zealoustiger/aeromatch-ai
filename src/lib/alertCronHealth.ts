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
  /** Real email-send failures this run (any `sendEmail` result that wasn't `sent` and
   *  wasn't the deliberate `no-key` dev/staging no-op), summed across every send loop.
   *  Null when `send_failures` isn't migrated live yet — never fabricated as 0. */
  sendFailures: number | null
  /** Sends the run's `SendPacer` deferred to the next run because the route was
   *  approaching its `maxDuration = 60` time budget — never a lost send, just a
   *  not-yet-sent one (see `alertSendPacing.ts`). Null when `deferred_sends` isn't
   *  migrated live yet — never fabricated as 0. */
  deferredSends: number | null
  /** Result of this run's synthetic subscribe→confirm→delete probe (see
   *  `alertCaptureSelfCheck.ts`). Null when `self_check_ok` isn't migrated live yet —
   *  never fabricated as pass or fail. */
  captureSelfCheckOk: boolean | null
  /** Which step the probe failed at ('subscribe' | 'confirm' | 'cleanup'), or null on
   *  a pass or when unmigrated. */
  captureSelfCheckStep: string | null
  /** Deliverability DNS self-check verdicts (see `deliverabilityDnsCheck.ts`) —
   *  'pass' | 'fail' | 'lookup-error', or null when the column isn't migrated live
   *  yet. Never fabricated. */
  dnsSpfStatus: string | null
  dnsDkimStatus: string | null
  dnsDmarcStatus: string | null
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
  send_failures?: number
  deferred_sends?: number
  self_check_ok?: boolean
  self_check_step?: string
  dns_spf_status?: string
  dns_dkim_status?: string
  dns_dmarc_status?: string
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
    sendFailures: row.send_failures ?? null,
    deferredSends: row.deferred_sends ?? null,
    captureSelfCheckOk: row.self_check_ok ?? null,
    captureSelfCheckStep: row.self_check_step ?? null,
    dnsSpfStatus: row.dns_spf_status ?? null,
    dnsDkimStatus: row.dns_dkim_status ?? null,
    dnsDmarcStatus: row.dns_dmarc_status ?? null,
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
