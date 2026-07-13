import type { RecentlyViewedEntry, RecentlyViewedNoun } from './recentlyViewed'

export interface RecentlyViewedAlertContext {
  context: string
  sourcePath: string
  noun: RecentlyViewedNoun
}

/** How many of the recently-viewed log's entries must share one make before it's
 *  honest to say "you've been looking at X" — matches the backlog item's own bar
 *  ("≥3 recent views cluster on one make"), stricter than deriveSavedAlertContext's
 *  plain-plurality rule since a single stray view shouldn't trigger a suggestion. */
const MIN_CLUSTER = 3

/** Picks the unambiguous plurality key from a list of non-empty strings, or null on
 *  a tie (or no candidates) — same honesty rule as `savedAlertContext.ts`'s helper
 *  of the same name (kept as a local copy so this module has no runtime dependency
 *  on that one — the two are duplicated on purpose, not shared, since this project's
 *  node-native unit tests can't resolve extensionless cross-file value imports). */
function topByPlurality(keys: string[]): string | null {
  const totals = new Map<string, number>()
  for (const key of keys) totals.set(key, (totals.get(key) ?? 0) + 1)

  let top: string | null = null
  let topCount = 0
  let tied = false
  for (const [key, count] of totals) {
    if (count > topCount) {
      top = key
      topCount = count
      tied = false
    } else if (count === topCount) {
      tied = true
    }
  }
  return !top || tied ? null : top
}

/**
 * Derives a make/model alert suggestion from a visitor's device-local recently-viewed
 * log ("you've been looking at Cessna 172s" -> a one-tap alert). Mirrors
 * `deriveSavedAlertContext`'s plurality/tie-break rule (a tied make is "too mixed to
 * name honestly"), but additionally requires the winning make to have at least
 * `MIN_CLUSTER` views — three-in-a-row is a real pattern, one stray view isn't.
 */
export function deriveRecentlyViewedAlertContext(
  entries: RecentlyViewedEntry[]
): RecentlyViewedAlertContext | null {
  const topMake = topByPlurality(entries.map((e) => e.make))
  if (!topMake) return null

  const forMake = entries.filter((e) => e.make === topMake)
  if (forMake.length < MIN_CLUSTER) return null

  const nounCounts: Record<RecentlyViewedNoun, number> = { aircraft: 0, partnership: 0 }
  for (const e of forMake) nounCounts[e.noun] += 1
  const noun: RecentlyViewedNoun = nounCounts.partnership > nounCounts.aircraft ? 'partnership' : 'aircraft'

  const topModel = topByPlurality(
    forMake.map((e) => e.model).filter((m): m is string => Boolean(m))
  )

  const params = new URLSearchParams({ make: topMake })
  if (topModel) params.set('model', topModel)
  const context = topModel ? `${topMake} ${topModel}` : topMake
  const sourcePath = noun === 'partnership' ? `/partnerships?${params.toString()}` : `/aircraft?${params.toString()}`

  return { context, sourcePath, noun }
}
