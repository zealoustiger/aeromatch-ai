import { createAdminClient } from './supabase-admin'

/** Minimum genuine confirmed-alert count before a "N buyers get alerts for this"
 *  line renders — below this the signal is too thin to read as real social proof
 *  (GOAL.md: never fabricate/inflate). Below the floor callers just get no line,
 *  mirrors `saveCounts.ts`'s `MIN_SAVES_TO_SHOW`. */
export const MIN_ALERTS_TO_SHOW = 3

/**
 * Real confirmed-alert counts per exact `context` string (e.g. "Cessna 172"),
 * aggregated across ALL subscribers — not just the current visitor. `alerts` has
 * no public SELECT (it holds PII), so this reads via the service-role client.
 * Only counts are returned, never which emails subscribed. Fails soft to an
 * empty map on any error — callers just render with no social-proof line.
 */
export async function getAlertCounts(contexts: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  const wanted = [...new Set(contexts.filter((c) => c && c.trim()))]
  if (wanted.length === 0) return counts
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('alerts')
      .select('context')
      .eq('status', 'confirmed')
      .in('context', wanted)
    for (const row of data ?? []) {
      const context = row.context as string
      counts.set(context, (counts.get(context) ?? 0) + 1)
    }
  } catch {
    // Non-fatal: callers just render with no social-proof line.
  }
  return counts
}
