import type { AircraftForSale, Partnership } from './types'

export type SavedAlertNoun = 'aircraft' | 'partnership'

export interface SavedAlertContext {
  /** The make to name in the alert copy, e.g. "Cessna". */
  context: string
  sourcePath: string
  noun: SavedAlertNoun
}

/** Picks the unambiguous plurality key from a list of non-empty strings, or null
 *  when there's a tie (or no candidates) — the shared honesty rule for both the
 *  make pass and the model pass below: a 3-way tie of one-each is "too mixed to
 *  name honestly" (GOAL.md's honesty gate). */
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
 * Derives a family-scoped alert suggestion from a visitor's saved aircraft-for-sale
 * and partnership listings ("you keep saving Cessnas" -> a one-tap alert instead of
 * a generic one). Only names a make when it's an unambiguous plurality across the
 * saves — a 3-way tie of one-each is "too mixed to name honestly" (GOAL.md's
 * honesty gate), so callers should fall back to the generic (no-context) box when
 * this returns null. Seeker saves are excluded: a saved seeker's `preferred_makes`
 * describes what THAT pilot wants, not the saver's own taste.
 *
 * When the winning make's own saves also cluster on one model (same plurality +
 * tie-breaking rule, scoped to that make), sharpens further to model-level ("Cessna
 * 172" instead of just "Cessna") — otherwise falls back to make-level exactly as
 * before.
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
  const items: Array<{ make: string | null; model: string | null }> = noun === 'partnership' ? partnerships : aircraft
  const topModel = topByPlurality(
    items
      .filter((item) => item.make?.trim() === topMake)
      .map((item) => item.model?.trim())
      .filter((model): model is string => Boolean(model))
  )

  const params = new URLSearchParams({ make: topMake })
  if (topModel) params.set('model', topModel)
  const context = topModel ? `${topMake} ${topModel}` : topMake
  const sourcePath = noun === 'partnership'
    ? `/partnerships?${params.toString()}`
    : `/aircraft?${params.toString()}`

  return { context, sourcePath, noun }
}
