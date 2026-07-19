import { createAdminClient } from './supabase-admin'

export interface EmailEngagementRow {
  emailType: string
  opened: number
  clicked: number
  /** Distinct non-null `recipient` addresses for this email type — reach,
   *  not raw event volume (one person opening 5 times counts once). 0 when
   *  the `recipient` column isn't migrated yet, never a fabricated guess. */
  recipients: number
}

type EventRow = {
  event_type: string
  email_type: string | null
  recipient?: string | null
}

// Most recent rows are enough for a "which templates get read" signal — this
// isn't a billing/audit table, and capping keeps the admin page fast even
// once engagement has been logging for months.
const ROLLUP_ROW_LIMIT = 5000

/**
 * Per-email-type opened/clicked counts (plus distinct-recipient reach) for
 * the /admin/alerts "Email engagement" panel. Returns `[]` on any error,
 * including the `email_engagement_events` table not being migrated onto the
 * live DB yet — same fail-soft convention as `alertCronHealth.ts`.
 * Untagged/legacy events (no `type` tag on the original send) bucket under
 * `"untagged"` rather than being silently dropped, so the totals still add up.
 */
export async function getEmailEngagementRollup(): Promise<EmailEngagementRow[]> {
  try {
    const admin = createAdminClient()
    let { data, error } = (await admin
      .from('email_engagement_events')
      .select('event_type, email_type, recipient')
      .order('created_at', { ascending: false })
      .limit(ROLLUP_ROW_LIMIT)) as unknown as { data: EventRow[] | null; error: { code?: string } | null }

    if (error?.code === '42703' || error?.code === 'PGRST204') {
      // `recipient` isn't migrated on every environment yet — retry without
      // it so opened/clicked totals still render; recipients falls back to 0
      // below rather than guessing.
      ;({ data, error } = (await admin
        .from('email_engagement_events')
        .select('event_type, email_type')
        .order('created_at', { ascending: false })
        .limit(ROLLUP_ROW_LIMIT)) as unknown as { data: EventRow[] | null; error: { code?: string } | null })
    }
    if (error || !data) return []

    const counts = new Map<string, { opened: number; clicked: number; recipients: Set<string> }>()
    for (const row of data as EventRow[]) {
      const key = row.email_type || 'untagged'
      const entry = counts.get(key) ?? { opened: 0, clicked: 0, recipients: new Set<string>() }
      if (row.event_type === 'opened') entry.opened++
      else if (row.event_type === 'clicked') entry.clicked++
      if (row.recipient) entry.recipients.add(row.recipient)
      counts.set(key, entry)
    }

    return Array.from(counts.entries())
      .map(([emailType, { opened, clicked, recipients }]) => ({
        emailType,
        opened,
        clicked,
        recipients: recipients.size,
      }))
      .sort((a, b) => b.opened + b.clicked - (a.opened + a.clicked))
  } catch {
    return []
  }
}

export interface EmailEngagementWeeklyRollup {
  openedThisWeek: number
  openedLastWeek: number
  clickedThisWeek: number
  clickedLastWeek: number
  openedTotal: number
  clickedTotal: number
}

const EMPTY_WEEKLY_ROLLUP: EmailEngagementWeeklyRollup = {
  openedThisWeek: 0,
  openedLastWeek: 0,
  clickedThisWeek: 0,
  clickedLastWeek: 0,
  openedTotal: 0,
  clickedTotal: 0,
}

const DAY_MS = 86_400_000

/**
 * Week-over-week opened/clicked totals for the Monday admin funnel email's
 * "Email engagement" row (GOAL.md: "prove it converts" — send is not the
 * same as read). Aggregate across all `email_type`s, same all-zero fail-soft
 * convention as `getEmailEngagementRollup` on any error or un-migrated
 * table — the caller renders an honest "no engagement yet" state rather
 * than a fabricated 0.
 */
export async function getEmailEngagementWeeklyRollup(now: number = Date.now()): Promise<EmailEngagementWeeklyRollup> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('email_engagement_events')
      .select('event_type, created_at')
      .order('created_at', { ascending: false })
      .limit(ROLLUP_ROW_LIMIT)
    if (error || !data) return EMPTY_WEEKLY_ROLLUP

    const oneWeekAgo = now - 7 * DAY_MS
    const twoWeeksAgo = now - 14 * DAY_MS
    const result = { ...EMPTY_WEEKLY_ROLLUP }

    for (const row of data as { event_type: string; created_at: string }[]) {
      const isOpened = row.event_type === 'opened'
      const isClicked = row.event_type === 'clicked'
      if (!isOpened && !isClicked) continue

      if (isOpened) result.openedTotal++
      else result.clickedTotal++

      const at = new Date(row.created_at).getTime()
      if (Number.isNaN(at)) continue
      if (at >= oneWeekAgo) {
        if (isOpened) result.openedThisWeek++
        else result.clickedThisWeek++
      } else if (at >= twoWeeksAgo) {
        if (isOpened) result.openedLastWeek++
        else result.clickedLastWeek++
      }
    }

    return result
  } catch {
    return EMPTY_WEEKLY_ROLLUP
  }
}
