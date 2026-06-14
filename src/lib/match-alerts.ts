import { Partnership, PartnershipSeeker } from './types'
import { getMatchesForPartnership, getMatchesForSeeker } from './matching-server'

/**
 * New-match alert detection.
 *
 * When a listing is created we compute which existing listings on the *other* side
 * now qualify, and "queue" a notification for each. TASK-01 is intentionally
 * schema-free (no migration), so there is no `match_notifications` table yet and no
 * email provider is wired — the would-be sends are logged (no-op) so the detection
 * pipeline is real and testable end-to-end.
 *
 * TODO(owner): (1) persist these to a `match_notifications` queue table (needs a
 * migration — deliberately deferred to keep this task schema-free), and (2) wire an
 * email provider to drain the queue. No new paid email dependency is added here.
 *
 * Both functions are fail-soft: any error returns 0 and never disrupts listing
 * creation.
 */

export async function notifyNewPartnership(partnership: Partnership): Promise<number> {
  try {
    const matches = await getMatchesForPartnership(partnership)
    for (const { seeker, match } of matches) {
      console.info(
        `[match-alert] new partnership ${partnership.id} qualifies seeker ${seeker.id} ` +
          `(${match.score}% match) → would notify ${seeker.contact_email}`
      )
    }
    return matches.length
  } catch {
    return 0
  }
}

export async function notifyNewSeeker(seeker: PartnershipSeeker): Promise<number> {
  try {
    const matches = await getMatchesForSeeker(seeker)
    for (const { partnership, match } of matches) {
      console.info(
        `[match-alert] new seeker ${seeker.id} qualifies partnership ${partnership.id} ` +
          `(${match.score}% match) → would notify ${partnership.contact_email}`
      )
    }
    return matches.length
  } catch {
    return 0
  }
}
