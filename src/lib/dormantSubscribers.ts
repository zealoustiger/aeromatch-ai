import { createAdminClient } from './supabase-admin'
import { isDormancyAgeAndSendEligible, DORMANT_MIN_AGE_MS, DORMANT_MIN_DIGEST_SENDS } from './dormantEligibility'

export type DormantCandidateRow = {
  id: string
  email: string
  context: string | null
  unsubscribe_token: string | null
  confirmed_at: string | null
  created_at: string
  digest_sends_count?: number
  repermission_sent_at?: string | null
}

/**
 * Confirmed alerts old enough + sent enough real digests to have had a
 * genuine chance to be read, whose recipient has NEVER opened or clicked a
 * single ClubHanger email per `email_engagement_events` — the deliverability
 * best practice of one-time re-permission before an ignored address quietly
 * erodes sender reputation until it eventually bounces or complains.
 *
 * Strict honesty gate: if `email_engagement_events` has ZERO rows for
 * ANYONE, tracking simply isn't live yet (RESEND_WEBHOOK_SECRET unset, or
 * the webhook isn't registered for `email.opened`/`email.clicked` in the
 * Resend dashboard yet — see the ⚠️ note on `webhooks/resend/route.ts`) —
 * "no engagement anywhere" is not evidence that any one address is
 * disengaged, so the whole check is skipped rather than mislabeling every
 * subscriber as dormant. Once tracking is live for at least one address, a
 * candidate's own zero rows (checked by `recipient`) is a real signal, not
 * an absence of one.
 *
 * Fails soft to `[]` if `digest_sends_count`/`repermission_sent_at` aren't
 * migrated live yet, or if `email_engagement_events` itself doesn't exist —
 * same graceful-fallback convention as every other `alerts.*` column.
 */
export async function getDormantSubscribers(nowIso: string, cap = 25): Promise<DormantCandidateRow[]> {
  const admin = createAdminClient()
  const cutoff = new Date(new Date(nowIso).getTime() - DORMANT_MIN_AGE_MS).toISOString()

  const { data, error } = (await admin
    .from('alerts')
    .select('id, email, context, unsubscribe_token, confirmed_at, created_at, digest_sends_count, repermission_sent_at')
    .in('status', ['confirmed', 'active'])
    .gte('digest_sends_count', DORMANT_MIN_DIGEST_SENDS)
    .is('repermission_sent_at', null)
    .lte('confirmed_at', cutoff)) as { data: DormantCandidateRow[] | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('digest_sends_count') || error.message?.includes('repermission_sent_at')) {
      console.warn('[dormantSubscribers] digest_sends_count/repermission_sent_at not migrated live yet — skipping')
    } else {
      console.error('[dormantSubscribers] fetch error:', error.message)
    }
    return []
  }

  const candidates = (data ?? []).filter((row) => row.unsubscribe_token && isDormancyAgeAndSendEligible(row, nowIso))
  if (candidates.length === 0) return []

  const { count: anyEngagementRows, error: engagementError } = await admin
    .from('email_engagement_events')
    .select('id', { count: 'exact', head: true })
  if (engagementError || !anyEngagementRows) return []

  const eligible: DormantCandidateRow[] = []
  for (const row of candidates) {
    if (eligible.length >= cap) break
    const { count: ownRows } = await admin
      .from('email_engagement_events')
      .select('id', { count: 'exact', head: true })
      .eq('recipient', row.email.toLowerCase())
    if (ownRows && ownRows > 0) continue
    eligible.push(row)
  }
  return eligible
}
