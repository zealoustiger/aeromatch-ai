import type { CompResult } from './aircraftComps'

/**
 * Reorder a set of already-fetched candidate rows (newest-first, per the
 * caller's DB `order`) so the biggest honest below-market deal leads —
 * powers the alert digest email's "best listing alert email in aviation"
 * bar (GOAL.md): a subscriber shouldn't have to scroll past three
 * at-market listings to find the one 20% under.
 *
 * Pure, stable re-sort — no DB, no widening of the candidate pool. Takes a
 * `getComp` callback (rather than computing `compVsMarket` itself) so this
 * stays a standalone, dependency-free, unit-testable module — `aircraftComps.ts`
 * pulls in `@/lib/seo`/`@/lib/aircraftEstimate` at runtime, which the plain
 * `node --test` runner here can't resolve (no path-alias loader), so nothing
 * that imports it at the top level gets unit coverage.
 *
 *  - Rows whose comp verdict is `'below'` sort first, biggest `pct` discount
 *    first; ties keep their original (newest-first) relative order.
 *  - Every other row (`'near'`/`'above'`/no comp — insufficient family data)
 *    keeps its original relative order, appended after all `'below'` rows.
 *    Never fabricate a rank from missing comp data.
 */
export function rankSamplesByDealQuality<T>(rows: T[], getComp: (row: T) => CompResult | null): T[] {
  return rows
    .map((row, index) => ({ row, index, comp: getComp(row) }))
    .sort((a, b) => {
      const aBelow = a.comp?.kind === 'below'
      const bBelow = b.comp?.kind === 'below'
      if (aBelow && bBelow) return b.comp!.pct - a.comp!.pct || a.index - b.index
      if (aBelow !== bBelow) return aBelow ? -1 : 1
      return a.index - b.index
    })
    .map(({ row }) => row)
}
