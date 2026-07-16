import { createAdminClient } from './supabase-admin'

export interface EmailEngagementRow {
  emailType: string
  opened: number
  clicked: number
}

type EventRow = {
  event_type: string
  email_type: string | null
}

// Most recent rows are enough for a "which templates get read" signal — this
// isn't a billing/audit table, and capping keeps the admin page fast even
// once engagement has been logging for months.
const ROLLUP_ROW_LIMIT = 5000

/**
 * Per-email-type opened/clicked counts for the /admin/alerts "Email
 * engagement" panel. Returns `[]` on any error, including the
 * `email_engagement_events` table not being migrated onto the live DB yet —
 * same fail-soft convention as `alertCronHealth.ts`. Untagged/legacy events
 * (no `type` tag on the original send) bucket under `"untagged"` rather than
 * being silently dropped, so the totals still add up.
 */
export async function getEmailEngagementRollup(): Promise<EmailEngagementRow[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('email_engagement_events')
      .select('event_type, email_type')
      .order('created_at', { ascending: false })
      .limit(ROLLUP_ROW_LIMIT)
    if (error || !data) return []

    const counts = new Map<string, { opened: number; clicked: number }>()
    for (const row of data as EventRow[]) {
      const key = row.email_type || 'untagged'
      const entry = counts.get(key) ?? { opened: 0, clicked: 0 }
      if (row.event_type === 'opened') entry.opened++
      else if (row.event_type === 'clicked') entry.clicked++
      counts.set(key, entry)
    }

    return Array.from(counts.entries())
      .map(([emailType, { opened, clicked }]) => ({ emailType, opened, clicked }))
      .sort((a, b) => b.opened + b.clicked - (a.opened + a.clicked))
  } catch {
    return []
  }
}
