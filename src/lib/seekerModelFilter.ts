/** `preferred_models` is free text on a seeker row (e.g. "172, 182, PA-28"), not a
 *  controlled/array column — split it into clean, de-duped tokens. Exported so the
 *  filter-matching logic and the option-ranking share one definition of a "model
 *  token", and so it's unit-testable without pulling in Supabase/Next imports. */
export function parsePreferredModelTokens(raw: string | null | undefined): string[] {
  if (!raw) return []
  return [...new Set(raw.split(',').map((v) => v.trim()).filter(Boolean))]
}

/** Does this seeker's free-text `preferred_models` include ANY of the selected model
 *  tokens (case-insensitive, exact-token match — not substring, so "172" never matches
 *  "172RG")? Used to filter in JS rather than in SQL (see getSeekers in seekersQuery.ts). */
export function matchesModelFilter(preferredModels: string | null | undefined, selected: string[]): boolean {
  if (!selected.length) return true
  const wanted = new Set(selected.map((m) => m.toLowerCase()))
  return parsePreferredModelTokens(preferredModels).some((m) => wanted.has(m.toLowerCase()))
}
