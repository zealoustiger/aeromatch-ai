import { createAdminClient } from './supabase-admin'
import { MIN_CHIP_WATCHERS_TO_SHOW, tallyChipWatchers } from './alertChipWatcherTally'

export { MIN_CHIP_WATCHERS_TO_SHOW, tallyChipWatchers }

/**
 * Real distinct-subscriber counts for a set of curated chip `source_path`s,
 * aggregated across all confirmed alerts. The `alerts` table is PII-protected
 * (no public SELECT — it holds emails), so this reads via the service-role
 * client, exactly like `getSaveCounts`; only integer counts are ever returned,
 * never which addresses subscribed, so no subscriber identity is exposed.
 * Fails soft to an empty map on any error — chips just render with no count.
 *
 * The caller applies the `MIN_CHIP_WATCHERS_TO_SHOW` honesty gate (so
 * sub-threshold counts never even reach the client).
 */
export async function getChipWatcherCounts(sourcePaths: string[]): Promise<Map<string, number>> {
  const paths = [...new Set(sourcePaths.filter(Boolean))]
  if (paths.length === 0) return new Map()
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('alerts')
      .select('email, source_path')
      .eq('status', 'confirmed')
      .in('source_path', paths)
    return tallyChipWatchers((data ?? []) as { email: string | null; source_path: string | null }[])
  } catch {
    // Non-fatal: chips just render with no watcher-count line.
    return new Map()
  }
}
