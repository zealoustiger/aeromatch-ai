// Deliberately import-free (like alertSendPacing.ts) so its unit test can load it
// under `node --test` with no build step and no live DB/Supabase dependency.

export interface SelfCheckHistoryRun {
  captureSelfCheckOk: boolean | null
  captureSelfCheckStep: string | null
}

export interface SelfCheckHistorySummary {
  /** True once at least one of the considered runs has a non-null self-check result —
   *  i.e. `alert_cron_runs.self_check_ok` is migrated live. False means "not available
   *  yet," never a fabricated pass/fail. */
  migrated: boolean
  /** The most recent run's result — null when unmigrated. */
  lastOk: boolean | null
  lastStep: string | null
  /** Count of failures among the considered runs (unmigrated/no-data runs don't count
   *  either way). */
  failuresConsidered: number
  runsConsidered: number
}

/**
 * Pure rollup over the most recent cron runs — no DB access, so it's unit-testable
 * without a live Supabase connection. `runs` should already be sorted newest-first
 * (see `getCronRunsSince`); only the first `limit` are considered.
 */
export function summarizeSelfCheckHistory(runs: SelfCheckHistoryRun[], limit = 7): SelfCheckHistorySummary {
  const considered = runs.slice(0, limit)
  const withData = considered.filter((r) => r.captureSelfCheckOk !== null)
  return {
    migrated: withData.length > 0,
    lastOk: considered[0]?.captureSelfCheckOk ?? null,
    lastStep: considered[0]?.captureSelfCheckStep ?? null,
    failuresConsidered: withData.filter((r) => r.captureSelfCheckOk === false).length,
    runsConsidered: considered.length,
  }
}

/**
 * Decide whether TODAY's red result warrants a dedicated admin heads-up email,
 * given the prior runs' ok/fail history (`priorOkHistory`, newest first, NOT
 * including today). A passing result never sends. Transition-only otherwise: sends
 * the moment a prior-ok/unmigrated (`null`) run is followed by a failure, then
 * stays quiet through a persistent failure so it doesn't re-email daily — except
 * every 3rd consecutive red day, as a gentle reminder the outage is still live.
 * Generic so both the capture self-check and the deliverability DNS self-check
 * (`deliverabilityDnsCheck.ts`) share one cadence instead of two copies of the
 * same streak math.
 */
export function shouldSendOnRedTransition(priorOkHistory: Array<boolean | null>, todayOk: boolean): boolean {
  if (todayOk) return false
  let priorStreak = 0
  for (const ok of priorOkHistory) {
    if (ok !== false) break
    priorStreak++
  }
  if (priorStreak === 0) return true
  return (priorStreak + 1) % 3 === 0
}

/**
 * Decide whether TODAY's capture self-check failure warrants a dedicated admin
 * heads-up email, given the runs immediately preceding it (`priorRuns`, newest
 * first, NOT including today — a not-yet-inserted row). See
 * `shouldSendOnRedTransition` for the cadence this wraps.
 */
export function shouldSendCaptureSelfCheckAlert(priorRuns: SelfCheckHistoryRun[], todayOk: boolean): boolean {
  return shouldSendOnRedTransition(
    priorRuns.map((r) => r.captureSelfCheckOk),
    todayOk
  )
}
