// Pure eligibility rules for the dormant-subscriber re-permission check —
// split out from `dormantSubscribers.ts` (which needs a live Supabase admin
// client) so this logic is unit-testable with a plain `node --test` run, no
// DB/mocking required.

/** A confirmed alert must be at least this old before it's eligible for the
 *  one-time re-permission check — a fresh subscriber who simply hasn't had
 *  time to open a digest yet is not "dormant". */
export const DORMANT_MIN_AGE_MS = 90 * 24 * 60 * 60 * 1000
/** ...and must have received at least this many real digest sends — an old
 *  alert that's rarely matched anything shouldn't trip re-permission just
 *  for being old; it needs a real read on whether mail is landing unread. */
export const DORMANT_MIN_DIGEST_SENDS = 8

export type DormancyEligibilityRow = {
  confirmed_at: string | null
  created_at: string
  digest_sends_count?: number
  repermission_sent_at?: string | null
}

/**
 * Age/send-count/never-sent-before check on the alert row's own fields. Does
 * NOT check per-address engagement (that needs a live `email_engagement_events`
 * read — see `getDormantSubscribers` in `dormantSubscribers.ts`).
 */
export function isDormancyAgeAndSendEligible(row: DormancyEligibilityRow, nowIso: string): boolean {
  if (row.repermission_sent_at) return false
  if ((row.digest_sends_count ?? 0) < DORMANT_MIN_DIGEST_SENDS) return false
  const confirmedAt = row.confirmed_at ?? row.created_at
  const age = new Date(nowIso).getTime() - new Date(confirmedAt).getTime()
  return age >= DORMANT_MIN_AGE_MS
}
