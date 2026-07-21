import type { EditableAlertTarget } from './alertEditCriteria'

/**
 * "Is this confirmed alert redundant because a broader alert of the same
 * owner's already covers it?" detector for `/alerts/manage` (GOAL.md: a
 * combined digest that repeats the same listings across two sections reads
 * as spam). Deliberately operates on `EditableAlertTarget` — the same
 * exposed-field shape the edit form + widen nudge already use — rather than
 * the fuller `AlertTarget` in `alertMatchCounts.ts`, so this stays a plain
 * function with zero runtime deps beyond a type-only import (Node's type
 * stripper erases `import type` entirely, so this file has no `@/`-alias
 * runtime import and is safely testable with the plain
 * `node --experimental-strip-types --test` runner — see the header comment
 * on `alertEditCriteria.ts` for why that matters in this codebase).
 *
 * Exact-value comparison only — no range/fuzzy reasoning (a `min_price` of
 * 50000 vs 80000 is a mismatch, not "broader"). Conservative by design: when
 * unsure, no nudge (GOAL.md's honesty gate applies here too — never claim
 * one alert is "covered" unless it provably is).
 */

export interface OverlapCandidate {
  id: string
  status: string
  context: string | null
  target: EditableAlertTarget | null
  /** True when `source_path` carries any criterion NOT exposed on the edit
   *  form (grade/avionics/min_year/keyword/…, see `getHiddenCriteria`). A
   *  hidden criterion could make the real match set narrower than the
   *  exposed fields alone suggest, so any alert with one is excluded from
   *  comparison entirely — never a false "covered" claim from a criterion
   *  this module can't see. */
  hasHiddenCriteria: boolean
}

export interface AlertOverlap {
  narrowerId: string
  broaderId: string
  broaderContext: string
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a.trim().toLowerCase() === b.trim().toLowerCase()
  // `airports: string[]` (partnership/seeker) — order-independent, case-insensitive
  // set equality, same normalization `valuesEqual`'s string branch already applies.
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    const norm = (arr: unknown[]) => [...arr].map((v) => String(v).trim().toUpperCase()).sort()
    const [na, nb] = [norm(a), norm(b)]
    return na.every((v, i) => v === nb[i])
  }
  return a === b
}

/** Every field on `target` that actually constrains the match — blank
 *  strings, an empty `airports` array, and `dealOnly: false` mean "no
 *  constraint," same as unset. */
function definedEntries(target: EditableAlertTarget): [string, unknown][] {
  return Object.entries(target).filter(([key, value]) => {
    if (key === 'type') return false
    if (key === 'dealOnly') return value === true
    if (Array.isArray(value)) return value.length > 0
    return typeof value === 'string' ? value.trim() !== '' : value !== undefined && value !== null
  })
}

/** True when every criterion `broader` defines is also true of `narrower` —
 *  i.e. anything matching `narrower` also matches `broader`. */
function isSubsumedBy(narrower: EditableAlertTarget, broader: EditableAlertTarget): boolean {
  if (narrower.type !== broader.type) return false
  const narrowerRecord = narrower as unknown as Record<string, unknown>
  return definedEntries(broader).every(([key, value]) => valuesEqual(narrowerRecord[key], value))
}

/**
 * For each confirmed, hidden-criteria-free candidate, finds another
 * confirmed, hidden-criteria-free candidate of the same type whose exposed
 * criteria are a strict, exact subset (genuinely broader — fewer defined
 * fields, every one of them matching), and flags the first as redundant.
 * Two alerts with identical criteria (true duplicates) are left alone —
 * neither is "the narrower one," an ambiguous, unhandled case. When more
 * than one broader alert qualifies, picks the one with the fewest defined
 * fields (the clearest, most general reason). Returns a Map keyed by the
 * narrower alert's id.
 */
export function detectOverlappingAlerts(candidates: OverlapCandidate[]): Map<string, AlertOverlap> {
  const overlaps = new Map<string, AlertOverlap>()
  const eligible = candidates.filter((c) => c.status === 'confirmed' && c.target && !c.hasHiddenCriteria)

  for (const narrower of eligible) {
    const narrowerFieldCount = definedEntries(narrower.target!).length
    let best: OverlapCandidate | null = null
    let bestFieldCount = Infinity

    for (const broader of eligible) {
      if (broader.id === narrower.id) continue
      if (broader.target!.type !== narrower.target!.type) continue
      const broaderFieldCount = definedEntries(broader.target!).length
      // Must be a STRICT proper subset — equal-field-count pairs are either
      // exact duplicates or genuinely different criteria, neither of which
      // this slice handles.
      if (broaderFieldCount >= narrowerFieldCount) continue
      if (broaderFieldCount >= bestFieldCount) continue
      if (!isSubsumedBy(narrower.target!, broader.target!)) continue
      best = broader
      bestFieldCount = broaderFieldCount
    }

    if (best) {
      overlaps.set(narrower.id, {
        narrowerId: narrower.id,
        broaderId: best.id,
        broaderContext: best.context || 'your other alert',
      })
    }
  }

  return overlaps
}

/**
 * Single-alert convenience wrapper for the subscribe-time hint (GOAL.md:
 * "heads up, this overlaps an alert you already have" on the success panel,
 * not just `/alerts/manage`). Runs the exact same subsumption rule as
 * `detectOverlappingAlerts` against a synthetic candidate for the
 * newly-submitted target, so a subscriber sees the identical verdict whether
 * they check the manage page or read the confirmation panel. Returns the
 * broader alert's context (never a raw id) when covered, else null — never
 * itself mutates or excludes anything from `existing`.
 */
export function findBroaderOverlapContext(
  newTarget: EditableAlertTarget,
  existing: OverlapCandidate[]
): string | null {
  const NEW_ID = '__new__'
  const overlaps = detectOverlappingAlerts([
    ...existing,
    { id: NEW_ID, status: 'confirmed', context: null, target: newTarget, hasHiddenCriteria: false },
  ])
  return overlaps.get(NEW_ID)?.broaderContext ?? null
}
