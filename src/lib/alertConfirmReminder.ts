/**
 * "Still want these alerts?" reminder for a stranded double-opt-in signup —
 * a subscriber who never clicked the original confirm link gets nothing,
 * ever (the digest cron only reads status='confirmed'). Sent exactly ONCE,
 * to a status='pending' row aged 24-72h since signup, guarded by the
 * additive `alerts.confirm_reminder_sent_at` column so it can never repeat.
 *
 * Pure + deterministic: callers pass `nowIso` explicitly (no `Date.now()`
 * inside) — mirrors alertSnooze.ts / alertFrequency.ts.
 */

const DAY_MS = 24 * 60 * 60 * 1000
export const REMINDER_MIN_AGE_MS = DAY_MS
export const REMINDER_MAX_AGE_MS = 3 * DAY_MS

/** The `created_at` range (inclusive) a pending alert must fall in to be
 *  eligible for the reminder this pass — `start` is the older bound (72h
 *  ago), `end` the newer bound (24h ago). */
export function reminderWindow(nowIso: string): { start: string; end: string } {
  const now = new Date(nowIso).getTime()
  return {
    start: new Date(now - REMINDER_MAX_AGE_MS).toISOString(),
    end: new Date(now - REMINDER_MIN_AGE_MS).toISOString(),
  }
}
