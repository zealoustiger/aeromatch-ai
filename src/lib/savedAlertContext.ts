import type { AircraftForSale, Partnership } from './types'

export type SavedAlertNoun = 'aircraft' | 'partnership'

export interface SavedAlertContext {
  /** The make to name in the alert copy, e.g. "Cessna". */
  context: string
  sourcePath: string
  noun: SavedAlertNoun
}

/**
 * Derives a family-scoped alert suggestion from a visitor's saved aircraft-for-sale
 * and partnership listings ("you keep saving Cessnas" -> a one-tap alert instead of
 * a generic one). Only names a make when it's an unambiguous plurality across the
 * saves — a 3-way tie of one-each is "too mixed to name honestly" (GOAL.md's
 * honesty gate), so callers should fall back to the generic (no-context) box when
 * this returns null. Seeker saves are excluded: a saved seeker's `preferred_makes`
 * describes what THAT pilot wants, not the saver's own taste.
 */
export function deriveSavedAlertContext(
  partnerships: Partnership[],
  aircraft: AircraftForSale[]
): SavedAlertContext | null {
  const totals = new Map<string, number>()
  const byNoun = new Map<string, Record<SavedAlertNoun, number>>()

  const bump = (make: string | null | undefined, noun: SavedAlertNoun) => {
    const key = make?.trim()
    if (!key) return
    totals.set(key, (totals.get(key) ?? 0) + 1)
    const nounCounts = byNoun.get(key) ?? { aircraft: 0, partnership: 0 }
    nounCounts[noun] += 1
    byNoun.set(key, nounCounts)
  }
  for (const p of partnerships) bump(p.make, 'partnership')
  for (const a of aircraft) bump(a.make, 'aircraft')

  if (totals.size === 0) return null

  let topMake: string | null = null
  let topCount = 0
  let tied = false
  for (const [make, count] of totals) {
    if (count > topCount) {
      topMake = make
      topCount = count
      tied = false
    } else if (count === topCount) {
      tied = true
    }
  }
  if (!topMake || tied) return null

  const nounCounts = byNoun.get(topMake)!
  const noun: SavedAlertNoun = nounCounts.partnership > nounCounts.aircraft ? 'partnership' : 'aircraft'
  const sourcePath = noun === 'partnership'
    ? `/partnerships?make=${encodeURIComponent(topMake)}`
    : `/aircraft?make=${encodeURIComponent(topMake)}`

  return { context: topMake, sourcePath, noun }
}
