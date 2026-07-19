/**
 * Anti-abuse cap on confirm emails per address (GOAL.md's never-spam bar,
 * batch #8: "close the confirm-mail bombing hole"). `subscribeToAlerts` is a
 * plain INSERT keyed on (email, source_path) — varying `source_path` on every
 * submit makes each one look like a genuinely new alert, so without this an
 * address can be bombed with confirm mail by resubmitting the same email
 * against different source paths. Per-row resend cooldowns
 * (`last_confirm_sent_at`) don't help here since every submit is a new row.
 *
 * Pure + deterministic: caller passes `nowIso` explicitly (no `Date.now()`
 * inside), same convention as `alertSnooze.ts`/`alertFrequency.ts`.
 */

export const CONFIRM_CAP_WINDOW_MS = 60 * 60 * 1000 // 1 hour
export const CONFIRM_CAP_MAX_SENDS = 3

/**
 * True when this address has already received at least `maxSends` confirm
 * emails within `windowMs` of `nowIso` — the caller should skip sending
 * another one (but still save the row / show the normal success panel).
 * `recentCreatedAtTimestamps` is every OTHER row's `created_at` for this
 * email (the moment each one's confirm email went out); unparseable entries
 * don't count toward the cap (fail open, never fail closed on bad data).
 */
export function isOverConfirmSendCap(
  recentCreatedAtTimestamps: (string | null | undefined)[],
  nowIso: string,
  maxSends: number = CONFIRM_CAP_MAX_SENDS,
  windowMs: number = CONFIRM_CAP_WINDOW_MS
): boolean {
  const nowMs = new Date(nowIso).getTime()
  if (Number.isNaN(nowMs)) return false

  const recentCount = recentCreatedAtTimestamps.filter((ts) => {
    if (!ts) return false
    const sentMs = new Date(ts).getTime()
    if (Number.isNaN(sentMs)) return false
    return sentMs <= nowMs && nowMs - sentMs < windowMs
  }).length

  return recentCount >= maxSends
}
