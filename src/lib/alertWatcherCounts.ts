import { createAdminClient } from './supabase-admin'

/** Minimum genuine watcher count before a "N pilots are watching this listing"
 *  line renders — the backlog's honesty gate is "hidden at 0" (a single real
 *  watcher is still an honest, non-fabricated signal, unlike the noisier
 *  `saveCounts`/`alertCounts` floors). */
export const MIN_WATCHERS_TO_SHOW = 1

/**
 * Real count of confirmed "watch this listing's price" alerts
 * (`?watch=price` source_path, see `alertWatchStatus.ts`) for ONE exact
 * listing, aggregated across ALL subscribers — not just the current visitor.
 * `alerts` has no public SELECT (it holds PII), so this reads via the
 * service-role client. Only a count is returned, never which emails are
 * watching. Fails soft to 0 on any error — callers just render no line.
 */
export async function getWatcherCount(sourcePath: string): Promise<number> {
  try {
    const admin = createAdminClient()
    const { count } = await admin
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .eq('source_path', sourcePath)
    return count ?? 0
  } catch {
    return 0
  }
}
