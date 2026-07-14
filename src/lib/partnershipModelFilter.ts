/** `model` on a partnership alert target is a comma-joined multi-select (e.g.
 *  "172,182"), same shape `/partnerships`'s own filter uses — split it into
 *  clean, trimmed tokens. Exported so alert matching (`alertMatchCounts.ts`,
 *  the digest cron) and the browse page's own filter share one definition,
 *  and so it's unit-testable without pulling in Supabase/Next imports. */
export function parsePartnershipModelList(model: string | undefined): string[] {
  if (!model) return []
  return model.split(',').map((m) => m.trim()).filter(Boolean)
}

/** Applies a partnership target's `model` field to a query with the exact same
 *  exact-match OR semantics `/partnerships`'s own filter uses (single `.eq`,
 *  multiple `.in`) — `partnerships.model` is a plain column, unlike aircraft's
 *  `avionics text[]`, so no async classify/narrowing pass is needed here. */
export function applyPartnershipModelFilter(q: any, model: string | undefined): any {
  const models = parsePartnershipModelList(model)
  if (models.length === 1) return q.eq('model', models[0])
  if (models.length > 1) return q.in('model', models)
  return q
}
