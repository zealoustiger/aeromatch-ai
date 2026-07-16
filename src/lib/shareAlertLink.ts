/** Appends `share=alert` to a source_path's query string, so a subscriber can
 *  hand this exact search/watch to a co-buyer — mirrors AlertSignup's own
 *  `withDealOnly` param-layering pattern (no new storage, just a query param
 *  the receiving AlertSignup instance reads client-side). */
export function withShareParam(sourcePath: string): string {
  if (!sourcePath) return sourcePath
  return sourcePath.includes('?') ? `${sourcePath}&share=alert` : `${sourcePath}?share=alert`
}

/** The inverse of `withShareParam` — some callers (e.g. `/aircraft`'s
 *  `alertSourcePath`) build their AlertSignup `sourcePath` prop from the
 *  page's own full active query string, so a visitor arriving via a shared
 *  link would otherwise persist `share=alert` into the STORED source_path
 *  (breaking the digest cron's matching and future dedup-by-sourcePath).
 *  `share` is a pure UI/attribution marker — it must never be part of the
 *  criteria an alert actually matches on, so every read of a `sourcePath`
 *  prop strips it first. */
export function stripShareParam(sourcePath: string): string {
  if (!sourcePath || !sourcePath.includes('share=alert')) return sourcePath
  const [path, query] = sourcePath.split('?')
  if (!query) return sourcePath
  const params = new URLSearchParams(query)
  params.delete('share')
  const rest = params.toString()
  return rest ? `${path}?${rest}` : path
}
