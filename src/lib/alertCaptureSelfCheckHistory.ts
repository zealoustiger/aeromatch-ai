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
