/**
 * Pure (DB-free) tally helpers for `/alerts` curated-chip social proof. Kept
 * separate from `alertChipWatcherCounts.ts` — which imports the service-role
 * client — so this logic is unit-testable under `node --test` without pulling a
 * Supabase client into the test.
 */

/** Minimum genuine distinct confirmed subscribers before a "N watching" count
 *  renders on a curated `/alerts` chip. Unlike the single-listing watch line
 *  (`alertWatcherCounts.ts`, floor 1), a curated make/model/state alert is a
 *  broad search — social proof there should read as a real crowd, not one
 *  person, so the floor is higher (GOAL.md: never fabricate/inflate; suppress
 *  below threshold rather than show a weak number). */
export const MIN_CHIP_WATCHERS_TO_SHOW = 3

/**
 * Tally distinct confirmed subscribers per exact `source_path`. Emails are
 * lower-cased + trimmed before de-duping so the same pilot never counts twice
 * (the `alerts` table's `unique(email, source_path)` already prevents dup rows,
 * but this stays correct even if that ever loosens). Rows with a missing
 * email/path are skipped.
 */
export function tallyChipWatchers(
  rows: { email: string | null; source_path: string | null }[]
): Map<string, number> {
  const byPath = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!row.source_path || !row.email) continue
    const key = row.email.trim().toLowerCase()
    if (!key) continue
    let set = byPath.get(row.source_path)
    if (!set) {
      set = new Set<string>()
      byPath.set(row.source_path, set)
    }
    set.add(key)
  }
  const counts = new Map<string, number>()
  for (const [path, set] of byPath) counts.set(path, set.size)
  return counts
}
