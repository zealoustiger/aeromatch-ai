/**
 * Pure helpers for an editable, comma-separated value list held in a single text
 * input (e.g. the seeker form's free-text "Preferred Makes" / "Preferred Models").
 *
 * Used to back one-tap suggestion chips over a multi-value field: a `<datalist>`
 * can only suggest the *whole* input value, so it's useless once a 2nd value is
 * typed — toggling tokens in/out of the comma string is the right affordance.
 *
 * Matching is case-insensitive, but kept tokens preserve their original casing
 * and order; free-typed values the chips don't know about are never dropped.
 */

/** Split a comma-separated string into trimmed, non-empty tokens. */
export function parseCsvList(csv: string | null | undefined): string[] {
  if (!csv) return []
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** True if `item` is present in the list (case-insensitive). */
export function hasCsvItem(csv: string | null | undefined, item: string): boolean {
  const needle = item.trim().toLowerCase()
  if (!needle) return false
  return parseCsvList(csv).some((t) => t.toLowerCase() === needle)
}

/**
 * Toggle `item` in the comma-separated list: remove it if present (case-insensitive,
 * dropping every casing variant), else append it. Other tokens — including ones the
 * caller's chip set doesn't know about — are preserved verbatim, in order. Returns
 * the rejoined `", "`-separated string ('' when the list ends up empty).
 */
export function toggleCsvItem(csv: string | null | undefined, item: string): string {
  const value = item.trim()
  if (!value) return parseCsvList(csv).join(', ')
  const needle = value.toLowerCase()
  const list = parseCsvList(csv)
  const present = list.some((t) => t.toLowerCase() === needle)
  const next = present
    ? list.filter((t) => t.toLowerCase() !== needle)
    : [...list, value]
  return next.join(', ')
}
