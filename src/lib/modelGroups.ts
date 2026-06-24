/**
 * Group near-duplicate aircraft model strings under a canonical parent so the
 * Model filter can offer a single "{base} (all)" option instead of forcing a pilot
 * to tick six variant boxes (e.g. SR20, Sr20 G2, Sr20 G3, SR20-G2, SR20-G3).
 *
 * This is purely a UI-grouping convenience: members carry the EXACT raw DB strings,
 * so selecting a parent just expands to those strings in the existing comma-joined
 * `model` param (`.in('model', members)`) — no query or schema change.
 *
 * The rule is deliberately conservative — it never merges genuinely different
 * models. SR20 vs SR22 and 172 vs 182 stay apart (different keys); turbo/suffix
 * variants like 172N vs 172 also stay apart (no letter-stripping).
 */
export interface ModelGroup {
  /** Display label for the parent, e.g. "SR20" (used as "{key} (all)"). */
  key: string
  /** Exact raw DB model strings in this group, sorted, for the query/`.in()`. */
  members: string[]
}

/**
 * Normalized grouping key for one raw model string:
 * uppercase, then split on `-`, `_`, `/`, and whitespace.
 * - first token has a digit → key = first token   (SR20-G2→SR20, SF50 G2 Plus→SF50, 172→172)
 * - first token is pure alpha → key = first + "-" + second when present
 *   (PA-28-181→PA-28) so Piper families don't all collapse to "PA".
 */
export function modelGroupKey(model: string): string {
  const tokens = model.trim().toUpperCase().split(/[\s\-_/]+/).filter(Boolean)
  if (tokens.length === 0) return model.trim().toUpperCase()
  const first = tokens[0]
  if (/\d/.test(first)) return first
  return tokens.length > 1 ? `${first}-${tokens[1]}` : first
}

/**
 * Group + sort raw model strings. Members are de-duped (exact string) and sorted;
 * groups are sorted by key. Single-member groups are returned too (the caller
 * renders them as a plain checkbox, no parent wrapper).
 */
export function groupModelVariants(models: string[]): ModelGroup[] {
  const byKey = new Map<string, Set<string>>()
  for (const raw of models) {
    const model = raw.trim()
    if (!model) continue
    const key = modelGroupKey(model)
    if (!byKey.has(key)) byKey.set(key, new Set())
    byKey.get(key)!.add(model)
  }
  return [...byKey.entries()]
    .map(([key, set]) => ({
      key,
      members: [...set].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}
