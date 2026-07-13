/**
 * "Snooze 30 days" for an alert (GOAL.md: pause today is all-or-nothing; a
 * buyer traveling or mid-analysis-paralysis needs a middle ground). Stored as
 * `alerts.paused_until` alongside the existing `status: 'paused'` — the digest
 * cron auto-resumes a row once its `paused_until` has passed, and the resume
 * date shown in the UI/copy must always be the real stored date, never a vague
 * "we'll check back soon" (GOAL.md's honesty bar).
 *
 * Pure + deterministic: callers pass `nowIso` explicitly (no `Date.now()`
 * inside) so this is testable without the clock — mirrors alertFrequency.ts /
 * priceDrops.ts.
 */

const SNOOZE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

/** The `paused_until` timestamp to store when snoozing right now. */
export function resolveSnoozeUntil(nowIso: string): string {
  return new Date(new Date(nowIso).getTime() + SNOOZE_DAYS * DAY_MS).toISOString()
}

/** True when a stored `paused_until` has passed as of `nowIso` — the digest
 *  cron's auto-resume check. `null`/unparseable never counts as expired (an
 *  indefinite pause, or a not-yet-migrated column, stays paused). */
export function isSnoozeExpired(pausedUntil: string | null, nowIso: string): boolean {
  if (!pausedUntil) return false
  const untilMs = new Date(pausedUntil).getTime()
  const nowMs = new Date(nowIso).getTime()
  if (Number.isNaN(untilMs) || Number.isNaN(nowMs)) return false
  return untilMs <= nowMs
}

/** Human-readable resume date for UI/email copy, e.g. "Aug 12, 2026". Returns
 *  null for an unparseable/missing value so callers can fall back to the
 *  plain "Paused" label instead of printing "Invalid Date". */
export function formatResumeDate(pausedUntil: string | null): string | null {
  if (!pausedUntil) return null
  const d = new Date(pausedUntil)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
