// Canonical one-tap unsubscribe-reason chips, shared between the client-side
// `UnsubscribeRecover` picker, the token-scoped write action, and the admin
// rollups that read them back — a single source of truth so the three never
// drift on key/label spelling.
export const UNSUBSCRIBE_REASONS = [
  { key: 'too_many_emails', label: 'Too many emails' },
  { key: 'not_relevant', label: 'Not relevant' },
  { key: 'found_aircraft', label: 'Found my aircraft' },
  { key: 'just_done', label: 'Just done' },
] as const

export type UnsubscribeReasonKey = (typeof UNSUBSCRIBE_REASONS)[number]['key']

export const UNSUBSCRIBE_REASON_KEYS: ReadonlySet<string> = new Set(UNSUBSCRIBE_REASONS.map((r) => r.key))

const REASON_LABELS: Record<string, string> = Object.fromEntries(UNSUBSCRIBE_REASONS.map((r) => [r.key, r.label]))

export interface UnsubscribeReasonRow {
  reason: string
  label: string
  countThisWeek: number
  countAllTime: number
}

const DAY_MS = 86_400_000

/**
 * Pure this-week/all-time rollup of recorded unsubscribe reasons. A row with
 * no `unsubscribedAt` (timestamp column not migrated live yet, or genuinely
 * unknown) still counts toward all-time but never toward this-week — no
 * guessed bucket. An unrecognized reason string (e.g. captured before a
 * label was added, or written by a future chip) still shows up under its raw
 * key, never silently dropped. Sorted by all-time count, descending.
 */
export function summarizeUnsubscribeReasons(
  rows: Array<{ reason: string | null; unsubscribedAt: string | null }>,
  now: number = Date.now()
): UnsubscribeReasonRow[] {
  const oneWeekAgo = now - 7 * DAY_MS
  const byReason = new Map<string, { thisWeek: number; allTime: number }>()

  for (const row of rows) {
    if (!row.reason) continue
    const entry = byReason.get(row.reason) ?? { thisWeek: 0, allTime: 0 }
    entry.allTime++
    const at = row.unsubscribedAt ? new Date(row.unsubscribedAt).getTime() : NaN
    if (!Number.isNaN(at) && at >= oneWeekAgo) entry.thisWeek++
    byReason.set(row.reason, entry)
  }

  return [...byReason.entries()]
    .map(([reason, counts]) => ({
      reason,
      label: REASON_LABELS[reason] ?? reason,
      countThisWeek: counts.thisWeek,
      countAllTime: counts.allTime,
    }))
    .sort((a, b) => b.countAllTime - a.countAllTime)
}
